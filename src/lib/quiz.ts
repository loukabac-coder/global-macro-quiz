export type Question = {
  id: string;
  category_id: string;
  type: string;
  difficulty: string;
  prompt: string;
  options: unknown;
  correct: unknown;
  tolerance_pct: number | null;
  explanation: string;
  wrong_explanations: unknown;
  source: string | null;
  kind: string;
  reference_date: string | null;
};

export const DIFFICULTY_FR: Record<string, string> = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

export const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Mélange de Fisher-Yates
export function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isNumeric(q: Question): boolean {
  return q.type === "numeric" || q.type === "guesstimate";
}

export function mcqOptions(q: Question): string[] {
  return Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [];
}

export function unitOf(q: Question): string {
  const o = q.options;
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const u = (o as { unit?: unknown }).unit;
    return typeof u === "string" ? u : "";
  }
  return "";
}

// Explication propre à une mauvaise réponse (si elle existe)
export function wrongNote(q: Question, optionIndex: number): string | null {
  const w = q.wrong_explanations;
  if (Array.isArray(w) && typeof w[optionIndex] === "string" && w[optionIndex]) {
    return w[optionIndex] as string;
  }
  return null;
}

// Accepte « 1 234,5 », « 4,75 % », « −4 »…
export function parseNumber(input: string): number | null {
  const s = input
    .trim()
    .replace(/[−–]/g, "-")
    .replace(/[ \u00a0\u202f]*%$/, "");
  if (!/^[+-]?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(s)) return null;
  const value = Number(s.replace(/[ \u00a0\u202f]/g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function checkNumeric(q: Question, value: number): boolean {
  const target = Number(q.correct);
  const allowed = Math.abs(target) * ((q.tolerance_pct ?? 0) / 100);
  return Math.abs(value - target) <= allowed + 1e-9;
}

export function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
}

// Texte de la bonne réponse, pour la correction
export function correctLabel(q: Question): string {
  if (q.type === "mcq") return mcqOptions(q)[Number(q.correct)] ?? "";
  if (q.type === "true_false") return q.correct === true ? "Vrai" : "Faux";
  const unit = unitOf(q);
  const tol = q.tolerance_pct ?? 0;
  return (
    fmt(Number(q.correct)) +
    (unit ? " " + unit : "") +
    (tol > 0 ? ` (tolérance de ± ${fmt(tol)} %)` : "")
  );
}
