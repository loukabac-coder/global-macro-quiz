import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { shuffle, type Question } from "@/lib/quiz";
import { balanced } from "@/lib/loaders";
import { hashString, mulberry32, seededShuffle } from "@/lib/rng";
import { LEVELS } from "@/lib/program";
import { diverseDraw } from "@/lib/drawQuestions";

export async function guestQuick(n = 5): Promise<Question[]> {
  const easy = balanced(curriculumQuestions({ levels: ["beginner"] }), n - 1);
  const bonus = shuffle(curriculumQuestions({ levels: ["intermediate"] }))[0];
  return [...easy, bonus];
}

// Le défi du jour partage le même tirage par niveau avec ou sans compte.
export function dailyQuestions(pool: Question[], day: string, live: Question[] = []): Question[] {
  const rng = mulberry32(hashString("daily:" + day));
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const sizes = [4, 4, 2];
  const verified = [...live].sort((a, b) => a.id.localeCompare(b.id));
  return LEVELS.flatMap(({ id }, i) => {
    const dated = id === "beginner" ? [] : diverseDraw(seededShuffle(verified.filter((q) => q.difficulty === id), rng), 1);
    return [...dated, ...diverseDraw(seededShuffle(sorted.filter((q) => q.difficulty === id), rng), sizes[i] - dated.length)];
  });
}
