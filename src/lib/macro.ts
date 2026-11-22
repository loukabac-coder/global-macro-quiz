export type Indicator = {
  label: string;
  value: number;
  unit: string;
  ref_date: string; // date de l'observation (AAAA-MM-JJ)
  source: string;
  max_age_days: number; // au-delà, la donnée n'est plus utilisée dans les questions
  frequency?: "daily" | "monthly";
  retrieved_at?: string;
  published_at?: string;
  status?: string | null;
};

export type MacroData = {
  updated_at: string | null;
  indicators: Record<string, Indicator>;
  failed?: string[];
};

export async function fetchMacro(): Promise<MacroData | null> {
  try {
    const res = await fetch("/data/macro.json", { cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json()) as MacroData;
    if (!d.updated_at || !d.indicators) return null;
    return d;
  } catch {
    return null;
  }
}

export function ageDays(ind: Indicator, nowMs: number): number {
  return Math.floor((nowMs - Date.parse(ind.ref_date + "T00:00:00Z")) / 86_400_000);
}

export function isFresh(ind: Indicator, nowMs: number): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ind.ref_date)) return false;
  const date = new Date(ind.ref_date + "T00:00:00Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== ind.ref_date) return false;
  const age = ageDays(ind, nowMs);
  return Number.isFinite(ind.value) && age >= 0 && age <= ind.max_age_days;
}

export function isDatedObservation(key: string, ind: Indicator): boolean {
  // Les anciens fichiers associaient à l’or le jour de collecte, sans date de séance.
  return key !== "gold" || !!ind.retrieved_at;
}

export function referenceLabel(key: string, ind: Indicator): string {
  const date = new Date(ind.ref_date + "T00:00:00Z");
  if (!Number.isFinite(date.getTime())) return "Date indisponible";
  const monthly = ind.frequency === "monthly" || ["us_cpi_yoy", "ez_hicp_yoy", "us_unrate"].includes(key);
  return new Intl.DateTimeFormat("fr-FR", monthly
    ? { month: "long", year: "numeric", timeZone: "UTC" }
    : { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
}

export function fmtValue(ind: Indicator): string {
  const d = ind.unit === "" ? 4 : 2;
  return ind.value.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) + (ind.unit ? " " + ind.unit : "");
}
