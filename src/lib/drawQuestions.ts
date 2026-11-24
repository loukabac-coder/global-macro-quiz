import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { questionFamily, questionLocation } from "@/lib/curriculum/legacyMapping";
import { milestoneSize, unitsAt, type Milestone } from "@/lib/program";
import { mentalQuestion, type Topic } from "@/lib/mental";
import { fmt, isNumeric, mcqOptions, shuffle, type Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";
import { distinctObservedMarketQuestions, isObservedMarketRecall } from "@/lib/marketRecall";
import { observationAge } from "@/lib/dataFreshness";

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

export function marketRecallDraw(
  pool: Question[], size: number, recent = new Set<string>(), bucket: (q: Question) => string = (q) => questionLocation(q).unitSlug,
  isObserved = isObservedMarketRecall,
) {
  const ordered = shuffle(pool).sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)));
  const observed = distinctObservedMarketQuestions(ordered.filter(isObserved));
  const direct = diverseDraw(observed.filter(isNumeric), Math.ceil(size * 0.6), recent, bucket);
  const taken = new Set(direct.map((q) => q.id));
  const additional = diverseDraw(observed.filter((q) => !taken.has(q.id)), Math.ceil(size * 0.7) - direct.length, recent, bucket);
  const selected = [...direct, ...additional];
  for (const q of additional) taken.add(q.id);
  const stablePool = ordered.filter((q) => !isObserved(q));
  const composition = selected.length < size && selected.some((q) => bucket(q) === "indices")
    ? stablePool.find((q) => q.family === "indices:composition-indice") : undefined;
  const stable = [
    ...(composition ? [composition] : []),
    ...diverseDraw(stablePool.filter((q) => q.id !== composition?.id), size - selected.length - Number(!!composition), recent, bucket),
  ];
  const rest = diverseDraw(observed.filter((q) => !taken.has(q.id)), size - selected.length - stable.length, recent, bucket);
  return shuffle([...selected, ...stable, ...rest]);
}

export function capitalisationDraw(
  pool: Question[], size: number, levels: Milestone["level"][], recent = new Set<string>(), eligible: (q: Question) => boolean = () => true,
): Question[] {
  if (size <= 0) return [];
  const estimates = distinctObservedMarketQuestions(shuffle(pool).filter((q) => q.reference_date && isNumeric(q)));
  const lesson = pool.filter((q) => !q.reference_date && !q.id.startsWith("gen:capitalisations:"));
  const calculation = (q: Question) => q.family === "capitalisations:ev" || isNumeric(q);
  const orderedLesson = shuffle(lesson).sort((a, b) => Number(calculation(b)) - Number(calculation(a)));
  const course = diverseDraw(orderedLesson, 1, recent);
  const wanted = size - course.length;
  const observed = diverseDraw(estimates, wanted, recent);
  const variants = observed.length < wanted
    ? levels.flatMap((level) => unitVariants("04", "capitalisations", level, 80)).filter(eligible)
    : [];
  const practice = diverseDraw(shuffle(variants), wanted - observed.length, recent, (q) => q.difficulty);
  return shuffle([...observed, ...practice, ...course]);
}

export function geopoliticsDraw(pool: Question[], size: number, recent = new Set<string>()): Question[] {
  const now = Date.now();
  const ordered = shuffle(pool).sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)));
  const references = new Set<string>();
  const facts = ordered.filter((q) => q.reference_date)
    .sort((a, b) => Number(observationAge(a.reference_date!, now) > 7) - Number(observationAge(b.reference_date!, now) > 7))
    .filter((q) => {
      const key = q.reference_href ?? q.id;
      if (references.has(key)) return false;
      references.add(key);
      return true;
    });
  const stable = ordered.filter((q) => !q.reference_date);
  const quota = Math.ceil(size * 0.4);
  const dated = diverseDraw(facts, quota, recent);
  const landmarks = diverseDraw(stable.filter((q) => q.family?.includes(":repere-")), Math.min(quota, size - dated.length), recent);
  const selected = [...dated, ...landmarks];
  const ids = new Set(selected.map((q) => q.id));
  const rest = diverseDraw([...stable, ...facts].filter((q) => !ids.has(q.id)), size - selected.length, recent);
  return shuffle([...selected, ...rest]);
}

export function milestoneDraw(item: Milestone, live: Question[] = [], recent = new Set<string>(), size = milestoneSize(item)) {
  const units = new Set((item.unit ? [item.unit] : unitsAt(item.group, item.level)).map((unit) => unit.slug));
  const pool = [
    ...curriculumQuestions({ levels: [item.level] }),
    ...live.filter((q) => q.reference_date && q.difficulty === item.level).map((q) => ({ ...q, ...questionLocation(q) })),
  ].filter((q) => q.groupNo === item.group.no && units.has(q.unitSlug));
  const bucket = (q: Question) => "unitSlug" in q ? String(q.unitSlug) : q.category_id;
  if (item.unit?.slug === "capitalisations") return capitalisationDraw(pool, size, [item.level], recent);
  if (item.group.no === "03" && item.level !== "beginner") return geopoliticsDraw(pool, size, recent);
  if (item.group.no === "04" && pool.some(isObservedMarketRecall)) return marketRecallDraw(pool, size, recent, bucket);
  const fresh = pool.filter((q) => !recent.has(q.id));
  const novel = diverseDraw(shuffle(fresh), size, recent, bucket);
  const novelPrompts = new Set(novel.map((q) => searchText(q.prompt)));
  const generated = novel.length < size ? [...units].flatMap((unit) => unitVariants(item.group.no, unit, item.level, size * 2))
    .filter((q) => !recent.has(q.id) && !novelPrompts.has(searchText(q.prompt))) : [];
  const chosen = [...novel, ...diverseDraw(shuffle(generated), size - novel.length, recent, bucket)];
  const prompts = new Set(chosen.map((q) => searchText(q.prompt)));
  return shuffle([...chosen, ...diverseDraw(shuffle(pool.filter((q) => !prompts.has(searchText(q.prompt)))), size - chosen.length, recent, bucket)]);
}

const mentalTopics: Record<string, Topic[]> = {
  pourcentages: ["pourcentages", "variations", "bps"], unites: ["devises", "ratios", "multiplications"],
  interets: ["interets"], estimations: ["estimations", "ordres"],
};

function unitVariants(group: string, unit: string, level: Milestone["level"], count: number): (Question & { groupNo: string; unitSlug: string })[] {
  const scope = { groupNo: group, unitSlug: unit };
  if (group === "06" && mentalTopics[unit]) {
    const topics = mentalTopics[unit];
    const rank = { beginner: 1, intermediate: 2, advanced: 4 }[level];
    return Array.from({ length: count }, (_, i) => ({ ...mentalQuestion(rank, Math.random, topics[i % topics.length]), ...scope }));
  }
  if (group === "04" && unit === "capitalisations") {
    return shuffle(Array.from({ length: 80 }, (_, i) => i + 1)).slice(0, count).map((i) => {
      const quote = (10 + i) * 5;
      const shares = [2, 4, 5, 8][i % 4];
      const expected = quote * shares;
      return {
        ...scope,
        id: `gen:capitalisations:${level}:${i}`, category_id: "market-caps", difficulty: level, type: "numeric",
        prompt: `Une société fictive cote ${quote} € par action et compte ${shares} millions d’actions. Estime sa capitalisation en M€.`,
        options: { unit: "M€" }, correct: expected, tolerance_pct: 0,
        explanation: `Garde les actions en millions. Dans cette unité, multiplie ${quote} € par ${shares}. Tu obtiens ${fmt(expected)} millions d’euros.`,
        kind: "structural", reference_date: null, source: null, wrong_explanations: null,
        family: "capitalisations:cours-fois-actions", competency: "Déduire la capitalisation du cours et du nombre d’actions",
      };
    });
  }
  if (group !== "01" || unit !== "pib") return [];
  return shuffle(Array.from({ length: 48 }, (_, i) => i + 1)).slice(0, count).map((i) => {
    const people = [10, 20, 25, 40][i % 4];
    const income = (10 + i) * 1000;
    const expected = people * income / 1000;
    return {
      ...scope,
      id: `gen:pib:${level}:${i}`, category_id: "macroeconomics", difficulty: level, type: "numeric",
      prompt: `Une économie fictive compte ${people} millions d’habitants et produit ${fmt(income)} $ par habitant. Quel est son PIB en Md$ ?`,
      options: { unit: "Md$" }, correct: expected, tolerance_pct: 0,
      explanation: `Exprime ${fmt(income)} $ en milliers de dollars, soit ${income / 1000}. Multiplie par les ${people} millions d’habitants. Millions × milliers donne ${fmt(expected)} milliards de dollars.`,
      kind: "structural", reference_date: null, source: null, wrong_explanations: null,
      family: "pib:reconstruire-un-montant", competency: "Passer du PIB par habitant au PIB total",
    };
  });
}

export type SeenChoice = Pick<Question, "id" | "options" | "false_first">;

export function newMilestoneDraw(item: Milestone, live: Question[], history: SeenChoice[][]) {
  const previous = history[0] ?? [];
  const old = new Map<string, SeenChoice>();
  for (const q of history.flat()) if (!old.has(q.id)) old.set(q.id, q);
  let draw = milestoneDraw(item, live, new Set(old.keys()));
  if (draw.length > 1 && draw.every((q, i) => q.id === previous[i]?.id)) draw = [...draw.slice(1), draw[0]];
  return draw.map((q) => {
    const last = old.get(q.id);
    if (q.type === "true_false") return { ...q, false_first: last ? !last.false_first : Math.random() < 0.5 };
    if (q.type !== "mcq") return q;
    const values = mcqOptions(q);
    const order = shuffle(values.map((_, i) => i));
    if (last && Array.isArray(last.options) && order.length > 1 && order.every((index, i) => values[index] === (last.options as string[])[i])) {
      [order[0], order[1]] = [order[1], order[0]];
    }
    const notes = q.wrong_explanations;
    return {
      ...q, options: order.map((index) => values[index]), correct: order.indexOf(Number(q.correct)),
      wrong_explanations: Array.isArray(notes) ? order.map((index) => notes[index]) : notes,
    };
  });
}
