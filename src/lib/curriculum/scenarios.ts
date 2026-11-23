import { fmt, NUMERIC_TOLERANCE } from "@/lib/quiz";
import { block } from "@/lib/curriculum/question";

type Scenario = (n: number) => ReturnType<typeof numeric>;

function numeric(prompt: string, value: number, unit: string, method: string, tolerance = 0) {
  const correct = Number(value.toFixed(2));
  return { prompt, correct, type: "numeric", options: { unit }, tolerance_pct: tolerance, explanation: `${method} Résultat : ${fmt(correct)} ${unit}.` };
}

const weight: Scenario = (n) => numeric(
  `Une société vaut ${10 * n} Md$ dans un indice pondéré par capitalisation de 1 000 Md$, sans ajustement du flottant. Estime son poids en %.`,
  n, "%", "Divise la capitalisation de la société par celle de l’indice, puis multiplie par 100.",
  NUMERIC_TOLERANCE.weight,
);
const enterprise: Scenario = (n) => numeric(
  `Une entreprise vaut ${20 + n} Md$ en Bourse et a 4 Md$ de dette nette. Quelle est son EV simplifiée en Md$ ?`,
  24 + n, "Md$", "Dans ce cas simple, additionne valeur des fonds propres et dette nette.",
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
  `Une obligation a une duration modifiée de 5 et une convexité de ${20 * n}. Hausse de rendement de 100 pb. Calcule la variation du prix au second ordre, en %, au dixième de point près.`,
  -5 + 0.1 * n, "%", "Additionne −5 × 0,01 et ½ × convexité × 0,01², puis multiplie par 100.",
);
const forward: Scenario = (n) => numeric(
  `Le taux zéro 1 an est 2 % et le taux zéro 2 ans est ${n + 2} %, capitalisation annuelle. Quel est le taux à terme d’un an dans un an en % ? Arrondis à 0,01 point.`,
  ((1 + (n + 2) / 100) ** 2 / 1.02 - 1) * 100, "%", "Divise le facteur de capitalisation à deux ans par le facteur à un an, puis retranche 1.",
);
const taylor: Scenario = (n) => numeric(
  `Règle simplifiée : i = r* + π + 0,5(π − 2) + 0,5y. Si r* = 1 %, π = 4 % et l’écart de production y = ${n - 4} %, quel taux i en % obtiens-tu ?`,
  6 + 0.5 * (n - 4), "%", "Insère les hypothèses. La contribution de l’écart d’inflation est de 1 point.",
);
const surprise: Scenario = (n) => numeric(
  `La variation annuelle de l’IPC est publiée à ${fmt(3 + 0.1 * n)} % pour un consensus de 3,5 %. Quelle surprise en points de base, publication moins consensus ?`,
  10 * n - 50, "pb", "Calcule publication moins consensus, puis multiplie l’écart en points de pourcentage par 100.",
);
const estimate: Scenario = (n) => numeric(
  `Une économie compte ${n + 2} millions de ménages. Ils dépensent en moyenne 500 € par mois sur un poste. Estime la dépense annuelle en Md€.`,
  6 * (n + 2), "Md€", "Multiplie par 500 € et douze mois, puis convertis les millions d’euros en milliards.",
  NUMERIC_TOLERANCE.orderOfMagnitude,
);
const call: Scenario = (n) => numeric(
  `Tu achètes un call de strike 100 € et paies 5 € de prime. Le sous-jacent finit à ${97 + 2 * n} €. Quel est le résultat net en euros par call sur une action ?`,
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

const cases: [string, string, string, Scenario, number][] = [
  ["i2", "market-caps", "poids-indice", weight, 4],
  ["i2", "market-caps", "valeur-entreprise", enterprise, 4],
  ["i3", "financial-markets", "prix-zero-coupon", zero, 3],
  ["i3", "financial-markets", "pente-taux", slope, 3],
  ["i5", "macroeconomics", "pib-reel", realGrowth, 3],
  ["i5", "macroeconomics", "dette-sur-pib", debt, 3],
  ["a3", "macro-guesstimates", "depense-annuelle", estimate, 6],
  ["a4", "financial-markets", "duration", dur, 3],
  ["a4", "financial-markets", "dv01", dv01, 3],
  ["a4", "financial-markets", "convexite", convexity, 3],
  ["a5", "financial-markets", "call", call, 3],
  ["a5", "financial-markets", "put", put, 3],
  ["a5", "financial-markets", "straddle", straddle, 3],
  ["e2", "financial-markets", "taux-terme", forward, 4],
  ["e2", "financial-markets", "convexite", convexity, 4],
  ["e3", "financial-markets", "delta-gamma", gamma, 4],
  ["e3", "financial-markets", "vega", vega, 4],
  ["e4", "monetary-policy", "taylor", taylor, 3],
  ["e4", "macroeconomics", "surprise", surprise, 3],
  ["e5", "macro-guesstimates", "levier", leverage, 3],
  ["e5", "macro-guesstimates", "pnl", stress, 3],
];

export const scenarioQuestions = cases.flatMap(([module, category, slug, scenario, count]) =>
  block(module, category, Array.from({ length: count }, (_, i) => ({
    ...scenario(module === "e2" && slug === "convexite" ? i + 4 : i + 1),
    id: `${slug}-${i + 1}`,
  }))),
);
