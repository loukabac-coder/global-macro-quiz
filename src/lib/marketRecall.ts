import { questionLocation } from "@/lib/curriculum/legacyMapping";
import { fmt, isNumeric, type Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";

export function marketScope(q: Question) {
  return ((q as Question & { groupNo?: string }).groupNo ?? questionLocation(q).groupNo) === "04";
}

export function isObservedMarketRecall(q: Question) {
  return !!q.reference_date && q.kind === "conjunctural" && marketScope(q);
}

export function isMarketPriceEstimate(q: Question) {
  return isObservedMarketRecall(q) && isNumeric(q);
}

export function isPolicyRateRecall(q: Question) {
  return !!q.reference_date && isNumeric(q) && !!q.reference_href?.startsWith("/cours/banques/taux/chiffres#macro-");
}

export function marketRecallVariants(questions: Question[]): Question[] {
  return questions.flatMap((q) => {
    if (!isMarketPriceEstimate(q)) return [];
    const monthlyCopper = q.reference_key === "macro:copper_imf" && q.difficulty === "advanced";
    if (q.difficulty !== "intermediate" && !monthlyCopper) return [];
    const offset = q.id.lastIndexOf(":");
    const stem = q.id.slice(0, offset);
    const prompt = q.prompt.replace(/\s*Marge(?: relative)? (?:de )?±.+$/u, "").trim();
    const currency = questionLocation(q).unitSlug === "devises";
    const broad = currency ? 10 : 35;
    const precise = Math.min(q.tolerance_pct ?? 10, currency ? 1.5 : 10);
    const tiers = [
      { difficulty: "beginner", tag: "debutant", tolerance_pct: broad, label: "Ordre de grandeur · " },
      monthlyCopper
        ? { difficulty: "intermediate", tag: "intermediaire", tolerance_pct: 15, label: "" }
        : { difficulty: "advanced", tag: "avance", tolerance_pct: precise, label: "" },
    ];
    return tiers.map(({ difficulty, tag, tolerance_pct, label }) => {
      const reference_key = `${stem}~${tag}`;
      return {
        ...q, id: `${reference_key}${q.id.slice(offset)}`, reference_key, difficulty, tolerance_pct,
        prompt: `${label}${prompt} Marge de ±${fmt(tolerance_pct)} %.`,
      };
    });
  });
}

export function marketRecallKey(reference: string) {
  return reference.replace(/~(?:debutant|intermediaire|avance)$/, "");
}

export function distinctObservedMarketQuestions(questions: Question[]) {
  const references = new Set<string>();
  return questions.filter((q) => {
    const prompt = searchText(q.prompt.replace(/^(?:Ordre de grandeur|Estimation) · /, "")
      .replace(/\s*Marge(?: relative)? (?:de )?±.+$/u, ""));
    const reference = q.reference_key ? marketRecallKey(q.reference_key) : prompt;
    if (references.has(reference)) return false;
    references.add(reference);
    return true;
  });
}
