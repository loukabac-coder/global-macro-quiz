import type { Activity } from "@/lib/quizSession";
import { todayParis } from "@/lib/rng";

export function quizResumeKey(user: string | null, activity?: Activity, practice?: string): string {
  const date = activity?.type === "daily" ? `:${todayParis()}` : "";
  return `gmq:quiz:v2:${user ?? "local"}:${location.pathname}:${practice ?? JSON.stringify(activity) ?? "guest"}${date}`;
}

const MAX_AGE = 4 * 60 * 60 * 1000;

export function readQuizResume<T>(key: string): T | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as { created: number; value: T } | null;
    if (saved && Date.now() - saved.created < MAX_AGE) return saved.value;
    clearQuizResume(key);
  } catch {
    // Le stockage peut être indisponible dans certains navigateurs.
  }
  return null;
}

export function writeQuizResume<T>(key: string, value: T, created = Date.now()) {
  try {
    localStorage.setItem(key, JSON.stringify({ created, value }));
  } catch {
    // Une partie reste jouable même si le stockage est indisponible.
  }
}

export function clearQuizResume(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // La suppression du pointeur n’est pas requise pour terminer la partie.
  }
}
