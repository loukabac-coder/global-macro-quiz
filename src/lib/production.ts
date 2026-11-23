import { CHECK_MAX_HOURS, observationAge, wasRecentlyChecked, type SnapshotDates } from "@/lib/dataFreshness";

export const PRODUCTION_SERIES: Record<string, { title: string; unit: string; scope: string }> = {
  oil_production: { title: "Pétrole · production", unit: "milliers de barils/jour", scope: "Brut et condensats de concession · pays déclarants EIA" },
  oil_reserves: { title: "Pétrole · réserves prouvées", unit: "milliards de barils", scope: "Pétrole brut · pays détaillés par l’OPEP · fin d’année" },
  oil_exports: { title: "Pétrole · exportations", unit: "milliers de barils/jour", scope: "Pétrole brut · pays détaillés par l’OPEP · moyenne annuelle" },
  copper_production: { title: "Cuivre · production minière", unit: "milliers de tonnes", scope: "Cuivre contenu · pays détaillés par l’USGS" },
  copper_reserves: { title: "Cuivre · réserves", unit: "milliers de tonnes", scope: "Cuivre contenu · pays détaillés par l’USGS" },
  gold_production: { title: "Or · production minière", unit: "tonnes", scope: "Or contenu · pays détaillés par l’USGS" },
  gold_reserves: { title: "Or · réserves", unit: "tonnes", scope: "Or contenu · pays détaillés par l’USGS" },
  wheat_production: { title: "Blé · production", unit: "tonnes", scope: "Blé · pays et territoires déclarants FAOSTAT" },
  wheat_exports: { title: "Blé · exportations", unit: "tonnes", scope: "Blé · pays et territoires déclarants FAOSTAT" },
  cocoa_production: { title: "Cacao · production", unit: "tonnes", scope: "Fèves · pays et territoires déclarants FAOSTAT" },
  cocoa_exports: { title: "Cacao · exportations", unit: "tonnes", scope: "Fèves · pays et territoires déclarants FAOSTAT" },
};

export type ProductionTable = {
  year: number;
  source: string;
  url: string;
  retrieved_at: string;
  published_at?: string;
  rows: { name: string; value: number }[];
  previous?: { year: number; leader: string };
};

export type ProductionData = SnapshotDates & {
  tables: Record<string, ProductionTable>;
  failed: string[];
  checks?: Record<string, { at: string; ok: boolean }>;
};

export function verifiedTable(table: ProductionTable, now: number) {
  const age = observationAge(`${table.year}-01-01`, now);
  return age >= 0 && age <= 1461 && wasRecentlyChecked(table.retrieved_at, now, CHECK_MAX_HOURS);
}
