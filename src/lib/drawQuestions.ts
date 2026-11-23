import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { questionFamily, questionLocation } from "@/lib/curriculum/legacyMapping";
import { milestoneSize, unitsAt, type Milestone } from "@/lib/program";
import { shuffle, type Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";

export function diverseDraw(
  pool: Question[],
  size: number,
  recent: ReadonlySet<string> = new Set(),
  bucketOf: (q: Question) => string = (q) => q.category_id,
): Question[] {
  const ids = new Set<string>();
  const prompts = new Set<string>();
  const candidates = pool.filter((q) => {
    const prompt = searchText(q.prompt);
    if (ids.has(q.id) || prompts.has(prompt)) return false;
    ids.add(q.id);
    prompts.add(prompt);
    return true;
  });
  const selected: Question[] = [];
  const families = new Map<string, number>();
  const skills = new Map<string, number>();
  const buckets = new Map<string, number>();

  while (selected.length < size && candidates.length) {
    let bestIndex = 0;
    let best = Infinity;
    candidates.forEach((q, index) => {
      const family = questionFamily(q);
      const repeats = families.get(family) ?? 0;
      const score = (repeats >= 2 ? 100 : repeats * 3)
        + (skills.get(q.competency ?? family) ?? 0) * 7
        + (buckets.get(bucketOf(q)) ?? 0) * 4
        + (recent.has(q.id) ? 5 : 0);
      if (score < best) {
        best = score;
        bestIndex = index;
      }
    });
    const [q] = candidates.splice(bestIndex, 1);
    const family = questionFamily(q);
    const skill = q.competency ?? family;
    const bucket = bucketOf(q);
    families.set(family, (families.get(family) ?? 0) + 1);
    skills.set(skill, (skills.get(skill) ?? 0) + 1);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    selected.push(q);
  }
  return selected;
}

export function milestoneDraw(item: Milestone, live: Question[] = [], recent = new Set<string>(), size = milestoneSize(item)) {
  const units = new Set((item.unit ? [item.unit] : unitsAt(item.group, item.level)).map((unit) => unit.slug));
  const pool = [
    ...curriculumQuestions({ levels: [item.level] }),
    ...live.filter((q) => q.reference_date && q.difficulty === item.level).map((q) => ({ ...q, ...questionLocation(q) })),
  ].filter((q) => q.groupNo === item.group.no && units.has(q.unitSlug));
  return diverseDraw(shuffle(pool), size, recent, (q) => "unitSlug" in q ? String(q.unitSlug) : q.category_id);
}
