import type { Topic } from "@/lib/mental";
import type { Question } from "@/lib/quiz";

export type QuizMode = "quick" | "training" | "challenge" | "daily" | "mixed" | "weakness";
export type Game = "calcul" | "ordres" | "culture";
export type Activity =
  | { type: "quick" | "mixed" | "daily" | "weakness" | "placement" }
  | { type: "training"; categories: string[]; levels: string[] }
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
};

export function mentalSeconds(level: number): number {
  return level >= 4 ? 30 : 20;
}

export function gameSeconds(game: Game, level: number): number {
  return game === "calcul" ? mentalSeconds(level) : game === "ordres" ? 30 : 15;
}
