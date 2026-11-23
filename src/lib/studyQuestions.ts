import { diverseDraw } from "@/lib/drawQuestions";
import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { questionLocation } from "@/lib/curriculum/legacyMapping";
import { buildLiveQuestions } from "@/lib/liveQuestions";
import { buildMacroQuestions } from "@/lib/macroQuestions";
import { buildNewsQuestions, electionSummary, isNewsVerified, POLICY_MOVEMENT } from "@/lib/news";
import { GROUPS } from "@/lib/program";
import { PRODUCTION_SERIES, verifiedTable, type ProductionData } from "@/lib/production";
import { fmt, shuffle, type Question } from "@/lib/quiz";
import { buildStudyView, type StudySources } from "@/lib/studyReferences";

export function stableReferenceKey(id: string): string {
  return /^(macro|live|news:(leader|election)|production|policy):/.test(id) ? id.replace(/:(\d{4}-\d{2}-\d{2}|\d{4})$/, "") : id;
}

export function productionQuestions(data: ProductionData, now: number): Question[] {
  return Object.entries(PRODUCTION_SERIES).flatMap(([key, meta]) => {
    const table = data.tables[key];
    if (!table || !verifiedTable(table, now) || table.rows.length < 4) return [];
    const [a, b, c, d] = table.rows;
    const reference_href = `/cours/reperes/producteurs#${key}`;
    const explanation = table.rows.slice(0, 4).map((row) => `${row.name} · ${fmt(row.value)} ${meta.unit}`).join(" / ");
    const common = {
      category_id: "commodities", kind: "conjunctural", reference_date: `${table.year}-01-01`,
      reference_href, explanation, source: table.source, source_url: table.url, wrong_explanations: null,
    };
    const panel = `${meta.title} (${table.year}). ${meta.scope}.`;
    const result: Question[] = [{
      ...common, id: `production:${key}:volume:${table.year}`, reference_key: `production:${key}:volume`,
      type: "numeric", difficulty: "intermediate", family: "production:quantite", competency: "Estimer un volume publié",
      correct: a.value, options: { unit: meta.unit }, tolerance_pct: 15,
      prompt: `${panel} Quel ordre de grandeur pour ${a.name}, en ${meta.unit} ?`,
    }];
    if (a.value > b.value) {
      result.push({
        ...common, id: `production:${key}:leader:${table.year}`, reference_key: `production:${key}:leader`,
        type: "mcq", difficulty: "intermediate", family: "production:tete", competency: "Reconnaître le pays en tête",
        correct: 1, options: [c.name, a.name, b.name, d.name], tolerance_pct: null,
        prompt: `${panel} Quel pays arrive en tête dans ce classement ?`,
      });
    }
    if (a.value > b.value && b.value > c.value) {
      result.push({
        ...common, id: `production:${key}:ordre:${table.year}`, reference_key: `production:${key}:ordre`,
        type: "mcq", difficulty: "advanced", family: "production:ordre", competency: "Ordonner des pays",
        correct: 2, options: [[c, b, a], [b, a, c], [a, b, c]].map((order) => order.map((x) => x.name).join(" → ")),
        tolerance_pct: null, prompt: `${panel} Quel est l’ordre décroissant parmi ces trois pays ?`,
      });
    }
    return result;
  });
}

export function buildStudyQuestions(sources: StudySources, now: number) {
  const market = buildLiveQuestions(sources.caps, now).map((q) => {
    const key = stableReferenceKey(q.id);
    const slug = key.slice(5);
    const panel = slug.slice(0, slug.lastIndexOf(":"));
    const anchor = panel ? `panel-${panel}` : `cap-${slug}`;
    return { ...q, reference_key: key, reference_href: `/cours/reperes/capitalisations#${encodeURIComponent(anchor)}` };
  });
  const news = buildNewsQuestions(sources.news, now).map((q) => {
    const key = stableReferenceKey(q.id);
    const leader = key.startsWith("news:leader:");
    const id = key.split(":").at(-1)!;
    const scope = leader ? "institutions" : "actualite";
    return { ...q, reference_key: key, reference_href: `/cours/geopolitique/${scope}#${leader ? "leader" : "news"}-${id}` };
  });
  const policy: Question[] = (sources.news.decisions ?? []).filter((row) => isNewsVerified(row, now, 130)).map((row, i) => {
    const options = Object.values(POLICY_MOVEMENT);
    const shifted = [...options.slice(i % options.length), ...options.slice(0, i % options.length)];
    const label = POLICY_MOVEMENT[row.movement];
    return {
      id: `policy:${row.id}:${row.date}`, reference_key: `policy:${row.id}`, category_id: "monetary-policy",
      kind: "conjunctural", difficulty: "intermediate", type: "mcq", family: "monetaire:derniere-decision",
      competency: "Identifier le sens d’une décision monétaire",
      prompt: `${row.source} · quel mouvement du taux directeur a été annoncé dans la décision du ${row.date} ?`,
      options: shifted, correct: shifted.indexOf(label), tolerance_pct: null, explanation: `${label} · décision du ${row.date}.`,
      wrong_explanations: null, source: row.source, source_url: row.url, reference_date: row.date,
      reference_href: `/cours/banques/decisions#policy-${row.id}`,
    };
  });
  const elections: Question[] = (sources.news.elections ?? []).filter((row) => isNewsVerified(row, now, Infinity) && row.seats * 2 !== row.total).map((row) => ({
    id: `news:election:${row.id}:${row.date}`, reference_key: `news:election:${row.id}`,
    reference_href: `/cours/geopolitique/institutions#election-${row.id}`, category_id: "geopolitics",
    difficulty: "intermediate", type: "true_false", family: "institutions:elections",
    competency: "Distinguer le premier parti d’une majorité absolue",
    prompt: `Vrai ou faux. Le parti arrivé en tête du scrutin du ${row.date} en ${row.country} a obtenu plus de la moitié des sièges.`,
    correct: row.seats > row.total / 2, options: null, tolerance_pct: null, explanation: electionSummary(row),
    wrong_explanations: null, source: row.source, source_url: row.url, kind: "conjunctural", reference_date: row.date,
  }));
  return [...market, ...buildMacroQuestions(sources.macro, now), ...news, ...policy, ...elections, ...productionQuestions(sources.production, now)];
}

export function memoryDraw(sources: StudySources, scope: string, now: number): Question[] {
  const [groupSlug, unitSlug] = scope.split("/");
  const group = GROUPS.find(({ slug }) => slug === groupSlug);
  if (!group?.units.some(({ slug }) => slug === unitSlug)) return [];
  const view = buildStudyView(sources, scope, now);
  const rows = new Set(view.tables.flatMap((table) => table.rows.map((row) => row.id)));
  const tables = new Set(view.tables.map((table) => table.id));
  const course = `/cours/${scope}`;
  const pool = buildStudyQuestions(sources, now).flatMap((q) => {
    const [href, hash] = q.reference_href?.split("#") ?? [];
    const id = hash ? decodeURIComponent(hash) : "";
    if (href === course && (rows.has(id) || tables.has(id))) return [q];
    if (rows.has(id)) return [{ ...q, reference_href: `${course}#${encodeURIComponent(id)}` }];
    const { groupNo, unitSlug: unit } = questionLocation(q);
    return groupNo === group.no && unit === unitSlug && !q.reference_href ? [q] : [];
  });
  const unique = [...new Map(shuffle(pool).map((q) => [q.reference_key ?? q.id, q])).values()];
  const fresh = diverseDraw(unique, 5, new Set(), (q) => q.family ?? q.category_id);
  if (fresh.length === 5) return fresh;
  const structural = curriculumQuestions().filter((q) => q.groupNo === group.no && q.unitSlug === unitSlug);
  return [...fresh, ...diverseDraw(shuffle(structural), 5 - fresh.length)];
}
