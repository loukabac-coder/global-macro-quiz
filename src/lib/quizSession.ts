import type { Topic } from "@/lib/mental";
import type { Question } from "@/lib/quiz";

export type QuizMode = "quick" | "training" | "challenge" | "daily" | "mixed" | "weakness";
export type Game = "calcul" | "ordres" | "culture";
export const HISTORY_LABELS = {
  all: "Toutes les questions",
  unseen: "Jamais répondues",
  incorrect: "Dernière réponse incorrecte",
  correct: "Dernière réponse correcte",
} as const;
export type HistoryFilter = keyof typeof HISTORY_LABELS;

export function parseHistory(value: unknown): HistoryFilter {
  return typeof value === "string" && Object.hasOwn(HISTORY_LABELS, value) ? value as HistoryFilter : "all";
}

export type Activity =
  | { type: "quick" | "mixed" | "daily" | "weakness" | "placement" | "exam" }
  | { type: "training"; categories: string[]; levels: string[]; history?: HistoryFilter }
  | { type: "mental"; level: number; topic: Topic | null; timed: boolean }
  | { type: "game"; game: Game; level: number }
  | { type: "module"; id: string };

export type Answer = number | boolean | null;
export type Feedback = { question: Question; answer: Answer; ok: boolean; seconds: number; points: number; timedOut: boolean };
export type Placement = "debutant" | "intermediaire" | "avance";
export type QuizSummary = {
  xp_gained: number;
  xp: number;
  level: number;
  streak: number;
  unlocked: string[];
  placement?: Placement;
  module_passed?: boolean;
  corrections?: Feedback[];
};

export type ResumedQuiz = {
  questions: Question[];
  feedback: Feedback[];
  issuedSeconds: number;
  questionSeconds: number | null;
  timeLimit: number;
  summary: QuizSummary | null;
};

export function mentalSeconds(level: number): number {
  return level >= 4 ? 30 : 20;
}

export function gameSeconds(game: Game, level: number): number {
  return game === "calcul" ? mentalSeconds(level) : game === "ordres" ? 30 : 15;
}
