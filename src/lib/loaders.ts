import type { SupabaseClient } from "@supabase/supabase-js";
import { shuffle, withBankTolerance, type Question } from "@/lib/quiz";
import { mentalQuestion, mentalSession } from "@/lib/mental";
import type { Game } from "@/lib/quizSession";

export const Q_COLS =
  "id, category_id, type, difficulty, prompt, options, correct, tolerance_pct, explanation, wrong_explanations, source, kind, reference_date";

export const SIZE = 10;

function nowMs(): number {
  return Date.now();
}

export function parseList(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

// Les données d’actualité sont générées depuis les observations vérifiées à l’ouverture du quiz.
export async function fetchQuestions(
  supabase: SupabaseClient,
  opts: { categories?: string[]; levels?: string[]; types?: string[]; ids?: string[] } = {},
): Promise<Question[]> {
  let q = supabase.from("questions").select(Q_COLS).or("kind.is.null,kind.neq.conjunctural");
  if (opts.categories?.length) q = q.in("category_id", opts.categories);
  if (opts.levels?.length) q = q.in("difficulty", opts.levels);
  if (opts.types?.length) q = q.in("type", opts.types);
  if (opts.ids?.length) q = q.in("id", opts.ids);
  const questions: Question[] = [];
  const pageSize = 500;
  q = q.order("id");
  for (let offset = 0; ;) {
    const { data, error } = await q.range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as Question[];
    if (page.length === 0) return questions;
    questions.push(...page.map(withBankTolerance));
    offset += page.length;
  }
}

type LiveQuestions = () => Promise<Question[]>;

const RANK: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

// Tire n questions en variant les catégories (tourniquet).
export function balanced(pool: Question[], n: number): Question[] {
  const byCat = new Map<string, Question[]>();
  for (const q of shuffle(pool)) byCat.set(q.category_id, [...(byCat.get(q.category_id) ?? []), q]);
  const lists = shuffle([...byCat.values()]);
  const out: Question[] = [];
  let i = 0;
  while (out.length < n && lists.some((l) => l.length > i)) {
    for (const l of lists) {
      if (l[i] && out.length < n) out.push(l[i]);
    }
    i += 1;
  }
  return out;
}

// Quick Quiz : 10 questions au hasard (+ 1 question du jour) ; Mixed : 15 questions équilibrées par catégorie.
export async function loadQuick(supabase: SupabaseClient, mixed: boolean, liveQuestions: LiveQuestions): Promise<Question[]> {
  const [all, live] = await Promise.all([fetchQuestions(supabase), liveQuestions()]);
  const size = mixed ? 15 : SIZE;
  const nLive = Math.min(live.length, mixed ? 2 : 1);
  const db = mixed ? balanced(all, size - nLive) : shuffle(all).slice(0, size - nLive);
  return shuffle([...db, ...shuffle(live).slice(0, nLive)]);
}

export async function loadGame(
  supabase: SupabaseClient, game: Game, level: number, liveQuestions: LiveQuestions,
): Promise<Question[]> {
  if (game === "calcul") return mentalSession(SIZE, level, Math.random, null, 2);

  const opts = game === "ordres"
    ? { types: ["numeric", "guesstimate"] }
    : { categories: ["financial-markets", "central-banks", "fx", "commodities", "market-caps", "monetary-policy", "macroeconomics"], types: ["mcq", "true_false"] };
  const [db, live] = await Promise.all([fetchQuestions(supabase, opts), liveQuestions()]);
  if (game === "ordres") {
    const picked = [...shuffle(db).slice(0, 4), ...shuffle(live.filter((q) => q.type === "numeric")).slice(0, 3)];
    picked.push(...Array.from({ length: SIZE - picked.length }, (_, i) => mentalQuestion(2 + (i % 3), Math.random, "ordres")));
    return shuffle(picked);
  }
  const livePick = shuffle(live.filter((q) => opts.types.includes(q.type))).slice(0, 2);
  return shuffle([...balanced(db, SIZE - livePick.length), ...livePick]);
}

// Training : filtré par catégories et niveaux.
export async function loadTraining(
  supabase: SupabaseClient,
  categories: string[],
  levels: string[],
  liveQuestions: LiveQuestions,
): Promise<Question[]> {
  const [all, live] = await Promise.all([
    fetchQuestions(supabase, { categories, levels }),
    categories.length === 0 || categories.some((c) => ["market-caps", "monetary-policy", "macroeconomics", "fx", "commodities"].includes(c))
      ? liveQuestions()
      : Promise.resolve([] as Question[]),
  ]);
  const liveFiltered = live.filter(
    (q) => (categories.length === 0 || categories.includes(q.category_id)) && (levels.length === 0 || levels.includes(q.difficulty)),
  );
  const nLive = Math.min(liveFiltered.length, categories.length === 1 && categories[0] === "market-caps" ? 5 : 2);
  const db = shuffle(all).slice(0, SIZE - nLive);
  let picked = [...db, ...shuffle(liveFiltered).slice(0, nLive)];
  // Catégorie entièrement générée (calcul mental) : on complète avec des questions générées.
  if (picked.length < SIZE && (categories.length === 0 || categories.includes("mental-math"))) {
    const lv = levels.includes("expert") ? 5 : levels.includes("advanced") ? 4 : levels.includes("intermediate") ? 3 : 1;
    picked = [...picked, ...Array.from({ length: SIZE - picked.length }, () => mentalQuestion(lv, Math.random))];
  }
  return shuffle(picked);
}

// Weakness Training : questions à revoir (répétition espacée) + catégories où le taux de réussite est le plus bas.
export async function loadWeakness(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ questions: Question[]; note: string }> {
  const nowIso = new Date(nowMs()).toISOString();
  const [dueRes, statsRes] = await Promise.all([
    supabase
      .from("question_reviews")
      .select("question_id")
      .eq("user_id", userId)
      .lte("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(40),
    supabase.from("category_stats").select("category_id, answered, correct").eq("user_id", userId),
  ]);
  if (dueRes.error || statsRes.error) throw new Error("La liste des révisions n’a pas pu être chargée.");
  const dueIds = (dueRes.data ?? []).map((r: { question_id: string }) => r.question_id);
  const acc = new Map<string, { a: number; c: number }>();
  for (const r of (statsRes.data ?? []) as { category_id: string; answered: number; correct: number }[]) {
    const cur = acc.get(r.category_id) ?? { a: 0, c: 0 };
    acc.set(r.category_id, { a: cur.a + r.answered, c: cur.c + r.correct });
  }
  const weakCats = [...acc.entries()]
    .filter(([c, v]) => v.a >= 3 && c !== "divers")
    .sort((x, y) => x[1].c / x[1].a - y[1].c / y[1].a)
    .slice(0, 3)
    .map(([c]) => c);

  const due = dueIds.length ? await fetchQuestions(supabase, { ids: dueIds.slice(0, 30) }) : [];
  const picked: Question[] = shuffle(due).slice(0, 6);
  const seen = new Set(picked.map((q) => q.id));
  let note = "";
  if (picked.length) note += `${picked.length} question(s) à revoir. `;
  if (weakCats.length) {
    const weakDbCategories = weakCats.filter((c) => c !== "mental-math");
    const extra = weakDbCategories.length ? await fetchQuestions(supabase, { categories: weakDbCategories }) : [];
    for (const q of shuffle(extra)) {
      if (picked.length >= SIZE - (weakCats.includes("mental-math") ? 3 : 0)) break;
      if (!seen.has(q.id)) {
        picked.push(q);
        seen.add(q.id);
      }
    }
    if (weakCats.includes("mental-math")) picked.push(...mentalSession(3, 2, Math.random));
    note += "Catégories les plus faibles : " + weakCats.join(", ") + ".";
  }
  if (picked.length < SIZE) {
    const rest = await fetchQuestions(supabase);
    for (const q of shuffle(rest)) {
      if (picked.length >= SIZE) break;
      if (!seen.has(q.id)) {
        picked.push(q);
        seen.add(q.id);
      }
    }
    if (!picked.length) picked.push(...mentalSession(SIZE, 1, Math.random));
    note += picked.length && !due.length && !weakCats.length ? "Pas encore d’historique : questions au hasard." : "";
  }
  return { questions: shuffle(picked).slice(0, SIZE), note };
}

// Test de niveau : 8 questions de la base (faciles à avancées) + 4 calculs.
export async function loadPlacement(supabase: SupabaseClient): Promise<Question[]> {
  const all = await fetchQuestions(supabase);
  const pickLevel = (lvl: string, n: number) => balanced(all.filter((q) => q.difficulty === lvl), n);
  const db = [...pickLevel("beginner", 3), ...pickLevel("intermediate", 3), ...pickLevel("advanced", 2)];
  const mental = Array.from({ length: 12 - db.length }, (_, i) => mentalQuestion(1 + (i % 4), Math.random));
  return [...db, ...mental].sort((a, b) => (RANK[a.difficulty] ?? 1) - (RANK[b.difficulty] ?? 1));
}
