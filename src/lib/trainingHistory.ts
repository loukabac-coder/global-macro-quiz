import { CURRICULUM } from "@/lib/curriculum/catalog";
import { GROUPS } from "@/lib/program";
import { indicatorScope } from "@/lib/studyReferences";

const indexed = new Map(CURRICULUM.map((q) => [q.id, q]));
const mentalUnits: Record<string, string> = {
  pourcentages: "pourcentages", variations: "pourcentages", bps: "pourcentages", interets: "interets",
  devises: "unites", ratios: "unites", multiplications: "unites", ordres: "estimations", estimations: "estimations",
};

export function trainingHistoryScope(id: string) {
  const question = indexed.get(id);
  if (question) return question;
  const [type, rawKind = "", rawKey = ""] = id.split(":");
  const [kind, kindTier] = rawKind.split("~");
  const [key, keyTier] = rawKey.split("~");
  let scope: string | undefined;
  let difficulty = "intermediate";
  if (type === "live") {
    scope = "reperes/capitalisations";
    if (/:(order|presence):/.test(id)) difficulty = "advanced";
  }
  if (type === "macro") {
    scope = kind.startsWith("gdp_ordre") ? "macro/pib" :
      indicatorScope({ tf_hicp: "ez_hicp_yoy", tf_cpi: "us_cpi_yoy", tf_fed_ecb: "fed_target_upper", tf_brent_wti: "brent", us_unrate: "unemployment_usa" }[kind] ?? kind);
    if (kind.startsWith("gdp_ordre") || kind === "copper_imf") difficulty = "advanced";
  }
  if (type === "production") {
    scope = "reperes/producteurs";
    if (key === "ordre") difficulty = "advanced";
  }
  if (type === "news") {
    scope = ["leader", "election"].includes(kind) ? "geopolitique/institutions" : "geopolitique/actualite";
    if (kind === "stage") difficulty = "advanced";
  }
  if (type === "policy") scope = "banques/decisions";
  if (type === "gen" && kind === "pib") return { groupNo: "01", unitSlug: "pib", difficulty: key };
  if (type === "gen" && kind === "capitalisations") return { groupNo: "04", unitSlug: "capitalisations", difficulty: key };
  if (type === "gen" && kind === "mental") {
    const topic = id.split(":").at(-3) ?? "";
    const level = Number(id.split(":").at(-2));
    if (mentalUnits[topic] && level) return { groupNo: "06", unitSlug: mentalUnits[topic], difficulty: level === 1 ? "beginner" : level <= 3 ? "intermediate" : "advanced" };
  }
  if ((kindTier ?? keyTier) === "debutant") difficulty = "beginner";
  if ((kindTier ?? keyTier) === "intermediaire") difficulty = "intermediate";
  if ((kindTier ?? keyTier) === "avance") difficulty = "advanced";
  const [group, unitSlug] = scope?.split("/") ?? [];
  const groupNo = GROUPS.find(({ slug }) => slug === group)?.no;
  return groupNo ? { groupNo, unitSlug, difficulty } : undefined;
}
