import { isNumeric, LETTERS, mcqOptions, shuffle, type Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";
import { questionLocation } from "@/lib/curriculum/legacyMapping";
import type { ExamProfile } from "@/lib/quizSession";

export const EXAM_SIZE = 20;
export const EXAM_SECONDS = 45;

const THEMES = {
  macro: "macroéconomie",
  rates: "taux",
  bonds: "obligations",
  fx: "change (FX)",
  equities: "actions",
  derivatives: "dérivés",
  monetary: "politique monétaire",
  mental: "calcul mental",
} as const;
type Theme = keyof typeof THEMES;

const BY_CATEGORY: Record<string, Theme> = {
  macroeconomics: "macro", geopolitics: "macro", commodities: "macro", fx: "fx",
  "mental-math": "mental", "macro-guesstimates": "mental",
  "central-banks": "monetary", "monetary-policy": "monetary",
  "market-caps": "equities", equities: "equities", stocks: "equities",
  rates: "rates", "interest-rates": "rates", bonds: "bonds", derivatives: "derivatives",
};

function examTheme(q: Question): Theme | undefined {
  if (Object.hasOwn(BY_CATEGORY, q.category_id)) return BY_CATEGORY[q.category_id];
  if (q.category_id !== "financial-markets" && q.category_id !== "fixed-income") return;
  const prompt = searchText(q.prompt);
  if (/\b(options?|calls?|puts?|forwards?|futures?|swaps?|derives?|strike|straddle|gamma|vega)\b/.test(prompt)) return "derivatives";
  if (/\b(pente|courbe)\b/.test(prompt) && /\b(rendements?|taux|ans)\b/.test(prompt)) return "rates";
  if (/\b(obligations?|obligataires?|coupons?|duration|convexite|dv01|oat|bund)\b/.test(prompt)) return "bonds";
  if (/\b(taux|courbe des rendements?|points? de base|bps|spread de taux)\b/.test(prompt)) return "rates";
  if (/\b(actions?|capitalisations?|dividendes?|bourse|p\/e|per|indices? boursiers?)\b/.test(prompt)) return "equities";
}

export function examQuestionSeconds(q: Question) {
  const text = searchText(q.prompt);
  if (q.reference_date) return isNumeric(q) ? 25 : 20;
  if (isNumeric(q)) {
    const moreSteps = /puis|composes|apres|simultanement|successiv|hypotheses|tranches/.test(text)
      || (q.prompt.match(/\d+(?:[,.]\d+)?/g)?.length ?? 0) >= 3;
    return moreSteps ? (q.difficulty === "advanced" ? 40 : 45) : (q.difficulty === "advanced" ? 25 : 30);
  }
  return q.difficulty === "advanced" || text.length > 130 ? 35 : 25;
}

export function drawExam(bank: Question[], previous: string[], profile: ExamProfile = "general") {
  const recent = new Set(previous);
  const themes = Object.keys(THEMES) as Theme[];
  const ids = new Set<string>();
  const prompts = new Set<string>();
  const pools = new Map(themes.map((theme) => [theme, { fresh: [] as Question[], repeated: [] as Question[] }]));
  function priority(q: Question) {
    const theme = examTheme(q);
    const culture = theme === "macro" || theme === "monetary" || q.kind === "conjunctural";
    return (recent.has(q.id) ? 2 : 0) + (culture && q.difficulty === "advanced" ? 1 : 0);
  }
  for (const q of shuffle(bank).sort((a, b) => priority(a) - priority(b))) {
    if (q.difficulty !== "intermediate" && q.difficulty !== "advanced") continue;
    if ((q.max_seconds ?? EXAM_SECONDS) > EXAM_SECONDS) continue;
    if (q.difficulty === "advanced" && q.type === "numeric" && q.id.startsWith("course:e")) continue;
    const theme = examTheme(q);
    const prompt = searchText(q.prompt);
    if (!theme || !prompt || typeof q.explanation !== "string" || !q.explanation.trim() || ids.has(q.id) || prompts.has(prompt)) continue;
    if (q.type === "mcq") {
      const options = mcqOptions(q).map(searchText);
      if (options.length < 2 || options.length > LETTERS.length || options.includes("") || new Set(options).size !== options.length) continue;
    }
    ids.add(q.id);
    prompts.add(prompt);
    pools.get(theme)![recent.has(q.id) ? "repeated" : "fresh"].push(q);
  }
  const missing = themes.filter((theme) => {
    const { fresh, repeated } = pools.get(theme)!;
    return theme !== "mental" && fresh.length + repeated.length === 0;
  }).map((theme) => THEMES[theme]);
  if (missing.length || ids.size < EXAM_SIZE) return { questions: [], available: ids.size, missing };

  const buckets = shuffle([...pools.values()].filter(({ fresh, repeated }) => fresh.length + repeated.length > 0));
  const selected = buckets.map(({ fresh, repeated }) => (fresh.shift() ?? repeated.shift())!);
  if (profile !== "general") {
    const inProfile = (q: Question) => (Number((q as Question & { groupNo?: string }).groupNo ?? questionLocation(q).groupNo) >= 5) === (profile === "technique");
    for (const tier of ["fresh", "repeated"] as const) {
      for (const bucket of buckets) {
        for (let i = 0; i < bucket[tier].length && selected.filter(inProfile).length < 12;) {
          if (inProfile(bucket[tier][i])) selected.push(bucket[tier].splice(i, 1)[0]);
          else i += 1;
          if (selected.length >= EXAM_SIZE) break;
        }
        if (selected.length >= EXAM_SIZE) break;
      }
      if (selected.length >= EXAM_SIZE) break;
    }
  }
  for (const tier of ["fresh", "repeated"] as const) {
    while (selected.length < EXAM_SIZE && buckets.some((bucket) => bucket[tier].length)) {
      for (const bucket of buckets) {
        if (selected.length < EXAM_SIZE && bucket[tier].length) selected.push(bucket[tier].shift()!);
      }
    }
  }
  return { questions: shuffle(selected).map((q) => ({ ...q, limit_seconds: examQuestionSeconds(q) })), available: ids.size, missing };
}
