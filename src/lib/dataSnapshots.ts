import macroFallback from "../../public/data/macro.json" with { type: "json" };
import capsFallback from "../../public/data/market-caps.json" with { type: "json" };
import newsFallback from "../../public/data/actualite.json" with { type: "json" };
import productionFallback from "../../public/data/production.json" with { type: "json" };
import { isAtLeastAsRecent, observationAge, type SnapshotDates } from "@/lib/dataFreshness";
import type { MacroData } from "@/lib/macro";
import type { MarketCaps } from "@/lib/marketcaps";
import type { NewsData } from "@/lib/news";
import type { ProductionData } from "@/lib/production";
import type { StudySources } from "@/lib/studyReferences";

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
      && (row.published_at === undefined || validTimestamp(row.published_at, now))
      && (row.previous_date === undefined || validDay(row.previous_date, now))
      && (row.change_date === undefined || validDay(row.change_date, now)),
  );
}

function isMarketCaps(value: unknown, now: number): value is MarketCaps {
  if (!object(value) || typeof value.source !== "string" || !textList(value.failed) || !Array.isArray(value.items)) return false;
  if (value.refresh_failed !== undefined && typeof value.refresh_failed !== "boolean") return false;
  function validCompanies(rows: unknown[]) {
    return rows.every(
    (row) => object(row) && typeof row.ticker === "string" && typeof row.name === "string"
      && typeof row.country === "string" && typeof row.region === "string"
      && typeof row.market_cap_usd === "number" && Number.isFinite(row.market_cap_usd) && row.market_cap_usd > 0
      && (row.price_date === undefined || validDay(row.price_date, now))
      && (row.retrieved_at === undefined || validTimestamp(row.retrieved_at, now))
      && (row.fx_date === null || row.fx_date === undefined || validDay(row.fx_date, now)),
    ) && new Set(rows.map((row) => (row as { ticker: string }).ticker)).size === rows.length;
  }
  return validCompanies(value.items) && (value.previous_items === undefined ||
    Array.isArray(value.previous_items) && validCompanies(value.previous_items));
}

function isNews(value: unknown, now: number): value is NewsData {
  if (!object(value) || !textList(value.failed) || !Array.isArray(value.events) || !Array.isArray(value.leaders)) return false;
  function fact(row: unknown): row is Record<string, unknown> {
    return object(row) && typeof row.id === "string" && typeof row.source === "string"
      && typeof row.url === "string" && row.url.startsWith("https://")
      && validDay(row.date, now) && validTimestamp(row.retrieved_at, now);
  }
  return value.events.every((row) => fact(row) && typeof row.title === "string" && typeof row.context === "string" &&
    typeof row.topic === "string" && (row.published_at == null || validTimestamp(row.published_at, now)))
    && value.leaders.every((row) => fact(row) && typeof row.name === "string" && typeof row.office === "string")
    && (value.decisions === undefined || Array.isArray(value.decisions) && value.decisions.every((row) =>
      fact(row) && ["unchanged", "up", "down"].includes(String(row.movement))))
    && (value.elections === undefined || Array.isArray(value.elections) && value.elections.every((row) =>
      fact(row) && typeof row.country === "string" && typeof row.winner === "string" && typeof row.seats === "number" &&
      typeof row.total === "number" && Number.isInteger(row.total) && Number.isInteger(row.seats) && row.seats > 0 && row.seats <= row.total));
}

function isProduction(value: unknown, now: number): value is ProductionData {
  if (!object(value) || !textList(value.failed) || !object(value.tables)) return false;
  return Object.values(value.tables).every((table) => {
    if (!object(table) || !Number.isInteger(table.year) || !validDay(`${table.year}-01-01`, now) ||
        typeof table.source !== "string" || typeof table.url !== "string" || !table.url.startsWith("https://") ||
        !validTimestamp(table.retrieved_at, now) || (table.published_at !== undefined && !validTimestamp(table.published_at, now)) ||
        !Array.isArray(table.rows) || table.rows.length < 3) return false;
    const rows = table.rows;
    return rows.every((row, i) => object(row) && typeof row.name === "string" && typeof row.value === "number" &&
      Number.isFinite(row.value) && row.value > 0 && (i === 0 || rows[i - 1].value >= row.value)) &&
      new Set(rows.map((row) => row.name)).size === rows.length;
  });
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
  return newest("macro.json", macroFallback as MacroData, isMacro);
}

export function readMarketCapsSnapshot(): Promise<MarketCaps> {
  return newest<MarketCaps>("market-caps.json", capsFallback, isMarketCaps);
}

export function readNewsSnapshot(): Promise<NewsData> {
  return newest("actualite.json", newsFallback as NewsData, isNews);
}

export function readProductionSnapshot(): Promise<ProductionData> {
  return newest<ProductionData>("production.json", productionFallback, isProduction);
}

export async function readStudySources(): Promise<StudySources> {
  const [macro, caps, news, production] = await Promise.all([
    readMacroSnapshot(), readMarketCapsSnapshot(), readNewsSnapshot(), readProductionSnapshot(),
  ]);
  return { macro, caps, news, production };
}
