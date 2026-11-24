import type { SupabaseClient } from "@supabase/supabase-js";
import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { shuffle, type Question } from "@/lib/quiz";
import { mentalQuestion } from "@/lib/mental";
import type { HistoryFilter } from "@/lib/quizSession";
import { GROUPS, LEVELS } from "@/lib/program";
import { questionLocation } from "@/lib/curriculum/legacyMapping";
import { capitalisationDraw, diverseDraw, geopoliticsDraw, marketRecallDraw } from "@/lib/drawQuestions";
import { stableReferenceKey } from "@/lib/studyQuestions";
import { isPolicyRateRecall } from "@/lib/marketRecall";

export const SIZE = 10;
type LiveQuestions = () => Promise<Question[]>;

export function parseList(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

// Tire n questions en variant les catégories (tourniquet).
export function balanced(pool: Question[], n: number): Question[] {
  return diverseDraw(shuffle(pool), n);
}

export async function loadQuick(mixed: boolean, liveQuestions: LiveQuestions): Promise<Question[]> {
  const live = shuffle((await liveQuestions()).filter((q) => q.reference_date && q.difficulty !== "beginner")).slice(0, mixed ? 2 : 1);
  const pool = curriculumQuestions();
  if (mixed) return shuffle([...live, ...balanced(pool, 15 - live.length)]);
  const dedicated = [
    ...balanced(curriculumQuestions({ levels: ["beginner"] }), 6),
    ...balanced(curriculumQuestions({ levels: ["intermediate"] }), 3 - live.length),
    ...balanced(curriculumQuestions({ levels: ["advanced"] }), 1),
  ];
  return [...shuffle(dedicated.filter((q) => q.difficulty === "beginner")), ...shuffle([...live, ...dedicated.filter((q) => q.difficulty !== "beginner")])];
}

export async function loadTraining(categories: string[], levels: string[], liveQuestions: LiveQuestions): Promise<Question[]> {
  const pool = curriculumQuestions({ categories, levels });
  const canUseLive = !levels.length || levels.some((level) => level !== "beginner");
  const live = canUseLive ? (await liveQuestions()).filter((q) =>
    q.reference_date && q.difficulty !== "beginner" && (!categories.length || categories.includes(q.category_id)) &&
    (!levels.length || levels.includes(q.difficulty)),
  ) : [];
  const dated = shuffle(live).slice(0, 2);
  return shuffle([...dated, ...balanced(pool, SIZE - dated.length)]);
}

export async function loadTrainingByHistory(
  supabase: SupabaseClient, categories: string[], levels: string[], history: Exclude<HistoryFilter, "all">,
  liveQuestions?: LiveQuestions,
): Promise<Question[]> {
  const last = new Map<string, boolean>();
  const pageSize = 500;
  for (let offset = 0; ;) {
    const { data, error } = await supabase.rpc("quiz_answer_history").order("question_key").range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data as { question_key: string; was_correct: boolean }[]) last.set(row.question_key, row.was_correct);
    offset += data.length;
  }
  const dated = liveQuestions && (!levels.length || levels.some((level) => level !== "beginner")) ? (await liveQuestions())
    .filter((q) => q.reference_date && q.difficulty !== "beginner"
      && (!categories.length || categories.includes(q.category_id)) && (!levels.length || levels.includes(q.difficulty))) : [];
  const questions = [...curriculumQuestions({ categories, levels }), ...dated].filter((q) => {
    const answer = last.get(q.id);
    return history === "unseen" ? answer === undefined : answer === (history === "correct");
  });
  return balanced(questions, SIZE);
}

export async function loadScopedTraining(
  supabase: SupabaseClient, group: string, units: string[], levels: string[], history: HistoryFilter, liveQuestions: LiveQuestions,
) {
  const inScope = (q: Question) => {
    const stored = q as Question & { groupNo?: string; unitSlug?: string };
    const mapped = stored.groupNo && stored.unitSlug ? stored : questionLocation(q);
    return GROUPS.some((subject) => subject.no === mapped.groupNo && subject.slug === group)
      && (!units.length || units.includes(mapped.unitSlug ?? ""))
      && (!levels.length || levels.includes(q.difficulty));
  };
  const live = group !== "reperes" && levels.length === 1 && levels[0] === "beginner" ? [] : (await liveQuestions()).filter(inScope);
  const pool = curriculumQuestions({ levels }).filter(inScope);
  const onlyRates = group === "banques" && units.length === 1 && units[0] === "taux";
  const onlyCaps = group === "reperes" && units.length === 1 && units[0] === "capitalisations";
  const requestedLevels = LEVELS.filter(({ id }) => !levels.length || levels.includes(id)).map(({ id }) => id);
  const currentEvents = group === "geopolitique" && requestedLevels.some((level) => level !== "beginner");
  if (history === "all") {
    if (onlyCaps) return capitalisationDraw([...live, ...pool], SIZE, requestedLevels);
    if (group === "reperes") return marketRecallDraw([...live, ...pool], SIZE);
    if (currentEvents) return geopoliticsDraw([...live, ...pool], SIZE);
    if (onlyRates && live.some(isPolicyRateRecall)) return marketRecallDraw([...live, ...pool], SIZE, undefined, undefined, isPolicyRateRecall);
    const dated = balanced(live, 2);
    const stable = balanced(pool, SIZE - dated.length);
    const chosen = new Set(dated.map((q) => q.id));
    return shuffle([...dated, ...stable, ...balanced(live.filter((q) => !chosen.has(q.id)), SIZE - dated.length - stable.length)]);
  }
  const latest = new Map<string, { answer: boolean; seen: string }>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("question_reviews").select("question_id,box,last_seen").gt("seen", 0).order("question_id").range(offset, offset + 499);
    if (error) throw new Error(error.message);
    for (const row of data) {
      const key = stableReferenceKey(row.question_id);
      if (row.last_seen >= (latest.get(key)?.seen ?? "")) latest.set(key, { answer: row.box > 0, seen: row.last_seen });
    }
    if (data.length < 500) break;
  }
  const matchesHistory = (q: Question) => {
    const previous = latest.get(q.reference_key ?? stableReferenceKey(q.id));
    return history === "unseen" ? !previous : previous?.answer === (history === "correct");
  };
  const filtered = [...live, ...pool].filter(matchesHistory);
  if (onlyCaps) return capitalisationDraw(filtered, SIZE, requestedLevels, undefined, matchesHistory);
  if (group === "reperes") return marketRecallDraw(filtered, SIZE);
  if (currentEvents) return geopoliticsDraw(filtered, SIZE);
  if (onlyRates) return marketRecallDraw(filtered, SIZE, undefined, undefined, isPolicyRateRecall);
  return balanced(filtered, SIZE);
}

export async function loadWeakness(
  supabase: SupabaseClient, userId: string,
  liveQuestions?: LiveQuestions,
): Promise<{ questions: Question[]; note: string }> {
  const now = new Date().toISOString();
  const [dueRes, statsRes, recent, dated] = await Promise.all([
    supabase.from("question_reviews").select("question_id").eq("user_id", userId)
      .like("question_id", "course:%").lte("due_at", now).order("due_at").limit(40),
    supabase.from("category_stats").select("category_id, difficulty, answered, correct").eq("user_id", userId),
    liveQuestions ? supabase.from("question_reviews").select("question_id,due_at").eq("user_id", userId)
      .or("question_id.like.live:%,question_id.like.macro:%,question_id.like.news:%,question_id.like.production:%,question_id.like.policy:%")
      .order("last_seen", { ascending: false }).limit(500) : null,
    liveQuestions ? liveQuestions() : [],
  ]);
  if (dueRes.error || statsRes.error || recent?.error) throw new Error("La liste des révisions n’a pas pu être chargée.");
  const pool = curriculumQuestions();
  const recentKeys = new Map<string, number>();
  for (const row of recent?.data ?? []) {
    const key = stableReferenceKey(row.question_id);
    if (!recentKeys.has(key)) recentKeys.set(key, Date.parse(row.due_at));
  }
  const dueDated = balanced(dated.filter((q) => (recentKeys.get(q.reference_key ?? stableReferenceKey(q.id)) ?? Infinity) <= Date.parse(now)), 4);
  const dates = new Set((dueRes.data ?? []).map((r) => r.question_id));
  const due = [...dueDated, ...balanced(pool.filter((q) => dates.has(q.id)), 6 - dueDated.length)];
  const seen = new Set(due.map((q) => q.id));
  const weak = [...(statsRes.data ?? [])]
    .filter((r) => r.answered >= 3 && r.correct < r.answered)
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered);
  const weakKeys = new Set(weak.slice(0, 4).map((r) => `${r.category_id}:${r.difficulty}`));
  const needsPractice = balanced(pool.filter((q) => !seen.has(q.id) && weakKeys.has(`${q.category_id}:${q.difficulty}`)), SIZE - due.length);
  for (const q of needsPractice) seen.add(q.id);

  const fallbackLevel = weak[0]?.difficulty === "expert" ? "advanced" : weak[0]?.difficulty ?? "beginner";
  const rest = [...balanced(pool.filter((q) => !seen.has(q.id) && q.difficulty === fallbackLevel), SIZE - seen.size)];
  for (const q of rest) seen.add(q.id);
  const remaining = balanced(pool.filter((q) => !seen.has(q.id)), SIZE - seen.size);
  const note = dueDated.length ? `${dueDated.length} repère(s) à revoir avec leur valeur vérifiée.`
    : due.length ? `${due.length} question(s) à revoir.` : needsPractice.length ? "Tirage ciblé sur tes thèmes et niveaux les moins réussis." : "Les premières questions à revoir apparaîtront après tes quiz.";
  return { questions: shuffle([...due, ...needsPractice, ...rest, ...remaining]), note };
}

export function loadPlacement(): Question[] {
  const sizes = [3, 3, 2];
  const knowledge = LEVELS.slice(0, sizes.length).flatMap(({ id }, i) =>
    balanced(curriculumQuestions({ levels: [id] }).filter((q) => q.category_id !== "mental-math"), sizes[i]));
  const math = [1, 2, 3, 4].map((level) => mentalQuestion(level, Math.random, "pourcentages"));
  const rank = LEVELS.map((level) => level.id as string);
  return [...knowledge, ...math].sort((a, b) => rank.indexOf(a.difficulty) - rank.indexOf(b.difficulty));
}
