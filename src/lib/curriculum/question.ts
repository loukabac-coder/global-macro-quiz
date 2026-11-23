import type { LevelId } from "@/lib/modules";
import type { Question } from "@/lib/quiz";

export const LEVEL_BY_STAGE: Record<string, LevelId> = {
  d: "beginner", i: "intermediate", a: "advanced", e: "expert",
};

export type CurriculumQuestion = Question & { moduleId: string };
type Seed = Pick<Question, "id" | "type" | "prompt" | "options" | "correct" | "tolerance_pct" | "explanation">;

export function choice(id: string, prompt: string, correct: string, distractors: string[], explanation: string): Seed {
  return { id, prompt, type: "mcq", options: [correct, ...distractors], correct: 0, tolerance_pct: null, explanation };
}

export function number(
  id: string, prompt: string, correct: number, unit: string, explanation: string, tolerance_pct = 0,
): Seed {
  return { id, prompt, type: "numeric", options: unit ? { unit } : null, correct, tolerance_pct, explanation };
}

export function block(moduleId: string, category_id: string, seeds: Seed[], source: string | null = null): CurriculumQuestion[] {
  return seeds.map((seed) => ({
    ...seed, id: `course:${moduleId}:${category_id}:${seed.id}`, moduleId, category_id, difficulty: LEVEL_BY_STAGE[moduleId[0]],
    source, wrong_explanations: null, kind: "structural", reference_date: null,
  }));
}
