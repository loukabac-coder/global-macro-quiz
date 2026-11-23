import type { Progress } from "@/lib/modules";

export const LEVELS = [
  { id: "beginner", name: "Débutant" },
  { id: "intermediate", name: "Intermédiaire" },
  { id: "advanced", name: "Avancé" },
] as const;
export type ProgramLevel = (typeof LEVELS)[number]["id"];

export type StudyUnit = { slug: string; title: string; from?: ProgramLevel };
export type StudyGroup = {
  no: string;
  slug: string;
  title: string;
  track: "culture" | "technique";
  units: StudyUnit[];
};

export const TRACKS = [
  { id: "culture", title: "Culture économique et financière" },
  { id: "technique", title: "Technique" },
] as const;

export const GROUPS: StudyGroup[] = [
  { no: "01", slug: "macro", title: "Macroéconomie", track: "culture", units: [
    { slug: "pib", title: "PIB et taille des économies" },
    { slug: "inflation", title: "Inflation et pouvoir d’achat" },
    { slug: "emploi", title: "Emploi et cycles" },
    { slug: "finances", title: "Finances publiques" },
    { slug: "commerce", title: "Commerce international" },
  ] },
  { no: "02", slug: "banques", title: "Banques centrales et taux directeurs", track: "culture", units: [
    { slug: "institutions", title: "Institutions et mandats" },
    { slug: "taux", title: "Taux directeurs et transmission" },
    { slug: "instruments", title: "Instruments et bilan", from: "intermediate" },
    { slug: "decisions", title: "Communiqués et surprises", from: "intermediate" },
  ] },
  { no: "03", slug: "geopolitique", title: "Géopolitique et actualité économique", track: "culture", units: [
    { slug: "institutions", title: "Institutions et décisions publiques" },
    { slug: "echanges", title: "Sanctions et tensions commerciales" },
    { slug: "approvisionnement", title: "Routes et chaînes d’approvisionnement" },
    { slug: "actualite", title: "Lire l’actualité économique", from: "intermediate" },
  ] },
  { no: "04", slug: "reperes", title: "Repères de marché", track: "culture", units: [
    { slug: "capitalisations", title: "Capitalisations et grandes entreprises" },
    { slug: "indices", title: "Grands indices" },
    { slug: "devises", title: "Monnaies et cotations" },
    { slug: "matieres", title: "Prix et références des matières premières" },
    { slug: "producteurs", title: "Production, réserves et exportations" },
  ] },
  { no: "05", slug: "marches", title: "Marchés financiers et produits", track: "technique", units: [
    { slug: "bases", title: "Places de marché, cotation et liquidité" },
    { slug: "actions", title: "Actions et valorisation" },
    { slug: "obligations", title: "Obligations, rendements et risques" },
    { slug: "contrats", title: "Forwards, futures et couverture" },
    { slug: "options", title: "Options et résultats à l’échéance" },
    { slug: "structures", title: "Produits structurés" },
    { slug: "cas", title: "Cas d’entretien" },
  ] },
  { no: "06", slug: "mental", title: "Calcul mental et ordres de grandeur", track: "technique", units: [
    { slug: "pourcentages", title: "Pourcentages, variations et points de base" },
    { slug: "unites", title: "Unités, conversions et ratios" },
    { slug: "interets", title: "Intérêts simples et composés" },
    { slug: "estimations", title: "Estimations et guesstimates" },
  ] },
];

export const SUBMODULE_SIZE = 5;
export const SYNTHESIS_SIZE = 12;

export type Milestone = { id: string; group: StudyGroup; level: ProgramLevel; unit: StudyUnit | null };

export function milestoneSize(item: Milestone) {
  if (item.unit) return SUBMODULE_SIZE;
  if (item.group.no === "05") return [12, 14, 15][stageIndex(item.level)];
  if (item.group.no === "04" && item.level === "advanced") return 13;
  return SYNTHESIS_SIZE;
}

export function stageIndex(level: ProgramLevel) {
  return LEVELS.findIndex((item) => item.id === level);
}

export function unitsAt(group: StudyGroup, level: ProgramLevel) {
  return group.units.filter((unit) => !unit.from || stageIndex(unit.from) <= stageIndex(level));
}

export function unitCode(group: StudyGroup, unit: StudyUnit) {
  return `${group.no}.${group.units.indexOf(unit) + 1}`;
}

export function milestone(group: StudyGroup, level: ProgramLevel, unit: StudyUnit | null): Milestone {
  return { id: `p:${level[0]}:${group.no}:${unit?.slug ?? "synthese"}`, group, level, unit };
}

const milestones = LEVELS.flatMap(({ id }) => GROUPS.flatMap((group) =>
  [...unitsAt(group, id), null].map((unit) => milestone(group, id, unit))));
const byId = new Map(milestones.map((item) => [item.id, item]));

// Équivalences partielles. Les anciennes validations restent dans module_progress.
export const LEGACY_EQUIVALENCES: Record<string, readonly string[]> = {
  d1: ["p:b:06:pourcentages"],
  d2: ["p:b:04:capitalisations"],
  d3: ["p:b:05:actions", "p:b:05:obligations"],
  d4: ["p:b:02:institutions"],
  d5: ["p:b:01:pib", "p:b:01:inflation"],
  d6: ["p:b:04:devises", "p:b:04:matieres"],
  i1: ["p:i:06:pourcentages", "p:i:06:interets"],
  i2: ["p:i:04:capitalisations"],
  i3: ["p:i:05:obligations"],
  i4: ["p:i:02:taux", "p:i:02:institutions"],
  i5: ["p:i:01:finances", "p:i:01:pib"],
  i6: ["p:i:04:devises", "p:i:04:matieres"],
  a1: ["p:a:06:unites"],
  a2: ["p:a:02:taux"],
  a3: ["p:a:06:estimations"],
  a4: ["p:a:05:obligations"],
  a5: ["p:a:05:options"],
  e2: ["p:a:05:obligations"],
  e3: ["p:a:05:options"],
  e4: ["p:a:02:decisions"],
};
const legacyByMilestone = new Map<string, string[]>();
for (const [legacy, ids] of Object.entries(LEGACY_EQUIVALENCES)) {
  for (const id of ids) legacyByMilestone.set(id, [...(legacyByMilestone.get(id) ?? []), legacy]);
}

export const GUEST_MILESTONE = "p:b:06:pourcentages";

export function getMilestone(id: string | null): Milestone | undefined {
  return id ? byId.get(id) ?? byId.get(LEGACY_EQUIVALENCES[id]?.[0]) : undefined;
}

export function milestoneHref(item: Milestone) {
  return `/module?id=${encodeURIComponent(item.id)}`;
}

export function unitHref(group: StudyGroup, unit: StudyUnit) {
  return `/cours/${group.slug}/${unit.slug}`;
}

export function hasPassed(item: Milestone, progress: Progress) {
  return !!progress[item.id]?.passed ||
    !!legacyByMilestone.get(item.id)?.some((old) => progress[old]?.passed);
}

export function levelOpen(level: ProgramLevel, progress: Progress) {
  return LEVELS.slice(0, stageIndex(level)).every(({ id }) =>
    GROUPS.every((group) => hasPassed(milestone(group, id, null), progress)));
}

export function canAttempt(item: Milestone, progress: Progress) {
  return levelOpen(item.level, progress) && (!!item.unit ||
    unitsAt(item.group, item.level).every((unit) => hasPassed(milestone(item.group, item.level, unit), progress)));
}
