import macroFallback from "../../public/data/macro.json" with { type: "json" };
import capsFallback from "../../public/data/market-caps.json" with { type: "json" };
import { isAtLeastAsRecent, observationAge, type SnapshotDates } from "@/lib/dataFreshness";
import type { MacroData } from "@/lib/macro";
import type { MarketCaps } from "@/lib/marketcaps";

const PUBLISHED_DATA = "https://raw.githubusercontent.com/loukabac-coder/global-macro-quiz/data-live/public/data";

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validTimestamp(value: unknown, now: number): value is string {
  if (typeof value !== "string") return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms <= now;
}

function validDay(value: unknown, now: number): value is string {
  return typeof value === "string" && observationAge(value, now) >= 0;
}

function isMacro(value: unknown, now: number): value is MacroData {
  if (!object(value) || !object(value.indicators) || !textList(value.failed)) return false;
  return Object.values(value.indicators).every(
    (row) => object(row) && typeof row.label === "string" && typeof row.unit === "string"
      && typeof row.source === "string" && typeof row.value === "number" && Number.isFinite(row.value)
      && typeof row.max_age_days === "number" && Number.isFinite(row.max_age_days) && row.max_age_days > 0
      && validDay(row.ref_date, now) && (row.retrieved_at === undefined || validTimestamp(row.retrieved_at, now))
      && (row.published_at === undefined || validTimestamp(row.published_at, now)),
  );
}

function isMarketCaps(value: unknown, now: number): value is MarketCaps {
  if (!object(value) || typeof value.source !== "string" || !textList(value.failed) || !Array.isArray(value.items)) return false;
  if (value.refresh_failed !== undefined && typeof value.refresh_failed !== "boolean") return false;
  if (value.items.length < 10 && (!value.refresh_failed || value.items.length !== 0)) return false;
  return value.items.every(
    (row) => object(row) && typeof row.ticker === "string" && typeof row.name === "string"
      && typeof row.country === "string" && typeof row.region === "string"
      && typeof row.market_cap_usd === "number" && Number.isFinite(row.market_cap_usd) && row.market_cap_usd > 0
      && (row.price_date === undefined || validDay(row.price_date, now))
      && (row.fx_date === null || row.fx_date === undefined || validDay(row.fx_date, now)),
  ) && new Set(value.items.map((row) => row.ticker)).size === value.items.length;
}

async function newest<T extends SnapshotDates>(
  filename: string, bundled: T, validate: (value: unknown, now: number) => value is T,
): Promise<T> {
  try {
    const response = await fetch(`${PUBLISHED_DATA}/${filename}`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return bundled;
    const value: unknown = await response.json();
    const now = Date.now();
    if (!validate(value, now) || !validTimestamp(value.checked_at, now)) return bundled;
    if (value.updated_at !== null && !validTimestamp(value.updated_at, now)) return bundled;
    return isAtLeastAsRecent(value, bundled) ? value : bundled;
  } catch {
    return bundled;
  }
}

export function readMacroSnapshot(): Promise<MacroData> {
  return newest<MacroData>("macro.json", macroFallback, isMacro);
}

export function readMarketCapsSnapshot(): Promise<MarketCaps> {
  return newest<MarketCaps>("market-caps.json", capsFallback, isMarketCaps);
}
