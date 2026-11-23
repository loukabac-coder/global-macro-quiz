import { CURRICULUM } from "@/lib/curriculum/catalog";
import { balanced } from "@/lib/loaders";
import type { Module } from "@/lib/modules";
import { shuffle, type Question } from "@/lib/quiz";

export function moduleQuestions(module: Module, count: number, live: Question[] = []): Question[] {
  const pool = CURRICULUM.filter((q) => q.moduleId === module.id);
  const dated = module.level === "beginner" ? [] : shuffle(live.filter((q) =>
    q.reference_date && q.difficulty === module.level && module.categories.includes(q.category_id),
  )).slice(0, count >= 10 ? 2 : 1);
  if (module.id === "d4") {
    const politics = shuffle(pool.filter((q) => q.category_id === "monetary-policy")).slice(0, Math.floor(count / 4));
    const banks = balanced(pool.filter((q) => q.category_id === "central-banks"), count - politics.length);
    return shuffle([...politics, ...banks]);
  }
  if (module.id === "d2" && count > 0) {
    const pairs = pool.filter((q) => q.id.endsWith(":duo") || q.id.endsWith(":duo-industrie"));
    const [culture] = shuffle(pairs);
    return shuffle([culture, ...balanced(pool.filter((q) => q.id !== culture.id), count - 1)]);
  }
  return shuffle([...dated, ...balanced(pool, count - dated.length)]);
}
