import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import guest from "../../../../public/data/guest-questions.json";
import { CAT_NAME } from "@/lib/categories";
import { MODULE_QUIZ_SIZE, PASS_THRESHOLD } from "@/lib/config";
import { readMacroSnapshot, readMarketCapsSnapshot } from "@/lib/dataSnapshots";
import { dailyQuestions } from "@/lib/guest";
import { buildLiveQuestions } from "@/lib/liveQuestions";
import { loadGame, loadPlacement, loadQuick, loadTraining, loadWeakness } from "@/lib/loaders";
import { buildMacroQuestions } from "@/lib/macroQuestions";
import { hasFreshMarketCaps } from "@/lib/marketcaps";
import { TOPICS, mentalSession, type Topic } from "@/lib/mental";
import { moduleQuestions } from "@/lib/moduleQuestions";
import { computeStatuses, moduleById, type Progress } from "@/lib/modules";
import { DIFFICULTY_FR, isNumeric, shuffle, type Question } from "@/lib/quiz";
import { gameSeconds, mentalSeconds, type Activity, type QuizMode } from "@/lib/quizSession";
import { todayParis } from "@/lib/rng";

const guestPool = guest as Question[];

function filters(values: unknown, allowed: Record<string, unknown>): string[] | undefined {
  if (!Array.isArray(values) || !values.every((v) => typeof v === "string" && Object.hasOwn(allowed, v))) return;
  return [...new Set(values)] as string[];
}

function parseActivity(value: unknown): Activity | undefined {
  if (!value || typeof value !== "object") return;
  const v = value as Record<string, unknown>;
  if (v.type === "quick" || v.type === "mixed" || v.type === "daily" || v.type === "weakness" || v.type === "placement") return { type: v.type };
  if (v.type === "module" && typeof v.id === "string") return { type: v.type, id: v.id };
  if (v.type === "training") {
    const categories = filters(v.categories, CAT_NAME);
    const levels = filters(v.levels, DIFFICULTY_FR);
    if (categories && levels) return { type: v.type, categories, levels };
  }
  const level = v.level;
  if (typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 5) return;
  if (v.type === "game" && (v.game === "calcul" || v.game === "ordres" || v.game === "culture")) return { type: v.type, game: v.game, level };
  if (v.type === "mental" && (v.topic === null || TOPICS.some((t) => t.id === v.topic)) && typeof v.timed === "boolean") {
    return { type: v.type, level, topic: v.topic as Topic | null, timed: v.timed };
  }
}

function normalizeQuestion(q: Question): Question | null {
  if (!q.id || typeof q.prompt !== "string" || q.correct === null || q.correct === undefined) return null;
  let correct: number | boolean;
  if (q.type === "true_false") {
    if (typeof q.correct === "boolean") correct = q.correct;
    else if (q.correct === "true" || q.correct === "false") correct = q.correct === "true";
    else return null;
  } else {
    if (typeof q.correct !== "number" && (typeof q.correct !== "string" || !q.correct.trim())) return null;
    correct = Number(q.correct);
    if (!Number.isFinite(correct)) return null;
    if (q.type === "mcq") {
      if (!Array.isArray(q.options) || !Number.isInteger(correct) || correct < 0 || correct >= q.options.length) return null;
    } else if (!isNumeric(q)) return null;
  }
  return {
    ...q, id: String(q.id), correct, tolerance_pct: Math.max(0, Math.min(100, Number(q.tolerance_pct) || 0)),
    explanation: q.explanation ?? "",
  };
}

async function liveQuestions(): Promise<Question[]> {
  const [caps, macro] = await Promise.all([readMarketCapsSnapshot(), readMacroSnapshot()]);
  const now = Date.now();
  return [...(hasFreshMarketCaps(caps, now) ? buildLiveQuestions(caps) : []), ...buildMacroQuestions(macro, now)];
}

type Run = { questions: Question[]; mode: QuizMode; timer?: number; note?: string; day?: string };

async function loadActivity(db: SupabaseClient, userId: string, activity: Activity): Promise<Run | null> {
  switch (activity.type) {
    case "daily": {
      const day = todayParis();
      return { questions: dailyQuestions(guestPool, day), mode: "daily", day };
    }
    case "quick":
    case "mixed": {
      const selected = await loadQuick(db, activity.type === "mixed", liveQuestions);
      const limit = activity.type === "mixed" ? 15 : 10;
      return { questions: [...selected, ...shuffle(guestPool).slice(0, Math.max(0, limit - selected.length))], mode: activity.type };
    }
    case "weakness":
      return { ...await loadWeakness(db, userId), mode: "weakness" };
    case "training":
      return { questions: await loadTraining(db, activity.categories, activity.levels, liveQuestions), mode: "training" };
    case "mental":
      return { questions: mentalSession(12, activity.level, Math.random, activity.topic), mode: "training", timer: activity.timed ? mentalSeconds(activity.level) : 0 };
    case "game": {
      const questions = await loadGame(db, activity.game, activity.level, liveQuestions);
      if (activity.game === "culture" && questions.length < 10) {
        const prompts = new Set(questions.map((q) => q.prompt));
        const backup = guestPool.filter((q) => !isNumeric(q) && !prompts.has(q.prompt));
        questions.push(...shuffle(backup).slice(0, 10 - questions.length));
      }
      return { questions, mode: "challenge", timer: gameSeconds(activity.game, activity.level) };
    }
    case "placement":
      return { questions: await loadPlacement(db), mode: "quick" };
    case "module": {
      const m = moduleById(activity.id);
      if (!m?.ready) return null;
      const [rows, profile] = await Promise.all([
        db.from("module_progress").select("module_id, passed, best_pct, attempts").eq("user_id", userId),
        db.from("profiles").select("placement_level").eq("id", userId).maybeSingle(),
      ]);
      if (rows.error || profile.error) throw new Error("module_progress");
      const progress: Progress = Object.fromEntries((rows.data ?? []).map((r) => [r.module_id, r]));
      if (computeStatuses(progress, profile.data?.placement_level ?? null)[m.id] === "locked") return null;
      return { questions: moduleQuestions(m, MODULE_QUIZ_SIZE), mode: "training" };
    }
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return Response.json({ error: "Connecte-toi pour sauvegarder ta partie." }, { status: 401 });
  const activity = parseActivity(await request.json().catch(() => null));
  if (!activity) return Response.json({ error: "Mode de quiz invalide." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !secret) return Response.json({ error: "Le serveur de quiz doit être configuré." }, { status: 503 });

  const auth = { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false };
  try {
    const db = createClient(url, key, { auth, accessToken: async () => token });
    const identity = createClient(url, key, { auth });
    const { data: { user }, error } = await identity.auth.getUser(token);
    if (error || !user) return Response.json({ error: "Ta session a expiré. Reconnecte-toi." }, { status: 401 });
    const run = await loadActivity(db, user.id, activity);
    if (!run) return Response.json({ error: "Ce module est verrouillé." }, { status: 403 });
    const questions = run.questions.map(normalizeQuestion).filter((q): q is Question => q !== null);
    if (activity.type === "module" && questions.length !== MODULE_QUIZ_SIZE) throw new Error("module_questions");
    if (!questions.length) return Response.json({ questions: [] });
    const writer = createClient(url, secret, { auth });
    const { data: id, error: issueError } = await writer.rpc("issue_quiz_run", {
      p_user: user.id,
      p_mode: run.mode,
      p_kind: activity.type === "module" || activity.type === "placement" ? activity.type : "standard",
      p_questions: questions,
      p_time_limit: run.timer ?? 0,
      p_module: activity.type === "module" ? activity.id : null,
      p_pass_threshold: activity.type === "module" ? PASS_THRESHOLD : null,
      p_daily_date: run.day ?? null,
    });
    if (issueError || typeof id !== "string") {
      console.error("Émission du quiz", issueError?.code ?? "identifiant absent");
      return Response.json({ error: issueError?.code === "54000" ? "Trop de parties lancées. Attends quelques instants." : "La session de quiz n’a pas pu être créée." }, { status: issueError?.code === "54000" ? 429 : 503 });
    }
    const visible = questions.map((q) => ({ ...q, correct: null, explanation: "", wrong_explanations: null }));
    return Response.json({ id, questions: visible, note: run.note, timeLimit: run.timer ?? 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Les questions n’ont pas pu être chargées. Réessaie dans un instant." }, { status: 503 });
  }
}
