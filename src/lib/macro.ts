export type Indicator = {
  label: string;
  value: number;
  unit: string;
  ref_date: string; // date de l'observation (AAAA-MM-JJ)
  source: string;
  max_age_days: number; // au-delà, la donnée n'est plus utilisée dans les questions
};

export type MacroData = {
  updated_at: string | null;
  indicators: Record<string, Indicator>;
};

export async function fetchMacro(): Promise<MacroData | null> {
  try {
    const res = await fetch("/data/macro.json", { cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json()) as MacroData;
    if (!d.updated_at || !d.indicators) return null;
    // Les séries mensuelles sortent avec 2 à 6 semaines de retard : on tolère au moins 100 jours.
    for (const k of ["us_cpi_yoy", "ez_hicp_yoy", "us_unrate"]) {
      const ind = d.indicators[k];
      if (ind && ind.max_age_days < 100) ind.max_age_days = 100;
    }
    return d;
  } catch {
    return null;
  }
}

export function ageDays(ind: Indicator, nowMs: number): number {
  return (nowMs - new Date(ind.ref_date + "T12:00:00Z").getTime()) / 86_400_000;
}

export function isFresh(ind: Indicator, nowMs: number): boolean {
  return ageDays(ind, nowMs) <= ind.max_age_days;
}

export function fmtValue(ind: Indicator): string {
  const d = ind.unit === "%" ? 2 : ind.value >= 1000 ? 0 : 2;
  return ind.value.toLocaleString("fr-FR", { minimumFractionDigits: d === 0 ? 0 : 2, maximumFractionDigits: d }) + (ind.unit ? " " + ind.unit : "");
}
