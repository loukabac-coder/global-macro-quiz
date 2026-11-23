import { hashString } from "@/lib/rng";
import type { ProgramLevel } from "@/lib/program";
import type { CurriculumQuestion } from "@/lib/curriculum/question";

export type ProgramQuestion = CurriculumQuestion & {
  groupNo: string;
  unitSlug: string;
  difficulty: ProgramLevel;
  family: string;
  competency: string;
  origin: "editorial" | "variant" | "dated";
};

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const BASE_CATEGORIES: Record<string, string> = {
  "01": "macroeconomics", "02": "central-banks", "03": "geopolitics", "05": "financial-markets", "06": "mental-math",
  capitalisations: "market-caps", indices: "market-caps", devises: "fx", matieres: "commodities", producteurs: "commodities",
  estimations: "macro-guesstimates",
};

// Une ligne par exercice éditorial. Famille, compétence, énoncé, bonne réponse, deux distracteurs, correction.
// Pour un nombre, la réponse s’écrit #valeur~unité~tolérance et les deux colonnes de distracteurs sont vides.
export function editorial(groupNo: string, unitSlug: string, stages: string[], source: string | null = null): ProgramQuestion[] {
  const category_id = (groupNo === "04" || unitSlug === "estimations" ? BASE_CATEGORIES[unitSlug] : BASE_CATEGORIES[groupNo]);
  return stages.flatMap((lines, stage) => lines.trim().split("\n").filter((line) => line.trim()).map((line) => {
    const [family, competency, prompt, answer, distractor1, distractor2, explanation] = line.split("|").map((cell) => cell.trim());
    if (!family || !competency || !prompt || !answer || !explanation) throw new Error(`Question incomplète dans ${groupNo}/${unitSlug}`);
    const numeric = answer.startsWith("#");
    const [value, unit, tolerance] = numeric ? answer.slice(1).split("~") : [];
    const id = `course:p:${groupNo}:${hashString(prompt + answer).toString(36)}`;
    const choices = distractor2 ? [answer, distractor1, distractor2] : null;
    const position = (hashString(id) >>> 0) % 3;
    if (choices) choices.push(...choices.splice(0, (3 - position) % 3));
    return {
      id, groupNo, unitSlug, moduleId: `p:${LEVELS[stage][0]}:${groupNo}:${unitSlug}`,
      category_id, difficulty: LEVELS[stage], family: `${unitSlug}:${family}`,
      competency: competency.includes(" ") ? competency : `${competency} · ${family.replaceAll("-", " ")}`,
      type: numeric ? "numeric" : distractor2 ? "mcq" : "true_false",
      options: numeric ? (unit ? { unit } : null) : choices,
      correct: numeric ? Number(value) : choices ? position : answer === "Vrai",
      tolerance_pct: numeric ? Number(tolerance ?? 0) : null,
      prompt, explanation, wrong_explanations: null, source, kind: "structural", reference_date: null,
      origin: "editorial", max_seconds: groupNo === "06" ? 60 : 45,
    };
  }));
}
