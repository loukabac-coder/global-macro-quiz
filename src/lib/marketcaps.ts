import { CHECK_MAX_HOURS, observationAge, wasRecentlyChecked } from "@/lib/dataFreshness";

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
  retrieved_at?: string;
};

export type MarketCaps = {
  updated_at: string | null;
  source: string;
  failed: string[];
  items: Company[];
  previous_items?: Company[];
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

export function companyCheckedAt(data: MarketCaps, row: Company) {
  return row.retrieved_at ?? (data.failed.includes(row.ticker) ? null : data.updated_at);
}

export function verifiedCompanies(data: MarketCaps, nowMs: number): Company[] {
  function dated(date?: string | null) {
    const age = date ? observationAge(date, nowMs) : NaN;
    return age >= 0 && age <= 7;
  }
  return data.items.filter((row) => {
    const retrieved = companyCheckedAt(data, row);
    return dated(row.price_date) && (row.currency === "USD" || dated(row.fx_date))
      && wasRecentlyChecked(retrieved, nowMs, CHECK_MAX_HOURS);
  });
}

export function isCompanyQuoteForDay(row: Company, day: string): boolean {
  return row.price_date === day && (row.currency === "USD" || row.fx_date === day);
}

export function hasFreshMarketCaps(data: MarketCaps, nowMs: number): boolean {
  return verifiedCompanies(data, nowMs).length > 0;
}

// 5 120 Md$ -> "5,12 T$" ; 842 Md$ -> "842 Md$"
export function fmtCap(usd: number): string {
  const md = usd / 1e9;
  if (md >= 1000) return `${(md / 1000).toFixed(2).replace(".", ",")} T$`;
  return `${Math.round(md).toLocaleString("fr-FR")} Md$`;
}
