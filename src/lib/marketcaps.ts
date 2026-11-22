export type Company = {
  ticker: string;
  name: string;
  country: string;
  region: string;
  market_cap_usd: number;
};

export type MarketCaps = {
  updated_at: string | null;
  source: string;
  failed: string[];
  items: Company[];
};

// Charge le fichier mis à jour chaque jour par le robot.
export async function fetchMarketCaps(): Promise<MarketCaps | null> {
  try {
    const res = await fetch("/data/market-caps.json", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as MarketCaps;
    if (!data.updated_at || !Array.isArray(data.items) || data.items.length < 10) return null;
    return data;
  } catch {
    return null;
  }
}

// Âge des données en heures (nowMs est passé par l'appelant pour rester propre côté React).
export function ageHours(updatedAt: string, nowMs: number): number {
  return (nowMs - new Date(updatedAt).getTime()) / 3_600_000;
}

// 5 120 Md$ -> "5,12 T$" ; 842 Md$ -> "842 Md$"
export function fmtCap(usd: number): string {
  const md = usd / 1e9;
  if (md >= 1000) return `${(md / 1000).toFixed(2).replace(".", ",")} T$`;
  return `${Math.round(md).toLocaleString("fr-FR")} Md$`;
}

export function frDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
