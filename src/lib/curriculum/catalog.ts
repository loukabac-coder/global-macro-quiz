import { MENTAL_QUESTION_PREFIX, mentalQuestion, type Topic } from "@/lib/mental";
import { hashString, mulberry32 } from "@/lib/rng";
import type { Question } from "@/lib/quiz";
import { applicationQuestions } from "@/lib/curriculum/applications";
import { centralBanks } from "@/lib/curriculum/centralBanks";
import { commodities } from "@/lib/curriculum/commodities";
import { coreQuestions } from "@/lib/curriculum/core";
import { fxQuestions } from "@/lib/curriculum/fx";
import { scenarioQuestions } from "@/lib/curriculum/scenarios";
import type { CurriculumQuestion } from "@/lib/curriculum/question";

const mentalStages: [string, number, Topic[]][] = [
  ["i1", 3, ["variations", "interets", "bps", "ratios"]],
  ["a1", 4, ["multiplications", "interets", "ratios", "ordres", "devises"]],
  ["e1", 5, ["pourcentages", "multiplications", "interets", "ratios", "devises"]],
];

const mentalExamples = mentalStages.flatMap(([moduleId, level, topics]): CurriculumQuestion[] => {
  const seen = new Set<string>();
  return topics.flatMap((topic) => Array.from({ length: 4 }, (_, i) => {
    const id = `course:${moduleId}:mental-math:${topic}-${i + 1}`;
    const question = mentalQuestion(level, mulberry32(hashString(id)), topic);
    const revised = moduleId === "i1" && (topic === "interets" || topic === "variations");
    return { ...question, id: revised ? `${id}-v2` : id, moduleId };
  })).filter(({ prompt }) => {
    if (seen.has(prompt)) return false;
    seen.add(prompt);
    return true;
  });
});

export const CURRICULUM: CurriculumQuestion[] = [
  ...coreQuestions, ...centralBanks, ...fxQuestions, ...commodities, ...applicationQuestions, ...scenarioQuestions, ...mentalExamples,
];

const curriculumIds = new Set(CURRICULUM.map((question) => question.id));

export function isCurrentFavorite(question: Question): boolean {
  if (typeof question.id !== "string") return false;
  return curriculumIds.has(question.id) ||
    question.id.startsWith(MENTAL_QUESTION_PREFIX) ||
    (question.kind === "conjunctural" && question.difficulty !== "beginner" && !!question.reference_date);
}

export function curriculumQuestions(opts: { categories?: string[]; levels?: string[]; types?: string[] } = {}) {
  return CURRICULUM.filter((q) =>
    (!opts.categories?.length || opts.categories.includes(q.category_id)) &&
    (!opts.levels?.length || opts.levels.includes(q.difficulty)) &&
    (!opts.types?.length || opts.types.includes(q.type)));
}
