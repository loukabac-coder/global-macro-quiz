import { shuffle, type Question } from "@/lib/quiz";
import { balanced } from "@/lib/loaders";
import { hashString, mulberry32, seededShuffle } from "@/lib/rng";
import { mentalQuestion } from "@/lib/mental";

// Questions du mode invité : un fichier du site (public/data/guest-questions.json).
// Il ne dépend pas de Supabase : le test marche en quelques secondes, même sans compte.
let cache: Question[] | null = null;

export async function fetchGuestPool(): Promise<Question[]> {
  if (cache) return cache;
  const res = await fetch("/data/guest-questions.json");
  if (!res.ok) throw new Error("Questions du mode invité introuvables.");
  cache = (await res.json()) as Question[];
  return cache;
}

// Quiz rapide : surtout des questions faciles, une plus difficile à la fin.
export async function guestQuick(n = 5): Promise<Question[]> {
  const pool = await fetchGuestPool();
  const easy = balanced(pool.filter((q) => q.difficulty === "beginner"), Math.max(1, n - 2));
  const used = new Set(easy.map((q) => q.id));
  const mid = shuffle(pool.filter((q) => q.difficulty === "intermediate" && !used.has(q.id))).slice(0, 1);
  const calc = [mentalQuestion(1, Math.random)];
  return shuffle(easy).concat(calc, mid).slice(0, n);
}

// Défi du jour (invité) : les mêmes questions pour tous les invités un jour donné.
export async function guestDaily(day: string): Promise<Question[]> {
  const pool = await fetchGuestPool();
  const rng = mulberry32(hashString("guest-daily:" + day));
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const picked = seededShuffle(sorted, rng).slice(0, 7);
  const mental = [mentalQuestion(2, rng), mentalQuestion(3, rng), mentalQuestion(2, rng)];
  return seededShuffle([...picked, ...mental], rng).slice(0, 10);
}
