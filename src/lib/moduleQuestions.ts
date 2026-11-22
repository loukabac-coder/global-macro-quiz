import { mentalQuestion, type Topic } from "@/lib/mental";
import type { Module } from "@/lib/modules";
import { fmt, NUMERIC_TOLERANCE, shuffle, type Question } from "@/lib/quiz";

type Exercise = Pick<Question, "prompt" | "type" | "correct" | "options" | "explanation" | "tolerance_pct">;
type Scenario = (n: number) => Exercise;

function numeric(prompt: string, value: number, unit: string, method: string, tolerance = 0): Exercise {
  const correct = Number(value.toFixed(2));
  return { prompt, correct, type: "numeric", options: { unit }, tolerance_pct: tolerance, explanation: `${method} Résultat : ${fmt(correct)} ${unit}.` };
}

const cap: Scenario = (n) => numeric(
  `Une action cote ${10 + n} $ et il y a 2 milliards d’actions. Quelle est la capitalisation en Md$ ?`,
  (10 + n) * 2, "Md$", "Multiplie le cours par le nombre d’actions en milliards.",
);
const weight: Scenario = (n) => numeric(
  `Une société vaut ${10 * n} Md$ dans un indice pondéré par capitalisation de 1 000 Md$, sans ajustement du flottant. Estime son poids en %.`,
  n, "%", "Divise la capitalisation de la société par celle de l’indice, puis multiplie par 100.",
  NUMERIC_TOLERANCE.weight,
);
const enterprise: Scenario = (n) => numeric(
  `Une entreprise vaut ${20 + n} Md$ en Bourse et a 4 Md$ de dette nette. Quelle est son EV simplifiée en Md$ ?`,
  24 + n, "Md$", "Dans ce cas simple, additionne valeur des fonds propres et dette nette.",
);
const spread: Scenario = (n) => numeric(
  `Une action affiche un bid à 100 € et un ask à ${101 + n} €. Quel est le spread en euros ?`,
  n + 1, "€", "Soustrais le bid à l’ask.",
);
const dividend: Scenario = (n) => numeric(
  `Un dividende annuel de ${n} € est versé par action. Le cours vaut 100 €. Quel est le rendement brut du dividende en % ?`,
  n, "%", "Divise le dividende annuel par le cours, puis multiplie par 100.",
);
const bp: Scenario = (n) => numeric(
  `Un taux de 2 % augmente de ${5 * n} points de base. Quel est le nouveau taux en % ?`,
  2 + 0.05 * n, "%", "Divise les points de base par 100 pour obtenir des points de pourcentage.",
);
const corridor: Scenario = (n) => numeric(
  `Exemple fictif : la facilité de dépôt de la BCE vaut 2 % et le taux de prêt marginal ${fmt(2.2 + 0.05 * n)} %. Quel est l’écart en points de base ?`,
  20 + 5 * n, "pb", "Soustrais le taux de dépôt au taux de prêt marginal et multiplie l’écart en points de pourcentage par 100.",
);
const realRate: Scenario = (n) => numeric(
  `Pour un emprunt d’un an, le taux nominal est ${n + 3} % et l’inflation attendue 2 %. Quel est le taux réel ex ante approximatif en % ?`,
  n + 1, "%", "L’approximation de Fisher soustrait l’inflation anticipée du taux nominal.",
  NUMERIC_TOLERANCE.estimate,
);
const realGrowth: Scenario = (n) => numeric(
  `Le PIB nominal augmente de ${n + 2} % et son déflateur de 2 %. Donne la croissance réelle en % par soustraction approchée.`,
  n, "%", "Soustrais la hausse du déflateur du PIB à la croissance nominale.",
  NUMERIC_TOLERANCE.estimate,
);
const debt: Scenario = (n) => numeric(
  `La dette publique brute est de ${500 + 100 * n} Md€ et le PIB nominal de 2 000 Md€. Quel est le ratio de dette publique en % ?`,
  25 + 5 * n, "%", "Divise la dette brute par le PIB nominal, puis multiplie par 100.",
  NUMERIC_TOLERANCE.estimate,
);
const fx: Scenario = (n) => numeric(
  `Une entreprise doit régler ${(10 + n) * 120} USD. EUR/USD = 1,20. Quel est le montant en euros, hors frais ?`,
  (10 + n) * 100, "€", "Divise le montant en dollars par le nombre de dollars par euro.",
);
const oil: Scenario = (n) => numeric(
  `Le pétrole cote ${60 + 6 * n} USD par baril. EUR/USD = 1,20. Quel est le prix en euros par baril, hors frais ?`,
  50 + 5 * n, "€/baril", "Divise le prix en dollars par le nombre de dollars par euro.",
);
const cross: Scenario = (n) => numeric(
  `EUR/USD = 1,10 et USD/JPY = ${140 + 10 * n}. Quel est le taux EUR/JPY en yens par euro ?`,
  (140 + 10 * n) * 1.1, "JPY/EUR", "Multiplie le nombre de dollars par euro par le nombre de yens par dollar.",
);
const zero: Scenario = (n) => numeric(
  `Un zéro-coupon rembourse 100 € dans un an et son rendement annuel est ${n + 1} %. Quel est son prix en euros ? Arrondis au centime.`,
  100 / (1 + (n + 1) / 100), "€", "Actualise 100 € en divisant par un plus le rendement annuel exprimé en décimal.",
);
const slope: Scenario = (n) => numeric(
  `Le rendement à 2 ans est de ${fmt(3 + 0.25 * n)} %, celui à 10 ans de 4 %. Quelle est la pente 2–10 ans en points de base ?`,
  100 - 25 * n, "pb", "Soustrais le taux 2 ans au taux 10 ans, puis convertis en points de base.",
);
const dur: Scenario = (n) => numeric(
  `À duration modifiée ${n + 2}, quel changement relatif de prix en % approxime-t-on pour une baisse de rendement de 25 pb, hors convexité ?`,
  (n + 2) * 0.25, "%", "Applique −duration modifiée × variation du rendement. La baisse du rendement donne une hausse de prix.",
  NUMERIC_TOLERANCE.estimate,
);
const dv01: Scenario = (n) => numeric(
  `Une obligation vaut ${n + 2} millions d’euros et sa duration modifiée vaut 4. Estime son DV01 en euros, en valeur absolue.`,
  (n + 2) * 400, "€", "Multiplie la valeur de marché, la duration modifiée et 0,0001.",
  NUMERIC_TOLERANCE.estimate,
);
const convexity: Scenario = (n) => numeric(
  `Une obligation a une duration modifiée de 5 et une convexité de ${20 * n}. Rendement +100 pb. Calcule la variation du prix au second ordre, en %, au dixième de point près.`,
  -5 + 0.1 * n, "%", "Additionne −5 × 0,01 et ½ × convexité × 0,01², puis multiplie par 100.",
);
const forward: Scenario = (n) => numeric(
  `Le taux zéro 1 an est 2 % et le taux zéro 2 ans est ${n + 2} %, capitalisation annuelle. Quel est le taux à terme d’un an dans un an en % ? Arrondis à 0,01 point.`,
  ((1 + (n + 2) / 100) ** 2 / 1.02 - 1) * 100, "%", "Divise le facteur de capitalisation à deux ans par le facteur à un an, puis retranche 1.",
);
const coveredFx: Scenario = (n) => numeric(
  `Sans arbitrage ni coûts, EUR/USD spot = 1,20, taux USD 1 an = ${n + 1} %, taux EUR 1 an = 2 %. Quel est le cours à terme 1 an ? Arrondis à deux décimales.`,
  1.2 * (1 + (n + 1) / 100) / 1.02, "USD/EUR", "Multiplie le spot par le rapport (1 + taux USD) / (1 + taux EUR).",
);
const taylor: Scenario = (n) => numeric(
  `Règle simplifiée : i = r* + π + 0,5(π − 2) + 0,5y. Si r* = 1 %, π = 4 % et l’écart de production y = ${n - 4} %, quel taux i en % obtiens-tu ?`,
  6 + 0.5 * (n - 4), "%", "Insère les hypothèses. La contribution de l’écart d’inflation est de 1 point.",
);
const surprise: Scenario = (n) => numeric(
  `Une inflation est publiée à ${fmt(3 + 0.1 * n)} % pour un consensus de 3,5 %. De combien de points de base la publication dépasse-t-elle le consensus ? Donne un signe.`,
  10 * n - 50, "pb", "Calcule publication moins consensus, puis multiplie l’écart en points de pourcentage par 100.",
);
const estimate: Scenario = (n) => numeric(
  `Une économie compte ${n + 2} millions de ménages. Ils dépensent en moyenne 500 € par mois sur un poste. Estime la dépense annuelle en Md€.`,
  6 * (n + 2), "Md€", "Multiplie par 500 € et douze mois, puis convertis les millions d’euros en milliards.",
  NUMERIC_TOLERANCE.orderOfMagnitude,
);
const call: Scenario = (n) => numeric(
  `Tu achètes un call de strike 100 € et paies 5 € de prime. Le sous-jacent finit à ${97 + 2 * n} €. Quel est le résultat net en euros par option sur une action ?`,
  Math.max(2 * n - 3, 0) - 5, "€", "Calcule max(cours − strike, 0) et retranche la prime.",
);
const put: Scenario = (n) => numeric(
  `Un put de strike 100 € est détenu jusqu’à l’échéance. Le cours final vaut ${103 - 2 * n} €. Quel est le payoff par action en euros, hors prime ?`,
  Math.max(2 * n - 3, 0), "€", "Le payoff du put est max(strike − cours, 0).",
);
const straddle: Scenario = (n) => numeric(
  `Un straddle acheté de strike 100 € coûte 8 € au total. À l’échéance le cours est ${90 + 3 * n} €. Quel est le résultat net en euros par straddle sur une action ?`,
  Math.abs(3 * n - 10) - 8, "€", "Prends la distance absolue au strike et retranche les primes.",
);
const gamma: Scenario = (n) => numeric(
  `Une option a un delta de 0,40 et un gamma de 0,02 par euro. Pour une hausse du sous-jacent de ${n} €, quel delta approxime-t-on avec un gamma constant ?`,
  0.4 + 0.02 * n, "", "Ajoute au delta initial le gamma multiplié par le mouvement du sous-jacent.",
  NUMERIC_TOLERANCE.rounding,
);
const vega: Scenario = (n) => numeric(
  `Le vega d’une option est de 0,50 € par point de volatilité. La volatilité implicite baisse de ${n} points. Quelle variation de valeur en euros approxime-t-on, toutes choses égales par ailleurs ?`,
  -0.5 * n, "€", "Multiplie le vega par la baisse signée du nombre de points de volatilité.",
  NUMERIC_TOLERANCE.estimate,
);
const leverage: Scenario = (n) => numeric(
  `Un fonds de 10 M€ détient ${10 + 2 * n} M€ de positions longues et 5 M€ de positions courtes en valeur absolue. Quel est le levier brut en multiples ?`,
  (15 + 2 * n) / 10, "×", "Additionne les valeurs absolues des deux expositions et divise par les fonds propres.",
);
const stress: Scenario = (n) => numeric(
  `Un portefeuille détient une ligne longue de ${n + 4} M€ et une ligne courte de 4 M€ sur deux titres. Les deux titres baissent de 5 %. Quel est le P&L total du choc, en milliers d’euros, hors frais ?`,
  -50 * n, "k€", "La ligne longue perd 5 %, la courte gagne 5 % de sa valeur absolue. Additionne les contributions.",
);

const SCENARIOS: Record<string, Scenario[]> = {
  d2: [cap, weight, enterprise], d3: [spread, dividend, cap],
  d4: [bp, corridor], d5: [realRate, realGrowth, debt], d6: [fx, oil, cross],
  i2: [cap, weight, enterprise], i3: [zero, slope, dur], i4: [corridor, taylor, realRate],
  i5: [debt, realGrowth, surprise], i6: [fx, oil, cross],
  a2: [coveredFx, realRate, taylor], a3: [estimate, debt, stress],
  a4: [dur, dv01, convexity], a5: [call, put, straddle],
  e2: [forward, slope, convexity], e3: [gamma, vega, straddle],
  e4: [surprise, realRate, taylor], e5: [estimate, leverage, stress],
};

const MENTAL: Record<string, { level: number; topics: Topic[] }> = {
  d1: { level: 1, topics: ["pourcentages", "bps", "variations"] },
  i1: { level: 3, topics: ["variations", "interets", "bps"] },
  a1: { level: 4, topics: ["multiplications", "interets", "ratios", "ordres"] },
  e1: { level: 5, topics: ["pourcentages", "multiplications", "interets", "ratios"] },
};

export function moduleQuestions(module: Module, count: number): Question[] {
  const mental = MENTAL[module.id];
  const scenarios = SCENARIOS[module.id];
  const candidates = shuffle(
    mental
      ? Array.from({ length: 48 }, (_, i) => mentalQuestion(mental.level, Math.random, mental.topics[i % mental.topics.length]))
      : scenarios.flatMap((make) => Array.from({ length: 8 }, (_, i) => make(i + 1))),
  );
  const distinct = new Map(candidates.map((item) => [item.prompt, item]));
  return [...distinct.values()].slice(0, count).map((exercise, i) => ({
    wrong_explanations: null,
    source: null,
    kind: "structural",
    reference_date: null,
    ...exercise,
    id: `module:${module.id}:${i}`,
    category_id: module.categories[0],
    difficulty: module.level,
  }));
}
