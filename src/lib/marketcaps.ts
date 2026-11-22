import { observationAge, wasRecentlyChecked } from "@/lib/dataFreshness";

export type Company = {
  ticker: string;
  name: string;
  country: string;
  region: string;
  market_cap_usd: number;
  price_date?: string;
  fx_date?: string | null;
  currency?: string;
  fx_source?: string | null;
};

export type MarketCaps = {
  updated_at: string | null;
  source: string;
  failed: string[];
  items: Company[];
  checked_at?: string;
  refresh_failed?: boolean;
};

export async function fetchMarketCaps(): Promise<MarketCaps | null> {
  try {
    const res = await fetch("/api/donnees?type=capitalisations", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as MarketCaps;
    if (!Array.isArray(data.items)) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasFreshMarketCaps(data: MarketCaps, nowMs: number): boolean {
  const dated = (date?: string | null) => {
    const age = date ? observationAge(date, nowMs) : NaN;
    return age >= 0 && age <= 7;
  };
  return !!data.checked_at && !data.refresh_failed && wasRecentlyChecked(data.updated_at, nowMs, 4, true)
    && data.items.length >= 10 && data.items.every((row) => dated(row.price_date) && (row.currency === "USD" || dated(row.fx_date)));
}

// 5 120 Md$ -> "5,12 T$" ; 842 Md$ -> "842 Md$"
export function fmtCap(usd: number): string {
  const md = usd / 1e9;
  if (md >= 1000) return `${(md / 1000).toFixed(2).replace(".", ",")} T$`;
  return `${Math.round(md).toLocaleString("fr-FR")} Md$`;
}
