import { fmt, type Question } from "@/lib/quiz";
import { fmtCap, isCompanyQuoteForDay, verifiedCompanies, type Company, type MarketCaps } from "@/lib/marketcaps";
import { todayParis } from "@/lib/rng";

export const FRENCH_ISSUERS = new Set([
  "MC.PA", "OR.PA", "AI.PA", "SU.PA", "RMS.PA", "TTE.PA", "SAN.PA", "SAF.PA", "BNP.PA", "DG.PA", "EL.PA", "DSY.PA", "CS.PA",
]);

type RankPanel = { key: string; title: string; companies: Company[]; date: string };

export function comparablePanels(companies: Company[]): RankPanel[] {
  const countries = [...new Set(companies.map((company) => company.country))];
  const scopes = [
    ["fr", "des groupes français suivis selon le domicile de l’émetteur", companies.filter((c) => FRENCH_ISSUERS.has(c.ticker))],
    ["europe", "des grandes valeurs européennes suivies", companies.filter((c) => c.region === "Europe")],
    ["us", "des grandes valeurs américaines suivies", companies.filter((c) => c.country === "États-Unis")],
    ["world", "des grandes valeurs mondiales suivies", companies],
    ...countries.filter((country) => country !== "France" && country !== "États-Unis").map((country) =>
      [`pays:${country}`, `des entreprises suivies · ${country}`, companies.filter((company) => company.country === country)] as const),
  ] as const;
  return scopes.flatMap(([key, title, rows]) => {
    const sessions = new Map<string, Company[]>();
    for (const row of rows) {
      const session = row.price_date;
      if (!session || (row.currency !== "USD" && row.fx_date !== session)) continue;
      sessions.set(session, [...(sessions.get(session) ?? []), row]);
    }
    const latest = [...sessions].filter(([, list]) => list.length >= 2).sort(([a], [b]) => b.localeCompare(a))[0];
    if (!latest) return [];
    const [date, sameSession] = latest;
    return [{ key, title, date, companies: sameSession.toSorted((a, b) => b.market_cap_usd - a.market_cap_usd) }];
  });
}

function base(id: string, family: string, competency: string, date: string, source: string, difficulty: string): Omit<Question, "type" | "prompt" | "options" | "correct" | "tolerance_pct" | "explanation"> {
  return {
    id: `live:${id}:${date}`, family: `capitalisations:${family}`, competency, category_id: "market-caps",
    difficulty, source, kind: "conjunctural", reference_date: date, wrong_explanations: null, max_seconds: 45,
  };
}

export function buildLiveQuestions(data: MarketCaps, nowMs = Date.now()): Question[] {
  const day = todayParis(nowMs);
  const verified = verifiedCompanies(data, nowMs).filter((company) => isCompanyQuoteForDay(company, day));
  const individual: Question[] = verified.map((company) => {
    const md = company.market_cap_usd / 1e9;
    const absolute = ["AAPL", "NVDA"].includes(company.ticker) && md >= 1000 ? 500 : Math.max(1, Math.round(md * 0.2));
    const date = company.price_date!;
    const source = [data.source, company.fx_date ? `change ${company.fx_date} · ${company.fx_source ?? "source de conversion"}` : null].filter(Boolean).join(" · ");
    return {
      ...base(company.ticker, "estimation", "Estimer une capitalisation datée", date, source, "intermediate"),
      type: "numeric", options: { unit: "Md$" }, correct: md, tolerance_pct: 100 * absolute / md,
      prompt: `Estime la capitalisation de ${company.name} en milliards de dollars pour la séance du ${date}. Marge de ±${fmt(absolute)} Md$.`,
      explanation: `${company.name} représente environ ${fmtCap(company.market_cap_usd)}. La valeur est exprimée en dollars américains pour la séance indiquée.`,
    };
  });
  const rankings: Question[] = comparablePanels(verified).flatMap(({ key, title, date, companies }) => {
    if (companies.length < 5) return [];
    const first = companies[0];
    if (first.market_cap_usd === companies[1].market_cap_usd || companies[2].market_cap_usd === companies[3].market_cap_usd) return [];
    const top = companies.slice(0, 5).map((c, i) => `${i + 1}. ${c.name} (${fmtCap(c.market_cap_usd)})`).join(" · ");
    const scope = `Panel ${title}, ${companies.length} entreprises comparables en dollars américains au ${date}`;
    const source = `${data.source} · ${scope}`;
    const labels = companies.slice(0, 5).map((c) => c.name);
    const candidate = key === "fr" || key === "us" ? 1 : 3;
    return [
      {
        ...base(`${key}:leader`, "rang", "Identifier une entreprise en tête", date, source, "intermediate"),
        type: "mcq", options: [labels[1], labels[0], labels[3]], correct: 1, tolerance_pct: null,
        prompt: `${scope}. Quelle entreprise a la plus grande capitalisation ?`,
        explanation: `Voici les cinq premières entreprises de ce panel. ${top}.`,
      },
      {
        ...base(`${key}:top-three`, "trio", "Identifier trois grandes capitalisations", date, source, "intermediate"),
        type: "mcq", options: [[0, 1, 3], [0, 2, 4], [0, 1, 2]].map((indexes) => indexes.map((i) => labels[i]).join(", ")), correct: 2, tolerance_pct: null,
        prompt: `${scope}. Quelles sont les trois premières capitalisations ?`,
        explanation: `La comparaison porte sur les entreprises du panel à la même date. ${top}.`,
      },
      {
        ...base(`${key}:presence`, "presence", "Vérifier l’appartenance à un trio de tête", date, source, "advanced"),
        type: "true_false", options: null, correct: candidate < 3, tolerance_pct: null,
        prompt: `${scope}. ${labels[candidate]} figure parmi les trois premières capitalisations.`,
        explanation: `${labels[candidate]} est au rang ${candidate + 1} dans le panel. ${top}.`,
      },
      {
        ...base(`${key}:order`, "classement", "Classer plusieurs sociétés par valeur", date, source, "advanced"),
        type: "mcq", options: [[2, 1, 0], [0, 1, 2], [1, 0, 2]].map((indexes) => indexes.map((i) => labels[i]).join(" → ")), correct: 1, tolerance_pct: null,
        prompt: `${scope}. Quel ordre place ces sociétés de la plus grande capitalisation à la plus petite ?`,
        explanation: `Du premier au cinquième, le panel donne ${top}.`,
      },
    ];
  });
  return [...individual, ...rankings];
}
