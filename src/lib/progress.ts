// XP, niveaux. Les mêmes formules sont utilisées dans le SQL (fonction submit_session).
export type StatRow = { category_id: string; difficulty: string; answered: number; correct: number };

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1;
}

export function xpForLevel(level: number): number {
  return 60 * (level - 1) * (level - 1);
}

const NAMES = [
  "Étudiant",
  "Stagiaire",
  "Analyste junior",
  "Analyste",
  "Associate",
  "Vice-président",
  "Directeur",
  "Managing Director",
];

export function levelName(level: number): string {
  return NAMES[Math.min(Math.max(level, 1), NAMES.length) - 1];
}

export function levelProgress(xp: number): { level: number; into: number; span: number; pct: number } {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const into = xp - start;
  const span = end - start;
  return { level, into, span, pct: Math.min(100, Math.round((into / span) * 100)) };
}
