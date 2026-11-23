import { MENTAL_QUESTION_PREFIX, mentalQuestion, type Topic } from "@/lib/mental";
import { hashString, mulberry32 } from "@/lib/rng";
import { isNumeric, type Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";
import { applicationQuestions } from "@/lib/curriculum/applications";
import { centralBanks } from "@/lib/curriculum/centralBanks";
import { commodities } from "@/lib/curriculum/commodities";
import { coreQuestions } from "@/lib/curriculum/core";
import { fxQuestions } from "@/lib/curriculum/fx";
import { scenarioQuestions } from "@/lib/curriculum/scenarios";
import type { CurriculumQuestion } from "@/lib/curriculum/question";
import type { ProgramQuestion } from "@/lib/curriculum/editorial";
import { questionFamily, questionLocation } from "@/lib/curriculum/legacyMapping";
import { macroBank } from "@/lib/curriculum/macroBank";
import { macroCases } from "@/lib/curriculum/macroCases";
import { banksBank } from "@/lib/curriculum/banksBank";
import { geopoliticsBank } from "@/lib/curriculum/geopoliticsBank";
import { geopoliticsCases } from "@/lib/curriculum/geopoliticsCases";
import { marketsBank } from "@/lib/curriculum/marketsBank";
import { referenceBank } from "@/lib/curriculum/referenceBank";
import { marketPractice } from "@/lib/curriculum/marketPractice";
import { mentalBank } from "@/lib/curriculum/mentalBank";
import { mentalCases } from "@/lib/curriculum/mentalCases";
import { interviewBank } from "@/lib/curriculum/interviewBank";
import { financePractice } from "@/lib/curriculum/financePractice";
import { productsPractice } from "@/lib/curriculum/productsPractice";
import { trainingBasics } from "@/lib/curriculum/trainingBasics";

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
    const revised = topic === "interets" || topic === "variations";
    return { ...question, id: revised ? `${id}-v2` : id, moduleId };
  })).filter(({ prompt }) => {
    if (seen.has(prompt)) return false;
    seen.add(prompt);
    return true;
  });
});

const original: CurriculumQuestion[] = [
  ...coreQuestions, ...centralBanks, ...fxQuestions, ...commodities, ...applicationQuestions, ...scenarioQuestions, ...mentalExamples,
];

const variants = new Set([...scenarioQuestions, ...mentalExamples].map((q) => q.id));
export const LEGACY_CURRICULUM = original.map((q): ProgramQuestion => ({
  ...q,
  ...questionLocation(q),
  difficulty: (q.difficulty === "expert" ? "advanced" : q.difficulty) as ProgramQuestion["difficulty"],
  family: questionFamily(q),
  competency: questionFamily(q),
  origin: variants.has(q.id) ? "variant" : "editorial",
}));
export const CURRICULUM: ProgramQuestion[] = [
  ...LEGACY_CURRICULUM, ...macroBank, ...macroCases, ...banksBank, ...geopoliticsBank, ...geopoliticsCases,
  ...referenceBank, ...marketPractice, ...marketsBank, ...interviewBank, ...financePractice, ...productsPractice, ...mentalBank, ...mentalCases, ...trainingBasics,
];
const activeQuestions = CURRICULUM.filter((q) => !(q.groupNo === "01" && q.unitSlug === "pib" &&
  isNumeric(q) && /\b(croissance|revisee)\b/.test(searchText(q.prompt))));

const curriculumIds = new Set(CURRICULUM.flatMap((question) => [question.id, question.id.replace(/-v2$/, "")]));

export function isCurrentFavorite(question: Question): boolean {
  if (typeof question.id !== "string") return false;
  return curriculumIds.has(question.id) ||
    question.id.startsWith(MENTAL_QUESTION_PREFIX) ||
    (question.kind === "conjunctural" && question.difficulty !== "beginner" && !!question.reference_date);
}

export function curriculumQuestions(opts: { categories?: string[]; levels?: string[]; types?: string[] } = {}) {
  return activeQuestions.filter((q) =>
    (!opts.categories?.length || opts.categories.includes(q.category_id)) &&
    (!opts.levels?.length || opts.levels.includes(q.difficulty)) &&
    (!opts.types?.length || opts.types.includes(q.type)));
}
