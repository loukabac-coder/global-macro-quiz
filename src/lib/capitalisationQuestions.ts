import { dataTimestamp } from "@/lib/dataFreshness";
import { fmtCap, hasFreshMarketCaps, type MarketCaps } from "@/lib/marketcaps";
import { fmt, shuffle, type ModuleExercise } from "@/lib/quiz";

function mcq(prompt: string, options: string[], explanation: string, source: string | null = null): ModuleExercise {
  return { prompt, type: "mcq", options, correct: 0, explanation, tolerance_pct: null, source };
}

const FRENCH_PAIRS = [
  mcq(
    "Quel duo réunit deux grandes sociétés françaises cotées à Paris ?",
    ["LVMH et L’Oréal", "Nestlé et LVMH", "ASML et L’Oréal", "Apple et LVMH"],
    "LVMH et L’Oréal sont deux exemples de grandes valeurs françaises cotées à Paris. Nestlé est suisse, ASML néerlandaise et Apple américaine.",
    "Euronext, composition du CAC 40",
  ),
  mcq(
    "Parmi ces duos, lequel est constitué de deux grandes valeurs françaises ?",
    ["Air Liquide et Schneider Electric", "Air Liquide et Nestlé", "Schneider Electric et Microsoft", "Air Liquide et ASML"],
    "Air Liquide et Schneider Electric sont deux sociétés françaises cotées sur Euronext Paris.",
    "Euronext, composition du CAC 40",
  ),
];

const MARKET_CULTURE = [
  mcq("Quel indice suit les grandes valeurs cotées à Paris ?", ["CAC 40", "DAX", "S&P 500", "FTSE 100"],
    "Le CAC 40 est l’indice de référence pour les grandes valeurs cotées à Paris.", "Euronext"),
  mcq("Quel marché représente le S&P 500 ?", ["États-Unis", "France", "Allemagne", "Japon"],
    "Le S&P 500 suit environ 500 grandes entreprises américaines.", "S&P Dow Jones Indices"),
  mcq("À quelle entreprise correspond le ticker AAPL ?", ["Apple", "Alphabet", "Amazon", "ASML"],
    "AAPL est le symbole de l’action Apple au Nasdaq.", "Apple Investor Relations"),
  mcq("Dans quel secteur LVMH est-il principalement connu ?", ["Le luxe", "Les services bancaires", "Les semi-conducteurs", "L’énergie"],
    "LVMH est un groupe de luxe. Ses activités comprennent notamment la mode, la maroquinerie, les vins et spiritueux.", "LVMH, présentation du groupe"),
  mcq("Dans quel pays se trouve le siège d’ASML ?", ["Pays-Bas", "France", "Suisse", "États-Unis"],
    "ASML a son siège à Veldhoven, aux Pays-Bas.", "ASML, implantations"),
  mcq("Dans un indice pondéré par le flottant, quelles actions servent à calculer le poids d’une entreprise ?",
    ["Les actions disponibles à la négociation", "Uniquement les actions des fondateurs", "Uniquement les actions détenues par l’État", "Les actions que l’entreprise prévoit d’émettre"],
    "Le flottant désigne les actions disponibles à la négociation. L’indice pondère l’entreprise par la valeur de ces actions.",
    "S&P Dow Jones Indices, méthode de pondération"),
  mcq("Une action cote 200 € et une autre 25 €. Quelle information permet de comparer la taille boursière des deux entreprises ?",
    ["Leur capitalisation boursière", "Le seul prix d’une action", "Le nombre de places de cotation", "La date de leur dernière publication"],
    "La capitalisation tient compte du prix et du nombre d’actions en circulation. Les deux sociétés peuvent avoir des nombres d’actions très différents."),
];

const FRANCE = new Set(["MC.PA", "OR.PA", "AI.PA", "SU.PA", "RMS.PA", "TTE.PA", "SAN.PA", "SAF.PA", "BNP.PA"]);
const APPLE_MARGIN = 500; // Md$

function recentQuestions(data: MarketCaps | null, now: number): ModuleExercise[] {
  if (!data?.updated_at || !hasFreshMarketCaps(data, now)) return [];
  const collection = dataTimestamp.format(new Date(data.updated_at));
  const questions: ModuleExercise[] = [];
  const apple = data.items.find((company) => company.ticker === "AAPL");
  if (apple) {
    const correct = Math.round(apple.market_cap_usd / 1e9);
    if (correct >= APPLE_MARGIN) {
      questions.push({
        prompt: `Estime la capitalisation boursière d’Apple en milliards de dollars US, à ${APPLE_MARGIN} Md$ près. (Collecte du ${collection}, heure de Paris.)`,
        type: "numeric",
        options: { unit: "Md$" },
        correct,
        tolerance_pct: 100 * APPLE_MARGIN / correct,
        explanation: `La collecte donne une capitalisation estimée à ${fmt(correct)} Md$.`,
        kind: "conjunctural",
        reference_date: apple.price_date ?? null,
        source: data.source,
      });
    }
  }

  const france = data.items.filter((company) => FRANCE.has(company.ticker))
    .sort((a, b) => b.market_cap_usd - a.market_cap_usd).slice(0, 4);
  if (france.length === 4 && france[0].market_cap_usd > france[1].market_cap_usd) {
    questions.push({
      ...mcq(
        `Parmi ces quatre valeurs françaises du panel, laquelle a la plus grande capitalisation ? (Collecte du ${collection}, heure de Paris.)`,
        france.map((company) => company.name),
        france.map((company) => `${company.name} vaut environ ${fmtCap(company.market_cap_usd)}.`).join(" "),
        data.source,
      ),
      kind: "conjunctural",
    });
  }
  return questions;
}

export function capitalisationCulture(data: MarketCaps | null, now: number): ModuleExercise[] {
  return [shuffle(FRENCH_PAIRS)[0], ...recentQuestions(data, now), ...shuffle(MARKET_CULTURE)];
}
