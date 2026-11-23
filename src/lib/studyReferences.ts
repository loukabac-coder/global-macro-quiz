import { dataTimestamp, type SnapshotDates } from "@/lib/dataFreshness";
import { comparablePanels } from "@/lib/liveQuestions";
import { isDatedObservation, isVerifiedMacro, referenceLabel, type MacroData } from "@/lib/macro";
import { companyCheckedAt, verifiedCompanies, type MarketCaps } from "@/lib/marketcaps";
import { electionSummary, isNewsVerified, POLICY_BANKS, POLICY_MOVEMENT, type NewsData } from "@/lib/news";
import { PRODUCTION_SERIES, verifiedTable, type ProductionData } from "@/lib/production";

export type StudySources = { macro: MacroData; caps: MarketCaps; news: NewsData; production: ProductionData };
export type StudyRow = {
  id: string;
  label: string;
  value: string;
  exact?: string;
  detail?: string;
  period?: string;
  checked?: string;
  published?: string | null;
  source?: string;
  url?: string;
  eligible?: boolean;
  pending?: boolean;
  attempted?: string;
  change?: string;
};
export type StudyTable = { id: string; title: string; scope?: string; rows: StudyRow[]; attempted?: string; collapsed?: boolean };
export type StudyView = SnapshotDates & { tables: StudyTable[]; essentials: StudyRow[]; changes: { anchor: string; text: string }[] };

export const INDEX_KEYS = ["index_cac", "index_sp500", "index_nasdaq100", "index_dax", "index_ftse", "index_nikkei", "index_stoxx"];
const FX_KEYS = ["eurusd", "eurgbp", "eurjpy", "eurchf", "usdjpy"];
const PRICES = ["gold", "copper", "brent", "wti", "copper_imf", "wheat_price", "cocoa_price"];
const RATES = ["ecb_deposit_rate", "fed_target_upper", "fed_target_lower", "boe_rate", "boj_rate", "snb_rate"];
const ECONOMIES = ["fra", "usa", "chn", "deu", "jpn", "ind", "gbr", "ita", "bra", "can", "kor", "esp"];
const FR_US_DE = ["fra", "usa", "deu"];
const byCountry = (name: string, list = FR_US_DE) => list.map((code) => `${name}_${code}`);

const INDICATOR_SCOPES: Record<string, { title: string; keys: string[] }[]> = {
  "macro/pib": [{ title: "PIB nominal", keys: byCountry("gdp", ECONOMIES) }, { title: "Croissance réelle", keys: byCountry("growth") }],
  "macro/inflation": [{ title: "Inflation annuelle", keys: ["ez_hicp_yoy", "us_cpi_yoy"] }],
  "macro/emploi": [{ title: "Emploi et activité", keys: ["us_unrate", ...byCountry("unemployment"), ...byCountry("growth")] }],
  "macro/finances": [{ title: "Dette et solde publics en pourcentage du PIB", keys: [...byCountry("debt"), ...byCountry("budget")] }],
  "macro/commerce": [{ title: "Solde courant", keys: byCountry("current_account", ["fra", "usa"]) }],
  "banques/taux": [{ title: "Taux directeurs en vigueur", keys: RATES }],
  "banques/decisions": [{ title: "Derniers taux et changements observés", keys: RATES }],
  "reperes/indices": [{ title: "Niveaux des grands indices", keys: INDEX_KEYS }],
  "reperes/devises": [{ title: "Cours de référence", keys: FX_KEYS }],
  "reperes/matieres": [{ title: "Prix et références", keys: PRICES }],
  "marches/obligations": [{ title: "Rendement de référence", keys: ["us_10y"] }],
  "mental/estimations": [{ title: "Population", keys: byCountry("population", ["wld", "fra", "usa", "chn", "ind", "deu", "jpn"]) },
    { title: "PIB nominal", keys: ["gdp_fra", "gdp_usa", "gdp_chn"] }],
};

const LABELS: Record<string, string> = {
  ez_hicp_yoy: "Inflation IPCH · zone euro", us_cpi_yoy: "Inflation IPC-U · États-Unis", us_unrate: "Chômage · États-Unis",
  ecb_deposit_rate: "BCE · facilité de dépôt", fed_target_upper: "Fed · borne haute", fed_target_lower: "Fed · borne basse",
  boe_rate: "Banque d’Angleterre · Bank Rate", boj_rate: "Banque du Japon · taux directeur de référence", snb_rate: "Banque nationale suisse · taux directeur",
  eurusd: "EUR/USD", eurgbp: "EUR/GBP", eurjpy: "EUR/JPY", eurchf: "EUR/CHF", usdjpy: "USD/JPY",
  index_cac: "CAC 40", index_sp500: "S&P 500", index_nasdaq100: "Nasdaq-100", index_dax: "DAX", index_ftse: "FTSE 100", index_nikkei: "Nikkei 225", index_stoxx: "EURO STOXX 50",
  gold: "Or · terme", copper: "Cuivre · terme", brent: "Brent · comptant", wti: "WTI · comptant",
  copper_imf: "Cuivre · moyenne mensuelle FMI", wheat_price: "Blé Chicago · terme", cocoa_price: "Cacao New York · terme", us_10y: "Treasury américain à 10 ans",
};

const FX_LABELS: Record<string, [string, string]> = {
  eurusd: ["1 €", "$"], eurgbp: ["1 €", "£"], eurjpy: ["1 €", "¥"], eurchf: ["1 €", "CHF"], usdjpy: ["1 $", "¥"],
};

const levelNote: Record<string, string> = {
  index_cac: "France · grandes actions cotées à Paris", index_sp500: "États-Unis · grandes actions américaines",
  index_nasdaq100: "États-Unis · grandes valeurs non financières cotées au Nasdaq",
  index_dax: "Allemagne · grandes actions cotées à Francfort", index_ftse: "Royaume-Uni · grandes actions cotées à Londres",
  index_nikkei: "Japon · grandes actions cotées à Tokyo", index_stoxx: "Zone euro · grandes actions de la zone euro",
};

const formats = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 3 });
const exactFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 10 });
const approx = (value: number, unit: string) => `≈ ${formats.format(value)} ${unit}`.trim();
const exact = (value: number, unit: string) => `${exactFormat.format(value)} ${unit}`.trim();
const dated = (stamp?: string | null) => stamp ? dataTimestamp.format(new Date(stamp)) : undefined;

export function hasStudyReferences(scope: string) {
  return Object.hasOwn(INDICATOR_SCOPES, scope) || ["reperes/capitalisations", "reperes/producteurs", "geopolitique/institutions", "geopolitique/actualite", "geopolitique/echanges", "geopolitique/approvisionnement"].includes(scope);
}

export function indicatorScope(key: string) {
  return Object.entries(INDICATOR_SCOPES).find(([, tables]) => tables.some((table) => table.keys.includes(key)))?.[0];
}

function indicatorRow(macro: MacroData, key: string, now: number): StudyRow {
  const row = macro.indicators[key];
  const label = row?.label ?? LABELS[key] ?? key.replace("_", " · ").toUpperCase();
  const id = `macro-${key}`;
  if (!row || !isDatedObservation(key, row)) return { id, label, value: "Première observation vérifiée attendue", pending: true };
  const eligible = isVerifiedMacro(macro, key, now);
  const [base, quoted] = FX_LABELS[key] ?? [];
  const policy = RATES.includes(key);
  const complete = base ? `${base} = ${exact(row.value, quoted)}` : exact(row.value, row.unit);
  const value = policy ? complete : base ? `${base} ${approx(row.value, quoted)}` : approx(row.value, row.unit);
  let change: string | undefined;
  let detail = levelNote[key] ?? (row.status ? `Statut de l’observation · ${row.status}` : undefined);
  if (eligible && policy && row.change_date && typeof row.change_from === "number") {
    const move = (row.value - row.change_from) * 100;
    const sentence = `${move > 0 ? "Hausse" : "Baisse"} de ${exact(Math.abs(move), "pb")} effective le ${row.change_date}.`;
    detail = sentence;
    if (now - Date.parse(row.change_date) <= 45 * 86_400_000) change = sentence;
  } else if (eligible && row.previous_date && row.previous_date < row.ref_date && typeof row.previous_value === "number") {
    const delta = row.value - row.previous_value;
    const percent = row.previous_value > 0 ? delta / row.previous_value * 100 : 0;
    if (row.unit === "%" ? Math.abs(delta) >= 0.1 : Math.abs(percent) >= 1) {
      const diff = row.unit === "%" ? exact(delta, "point(s)") : exact(Math.round(percent * 100) / 100, "%");
      change = `${delta > 0 ? "+" : ""}${diff} depuis ${referenceLabel(key, { ...row, ref_date: row.previous_date })}.`;
    }
  }
  return {
    id, label, value, exact: policy ? undefined : complete, detail,
    period: referenceLabel(key, row), checked: row.retrieved_at, published: row.published_at,
    source: row.source, url: row.source_url, eligible, change, pending: macro.failed?.includes(key),
  };
}

function capitalTables(data: MarketCaps, now: number): StudyTable[] {
  const checked = verifiedCompanies(data, now);
  const verified = new Set(checked.map((company) => company.ticker));
  const previous = comparablePanels(data.previous_items ?? []);
  const panels = comparablePanels(checked);
  const limits = { world: 10, europe: 8, fr: 5 } as const;
  const scopes = { world: "Panel mondial", europe: "Panel européen", fr: "Panel des groupes français" };
  const source = data.source;
  const featured = ["AAPL", "NVDA", "MSFT", "AMZN", "MC.PA", "OR.PA", "RMS.PA"];
  const capRow = (ticker: string): StudyRow => {
    const row = data.items.find((company) => company.ticker === ticker);
    const id = `cap-${ticker}`;
    if (!row?.price_date) return { id, label: row?.name ?? ticker, value: "Première séance vérifiée attendue", pending: true };
    const amount = row.market_cap_usd / 1e9;
    return {
      id, label: row.name, value: approx(amount, "Md$"), exact: exact(amount, "Md$"), period: row.price_date,
      checked: companyCheckedAt(data, row) ?? undefined, source, eligible: verified.has(ticker), pending: data.failed.includes(ticker),
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/`,
      detail: row.fx_date ? `Conversion en dollars · taux du ${row.fx_date}` : undefined,
    };
  };
  const companies: StudyTable = {
    id: "companies", title: "Grandes entreprises à retenir",
    rows: featured.map(capRow),
  };
  const otherCompanies = { id: "other-companies", title: "Autres entreprises suivies", collapsed: true,
    rows: data.items.filter((row) => !featured.includes(row.ticker)).map((row) => capRow(row.ticker)) };
  const extra = panels.filter(({ key, companies }) => !(key in limits) && companies.length >= 5);
  const definitions: [string, number][] = [...Object.entries(limits), ...extra.map(({ key }): [string, number] => [key, 5])];
  return [companies, ...definitions.map(([key, limit]): StudyTable => {
    const panel = panels.find((entry) => entry.key === key);
    const title = scopes[key as keyof typeof scopes] ?? `Panel ${panel?.title ?? key}`;
    if (!panel) return { id: `panel-${key}`, title, rows: [] };
    const cohort = new Set(panel.companies.map((company) => company.ticker));
    const old = previous.find((entry) => entry.key === key && entry.date < panel.date &&
      entry.companies.filter((company) => cohort.has(company.ticker)).length >= 0.9 * Math.max(entry.companies.length, cohort.size));
    const before = new Set(old?.companies.slice(0, limit).map((row) => row.ticker));
    return {
      id: `panel-${key}`, title, collapsed: !(key in limits),
      scope: `${panel.companies.length} entreprises comparables · dollars américains · séance du ${panel.date}`,
      rows: panel.companies.slice(0, limit).map((company, index) => ({
        id: `cap-${key}-${company.ticker}`, label: `${index + 1}. ${company.name}`,
        value: approx(company.market_cap_usd / 1e9, "Md$"), exact: exact(company.market_cap_usd / 1e9, "Md$"),
        period: panel.date, checked: companyCheckedAt(data, company) ?? undefined, source, eligible: true,
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(company.ticker)}/`,
        change: old && before.size >= limit && !before.has(company.ticker) && old.companies.some((x) => x.ticker === company.ticker)
          ? `Entre dans les ${limit} premiers du panel depuis la séance du ${old.date}.` : undefined,
      })),
    };
  }), otherCompanies];
}

function geopoliticsTables(data: NewsData, scope: string, now: number): StudyTable[] {
  const leaders: StudyTable = {
    id: "leaders", title: "Dirigeants et fonctions",
    rows: data.leaders.map((row) => {
      const eligible = isNewsVerified(row, now, 2);
      return {
        id: `leader-${row.id}`, label: row.office, value: row.name, period: row.date, checked: row.retrieved_at,
        source: row.source, url: row.url, eligible, pending: data.failed.includes(row.office),
        change: eligible && row.previous_name && row.previous_name !== row.name && row.change_date && now - Date.parse(row.change_date) <= 30 * 86_400_000
          ? `Succède à ${row.previous_name} selon le contrôle du ${row.change_date}.` : undefined,
      };
    }),
  };
  const topics = scope === "geopolitique/echanges" ? ["Commerce et coopération internationale", "Sanctions et mesures restrictives"]
    : scope === "geopolitique/approvisionnement" ? ["Énergie et approvisionnement"] : [];
  const news: StudyTable = {
    id: "news", title: "Faits récents à connaître",
    rows: data.events.filter((row) => !topics.length || topics.includes(row.topic)).slice(0, 16).map((row) => ({
      id: `news-${row.id}`, label: row.topic, value: row.title, detail: row.context,
      period: row.date, published: row.published_at, checked: row.retrieved_at,
      source: row.source, url: row.url, eligible: isNewsVerified(row, now, 35),
    })),
  };
  const elections: StudyTable = {
    id: "elections", title: "Résultats électoraux officiels",
    scope: "Dernier scrutin général suivi · répartition des sièges au lendemain du scrutin",
    rows: (data.elections ?? []).map((row) => ({
      id: `election-${row.id}`, label: row.country, value: electionSummary(row), period: row.date,
      source: row.source, url: row.url, checked: row.retrieved_at,
      eligible: isNewsVerified(row, now, Infinity),
      pending: data.failed.includes("Élections Canada · résultats officiels"),
    })),
  };
  if (scope.endsWith("/institutions")) return [leaders, elections];
  return scope.endsWith("/actualite") ? [news, elections] : [news];
}

function decisionsTable(data: NewsData, now: number): StudyTable {
  return {
    id: "policy", title: "Dernières décisions annoncées",
    scope: "Date de réunion ou d’annonce selon le communiqué officiel. Les taux en vigueur figurent dans le tableau ci-dessus.",
    rows: Object.entries(POLICY_BANKS).map(([id, label]) => {
      const row = data.decisions?.find((item) => item.id === id);
      const pending = data.failed.includes(label);
      if (!row) return { id: `policy-${id}`, label, value: "Première décision vérifiée attendue", pending, attempted: pending ? data.checked_at : undefined };
      return {
        id: `policy-${id}`, label, value: POLICY_MOVEMENT[row.movement], period: row.date,
        checked: row.retrieved_at, source: row.source, url: row.url, pending,
        eligible: isNewsVerified(row, now, 130),
      };
    }),
  };
}

function productionTables(data: ProductionData, now: number): StudyTable[] {
  return Object.entries(PRODUCTION_SERIES).map(([id, meta]) => {
    const table = data.tables[id];
    return {
      id, title: meta.title, scope: meta.scope, attempted: data.checks?.[id]?.at,
      rows: table ? table.rows.slice(0, 8).map((row, index) => ({
        id: `${id}-${index + 1}`, label: `${index + 1}. ${row.name}`,
        value: approx(row.value, meta.unit), exact: exact(row.value, meta.unit),
        period: String(table.year), checked: table.retrieved_at, published: table.published_at, source: table.source,
        url: table.url, eligible: verifiedTable(table, now), pending: data.failed.includes(id),
        change: index === 0 && verifiedTable(table, now) && table.previous && table.previous.leader !== row.name
          ? `Premier pays du tableau de ${table.year}. En ${table.previous.year}, le premier était ${table.previous.leader}.` : undefined,
      })) : [],
    };
  });
}

export function buildStudyView(sources: StudySources, scope: string, now: number): StudyView {
  const tables: StudyTable[] = scope === "reperes/capitalisations" ? capitalTables(sources.caps, now)
    : scope === "reperes/producteurs" ? productionTables(sources.production, now)
      : scope.startsWith("geopolitique/") ? geopoliticsTables(sources.news, scope, now)
        : (INDICATOR_SCOPES[scope] ?? []).map(({ title, keys }, i) => ({
          id: `observations-${i + 1}`, title, rows: keys.map((key) => indicatorRow(sources.macro, key, now)),
        }));
  if (scope === "banques/decisions" || scope === "banques/taux") tables.push(decisionsTable(sources.news, now));
  // Prend d’abord une ligne de chaque tableau, puis les autres repères disponibles.
  const favorites = tables.filter((table) => !table.collapsed).map((table) => table.rows.filter((row) => row.eligible));
  const essentials = [0, 1, 2, 3, 4, 5, 6].flatMap((i) => favorites.flatMap((rows) => rows[i] ?? [])).slice(0, 7);
  const changes = tables.flatMap((table) => table.rows.flatMap((row) => row.change ? [{ anchor: row.id, text: `${row.label} · ${row.change}` }] : [])).slice(0, 5);
  const publication = scope === "reperes/capitalisations" ? sources.caps : scope === "reperes/producteurs" ? sources.production : scope.startsWith("geopolitique/") ? sources.news : sources.macro;
  return { updated_at: publication.updated_at, checked_at: publication.checked_at, tables, essentials, changes };
}

export function studyDate(stamp?: string | null) {
  return dated(stamp);
}
