import type { SupabaseClient } from "@supabase/supabase-js";
import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { shuffle, type Question } from "@/lib/quiz";
import { mentalDifficulty, mentalQuestion } from "@/lib/mental";
import type { Game, HistoryFilter } from "@/lib/quizSession";
import { LEVELS } from "@/lib/modules";

export const SIZE = 10;
type LiveQuestions = () => Promise<Question[]>;

export function parseList(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

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

export async function loadQuick(mixed: boolean, liveQuestions: LiveQuestions): Promise<Question[]> {
  const live = shuffle((await liveQuestions()).filter((q) => q.reference_date && q.difficulty !== "beginner")).slice(0, mixed ? 2 : 1);
  const pool = curriculumQuestions();
  if (mixed) return shuffle([...live, ...balanced(pool, 15 - live.length)]);
  const dedicated = [
    ...balanced(curriculumQuestions({ levels: ["beginner"] }), 6),
    ...balanced(curriculumQuestions({ levels: ["intermediate"] }), 3 - live.length),
    ...balanced(curriculumQuestions({ levels: ["advanced", "expert"] }), 1),
  ];
  return [...shuffle(dedicated.filter((q) => q.difficulty === "beginner")), ...shuffle([...live, ...dedicated.filter((q) => q.difficulty !== "beginner")])];
}

export async function loadGame(game: Game, level: number, liveQuestions: LiveQuestions): Promise<Question[]> {
  const difficulty = mentalDifficulty(level);
  const types = game === "culture" ? ["mcq", "true_false"] : ["numeric", "guesstimate"];
  const categories = game === "calcul" ? ["mental-math"] : undefined;
  const pool = curriculumQuestions({ categories, levels: [difficulty], types });
  const dated = game === "calcul" ? [] : shuffle((await liveQuestions()).filter((q) =>
    q.reference_date && q.difficulty === difficulty && types.includes(q.type),
  )).slice(0, 2);
  return shuffle([...dated, ...balanced(pool, SIZE - dated.length)]);
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
  const questions = curriculumQuestions({ categories, levels }).filter((q) => {
    const answer = last.get(q.id);
    return history === "unseen" ? answer === undefined : answer === (history === "correct");
  });
  return balanced(questions, SIZE);
}

export async function loadWeakness(
  supabase: SupabaseClient, userId: string,
): Promise<{ questions: Question[]; note: string }> {
  const [dueRes, statsRes] = await Promise.all([
    supabase.from("question_reviews").select("question_id").eq("user_id", userId)
      .like("question_id", "course:%").lte("due_at", new Date().toISOString()).order("due_at").limit(40),
    supabase.from("category_stats").select("category_id, difficulty, answered, correct").eq("user_id", userId),
  ]);
  if (dueRes.error || statsRes.error) throw new Error("La liste des révisions n’a pas pu être chargée.");
  const pool = curriculumQuestions();
  const dates = new Set((dueRes.data ?? []).map((r) => r.question_id));
  const due = balanced(pool.filter((q) => dates.has(q.id)), 6);
  const seen = new Set(due.map((q) => q.id));
  const weak = [...(statsRes.data ?? [])]
    .filter((r) => r.answered >= 3 && r.correct < r.answered)
    .sort((a, b) => a.correct / a.answered - b.correct / b.answered);
  const weakKeys = new Set(weak.slice(0, 4).map((r) => `${r.category_id}:${r.difficulty}`));
  const needsPractice = balanced(pool.filter((q) => !seen.has(q.id) && weakKeys.has(`${q.category_id}:${q.difficulty}`)), SIZE - due.length);
  for (const q of needsPractice) seen.add(q.id);

  const fallbackLevel = weak[0]?.difficulty ?? "beginner";
  const rest = [...balanced(pool.filter((q) => !seen.has(q.id) && q.difficulty === fallbackLevel), SIZE - seen.size)];
  for (const q of rest) seen.add(q.id);
  const remaining = balanced(pool.filter((q) => !seen.has(q.id)), SIZE - seen.size);
  const note = due.length ? `${due.length} question(s) à revoir.` : needsPractice.length ? "Tirage ciblé sur tes thèmes et niveaux les moins réussis." : "Les premières questions à revoir apparaîtront après tes quiz.";
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
