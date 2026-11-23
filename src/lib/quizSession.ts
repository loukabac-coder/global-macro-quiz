import type { Topic } from "@/lib/mental";
import type { Question } from "@/lib/quiz";

export type QuizMode = "quick" | "training" | "challenge" | "daily" | "mixed" | "weakness";
export const EXAM_PROFILES = {
  general: "Généraliste",
  culture: "Culture économique et financière",
  technique: "Technique et calcul",
} as const;
export type ExamProfile = keyof typeof EXAM_PROFILES;
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
  | { type: "quick" | "mixed" | "daily" | "weakness" | "placement" }
  | { type: "exam"; profile?: ExamProfile }
  | { type: "training"; categories: string[]; levels: string[]; history?: HistoryFilter; group?: string; units?: string[] }
  | { type: "mental"; level: number; topic: Topic | null; timed: boolean }
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
  id?: string;
  questions: Question[];
  feedback: Feedback[];
  issuedSeconds: number;
  questionSeconds: number | null;
  timeLimit: number;
  summary: QuizSummary | null;
};
