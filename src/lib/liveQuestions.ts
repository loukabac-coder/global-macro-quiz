import { shuffle, type Question } from "@/lib/quiz";
import { fmtCap, type Company, type MarketCaps } from "@/lib/marketcaps";
import { dataTimestamp } from "@/lib/dataFreshness";

const FRENCH_ISSUERS = new Set(["MC.PA", "OR.PA", "AI.PA", "SU.PA", "RMS.PA", "TTE.PA", "SAN.PA", "SAF.PA", "BNP.PA"]);

// Questions générées à partir des capitalisations du jour : leurs réponses
// se mettent à jour toutes seules chaque fois que le robot actualise les données.

function md(c: Company): number {
  return Math.round(c.market_cap_usd / 1e9);
}

function top(list: Company[], n: number): string {
  return list
    .slice(0, n)
    .map((c, i) => `${i + 1}. ${c.name} (${fmtCap(c.market_cap_usd)})`)
    .join(" ; ");
}

export function buildLiveQuestions(data: MarketCaps): Question[] {
  if (!data.updated_at || !Number.isFinite(Date.parse(data.updated_at))) return [];
  const collectedAt = new Date(data.updated_at);
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(collectedAt);
  const collection = dataTimestamp.format(collectedAt);
  const world = [...data.items].sort((a, b) => b.market_cap_usd - a.market_cap_usd);
  const europe = world.filter((c) => c.region === "Europe");
  const out: Question[] = [];
  let n = 0;

  const base = (diff: string, prompt: string, explanation: string) => ({
    id: `live:${day}:${n++}`,
    category_id: "market-caps",
    difficulty: diff,
    prompt: `${prompt} (collecte du ${collection}, heure de Paris)`,
    explanation,
    tolerance_pct: null as number | null,
    wrong_explanations: null,
    source: data.source,
    kind: "conjunctural",
    reference_date: day,
  });

  function mcq(diff: string, prompt: string, right: Company, wrong: Company[], explanation: string) {
    if (new Set([right.name, ...wrong.map((company) => company.name)]).size !== wrong.length + 1) return;
    out.push({
      ...base(diff, prompt, explanation),
      type: "mcq",
      options: [right.name, ...wrong.map((w) => w.name)],
      correct: 0,
    });
  }

  const apple = world.find((company) => company.ticker === "AAPL");
  if (apple?.price_date && md(apple) >= 500) {
    const correct = md(apple);
    out.push({
      ...base("intermediate", "Estime la capitalisation d’Apple en milliards de dollars, à 500 Md$ près.",
        `La collecte donne environ ${fmtCap(apple.market_cap_usd)} pour la séance du ${apple.price_date}.`),
      type: "numeric", options: { unit: "Md$" }, correct, tolerance_pct: 100 * 500 / correct,
      reference_date: apple.price_date,
    });
  }

  const french = world.filter((c) => FRENCH_ISSUERS.has(c.ticker)).slice(0, 4);
  if (french.length === 4 && french[0].market_cap_usd > french[1].market_cap_usd) {
    mcq("intermediate", "Parmi ces quatre valeurs françaises du panel, laquelle a la plus grande capitalisation ?",
      french[0], french.slice(1), `Classement de la sélection : ${top(french, 4)}.`);
  }

  if (world.length >= 8) {
    mcq(
      "intermediate",
      "Quelle entreprise a la plus grande capitalisation boursière parmi les grandes valeurs suivies ?",
      world[0],
      shuffle(world.slice(1, 8)).slice(0, 3),
      `Classement du panel : ${top(world, 5)}.`,
    );
    // Intrus : une entreprise qui n'est PAS dans le top 5
    const intruder = shuffle(world.slice(8, 20))[0];
    if (intruder) {
      mcq(
        "intermediate",
        "Laquelle de ces entreprises ne fait pas partie des cinq premières capitalisations du panel suivi ?",
        intruder,
        shuffle(world.slice(0, 5)).slice(0, 3),
        `Top 5 du panel : ${top(world, 5)}. ${intruder.name} est n°${world.indexOf(intruder) + 1} (${fmtCap(intruder.market_cap_usd)}).`,
      );
    }
    // Capitalisation d'une grande valeur, en Md$
    const pick = shuffle(world.slice(0, 5))[0];
    out.push({
      ...base("intermediate", `Quelle est la capitalisation boursière de ${pick.name} ? (ordre de grandeur, en milliards de dollars)`,
        `${pick.name} : environ ${fmtCap(pick.market_cap_usd)}. Classement du jour : ${top(world, 5)}.`),
      type: "numeric",
      options: { unit: "Md$" },
      correct: md(pick),
      tolerance_pct: 20,
    });
    // Comparaison de 4 entreprises éloignées dans le classement
    const spread = [0, 4, 9, 14, 19, 24].filter((i) => i < world.length);
    const four = shuffle(spread).slice(0, 4).map((i) => world[i]);
    const best = [...four].sort((a, b) => b.market_cap_usd - a.market_cap_usd);
    if (four.length === 4) {
      mcq(
        "intermediate",
        "Parmi ces quatre entreprises, laquelle a la plus grande capitalisation ?",
        best[0],
        best.slice(1),
        best.map((c) => `${c.name} : ${fmtCap(c.market_cap_usd)}`).join(" ; ") + ".",
      );
    }
  }

  if (europe.length >= 8) {
    mcq(
      "intermediate",
      "Quelle est la plus grande capitalisation boursière d’Europe (parmi les grandes valeurs suivies) ?",
      europe[0],
      shuffle(europe.slice(1, 8)).slice(0, 3),
      `Top Europe du jour : ${top(europe, 5)}.`,
    );
    const top3 = europe.slice(0, 3);
    const intruder = shuffle(europe.slice(5, 15))[0];
    if (intruder) {
      mcq(
        "intermediate",
        "Laquelle de ces entreprises ne fait pas partie des trois premières capitalisations européennes du panel ?",
        intruder,
        top3,
        `Top 3 Europe du jour : ${top(europe, 3)}. ${intruder.name} est n°${europe.indexOf(intruder) + 1} en Europe.`,
      );
    }
    const e = shuffle(europe.slice(0, 5))[0];
    out.push({
      ...base("intermediate", `Quelle est la capitalisation boursière de ${e.name} ? (ordre de grandeur, en milliards de dollars)`,
        `${e.name} : environ ${fmtCap(e.market_cap_usd)}. Top Europe : ${top(europe, 5)}.`),
      type: "numeric",
      options: { unit: "Md$" },
      correct: md(e),
      tolerance_pct: 25,
    });
  }

  // Meilleure entreprise d'un pays (parmi quatre du même pays)
  const byCountry = new Map<string, Company[]>();
  for (const c of world) byCountry.set(c.country, [...(byCountry.get(c.country) ?? []), c]);
  const eligible = [...byCountry.entries()].filter(([, l]) => l.length >= 4);
  if (eligible.length) {
    const [country, list] = shuffle(eligible)[0];
    const four = shuffle(list).slice(0, 4);
    const best = [...four].sort((a, b) => b.market_cap_usd - a.market_cap_usd);
    mcq(
      "intermediate",
      `Parmi ces quatre entreprises (${country}), laquelle a la plus grande capitalisation ?`,
      best[0],
      best.slice(1),
      best.map((c) => `${c.name} : ${fmtCap(c.market_cap_usd)}`).join(" ; ") + ".",
    );
  }
  return out;
}
