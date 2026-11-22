// Parcours : 4 niveaux, 22 modules à valider dans l'ordre.

export type LevelId = "beginner" | "intermediate" | "advanced" | "expert";

export const LEVELS: { id: LevelId; name: string; tagline: string }[] = [
  { id: "beginner", name: "Débutant", tagline: "Les bases : calcul, vocabulaire, grands mécanismes." },
  { id: "intermediate", name: "Intermédiaire", tagline: "Taux, obligations, politique monétaire, change." },
  { id: "advanced", name: "Avancé", tagline: "Calculs plus durs, ordres de grandeur, cas d’entretien." },
  { id: "expert", name: "Expert", tagline: "Dérivés, courbes, mises en situation." },
];

export type Module = {
  id: string; // d1, i3, a2, e5…
  level: LevelId;
  title: string;
  goal: string;
  categories: string[]; // catégories de questions utilisées
  chapter?: string; // fiche de cours complète
  points: string[]; // cours court : l'essentiel en quelques lignes
  ready: boolean; // false = pas encore assez de questions
};

export const MODULES: Module[] = [
  // ---------------------------------------------------------------- DÉBUTANT
  {
    id: "d1", level: "beginner", title: "Pourcentages et points de base",
    goal: "Calculer vite : pourcentages, variations, bps.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "1 point de base (pb) = 0,01 %. 100 pb = 1 %.",
      "Variation en % = (nouveau − ancien) / ancien. Après une baisse de 20 %, il faut +25 % pour revenir au départ.",
      "Pour un pourcentage, décompose en 10 %, 5 % et 1 %. Exemple : 7 % de 900 = 63.",
    ],
  },
  {
    id: "d2", level: "beginner", title: "Capitalisations et indices",
    goal: "Comprendre la taille des entreprises et les grands indices.",
    categories: ["market-caps"], chapter: "capitalisations", ready: true,
    points: [
      "Capitalisation = cours de l’action × nombre d’actions : la valeur de marché des fonds propres.",
      "Valeur d’entreprise (EV) = capitalisation + dette nette.",
      "Poids dans un indice = capitalisation de la société / capitalisation totale de l’indice.",
    ],
  },
  {
    id: "d3", level: "beginner", title: "Marchés financiers : les bases",
    goal: "Actions, obligations, bid/ask, dividendes.",
    categories: ["financial-markets"], chapter: "actions-et-indices", ready: true,
    points: [
      "Une action est une part de propriété d’une entreprise ; une obligation est un prêt qui verse des coupons.",
      "Le prix d’une obligation et son rendement évoluent en sens inverse.",
      "Bid : le prix auquel on peut vendre. Ask : le prix auquel on peut acheter. L’écart est le spread.",
    ],
  },
  {
    id: "d4", level: "beginner", title: "Banques centrales : les bases",
    goal: "Rôle, taux directeur, QE et QT.",
    categories: ["central-banks"], chapter: "banques-centrales", ready: true,
    points: [
      "La BCE fixe trois taux directeurs et vise une inflation de 2 % à moyen terme.",
      "Les taux peuvent être relevés face à une inflation persistante ou abaissés pour soutenir l’activité, selon les perspectives.",
      "QE : achats de titres qui injectent de la liquidité. QT : l’inverse, le bilan se réduit.",
    ],
  },
  {
    id: "d5", level: "beginner", title: "Inflation et croissance",
    goal: "Inflation, taux réel, PIB.",
    categories: ["macroeconomics", "monetary-policy"], chapter: "inflation", ready: true,
    points: [
      "Inflation : hausse générale des prix. Désinflation : elle ralentit. Déflation : les prix baissent.",
      "Taux réel ≈ taux nominal − inflation.",
      "Le PIB mesure la production finale sur un territoire. Croissance réelle ≈ croissance nominale − variation du déflateur du PIB.",
    ],
  },
  {
    id: "d6", level: "beginner", title: "Change et matières premières",
    goal: "Lire une paire de devises, repères pétrole et or.",
    categories: ["fx", "commodities"], chapter: "change", ready: true,
    points: [
      "EUR/USD = nombre de dollars pour 1 euro. S’il monte, l’euro s’apprécie.",
      "Taux croisé : EUR/JPY = EUR/USD × USD/JPY.",
      "Le pétrole se cote en dollars par baril (Brent et WTI), l’or en dollars par once.",
    ],
  },
  // ----------------------------------------------------------- INTERMÉDIAIRE
  {
    id: "i1", level: "intermediate", title: "Variations, taux et intérêts composés",
    goal: "Calculs de taux et de rendements, sans calculatrice.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "Intérêts composés : capital × (1 + r)^n. Règle de 72 : années pour doubler ≈ 72 / taux en %.",
      "Variations successives : on multiplie les coefficients. +10 % puis −10 % donne −1 %, pas 0.",
      "Un taux qui monte de 35 pb augmente de 0,35 point de pourcentage.",
    ],
  },
  {
    id: "i2", level: "intermediate", title: "Grandes valeurs mondiales",
    goal: "Les grands indices, les grandes entreprises, leur pays.",
    categories: ["market-caps"], chapter: "capitalisations", ready: true,
    points: [
      "Les classements bougent tous les jours : retiens les ordres de grandeur et le pays du siège.",
      "Indices : S&P 500 (États-Unis), CAC 40 (France), DAX (Allemagne), FTSE 100 (Royaume-Uni), Nikkei 225 (Japon).",
      "La capitalisation ne tient pas compte de la dette : ce n’est ni le chiffre d’affaires ni la valeur d’entreprise.",
    ],
  },
  {
    id: "i3", level: "intermediate", title: "Taux et obligations",
    goal: "Prix, rendement, duration, courbe des taux.",
    categories: ["financial-markets"], chapter: "obligations", ready: true,
    points: [
      "La duration modifiée mesure la sensibilité relative du prix à une variation du rendement. La duration de Macaulay mesure un délai moyen pondéré.",
      "Rendement actuariel : le taux qui égalise le prix et la valeur actuelle des flux futurs.",
      "Courbe inversée : les taux courts dépassent les taux longs, historiquement un signal de ralentissement.",
    ],
  },
  {
    id: "i4", level: "intermediate", title: "Politique monétaire",
    goal: "Fed, BCE, règle de Taylor, transmission aux marchés.",
    categories: ["central-banks", "monetary-policy"], chapter: "politique-monetaire", ready: true,
    points: [
      "Règle de Taylor : taux « recommandé » selon l’écart d’inflation à la cible et l’écart de production.",
      "Transmission : le taux directeur agit sur le crédit, les taux de marché, le change et le prix des actifs.",
      "La Fed a un double mandat (inflation et emploi) ; la BCE vise d’abord la stabilité des prix.",
    ],
  },
  {
    id: "i5", level: "intermediate", title: "Macroéconomie",
    goal: "Maastricht, chômage, indices d’inflation.",
    categories: ["macroeconomics"], chapter: "macroeconomie", ready: true,
    points: [
      "Valeurs de référence de Maastricht : déficit de 3 % du PIB et dette de 60 % du PIB.",
      "La courbe de Phillips relie, à court terme, l’inflation et le chômage.",
      "L’IPCH est l’indice d’inflation harmonisé utilisé en Europe, base de la cible de la BCE.",
    ],
  },
  {
    id: "i6", level: "intermediate", title: "Change et matières premières",
    goal: "Taux de change, pétrole, inflation importée.",
    categories: ["fx", "commodities"], chapter: "matieres-premieres", ready: true,
    points: [
      "Une banque centrale qui relève ses taux tend à soutenir sa devise.",
      "Une hausse du pétrole nourrit l’inflation (énergie, transport, coûts de production).",
      "Brent : référence issue de la mer du Nord. WTI : livré à Cushing, dans l’Oklahoma.",
    ],
  },
  // ------------------------------------------------------------------ AVANCÉ
  {
    id: "a1", level: "advanced", title: "Calcul mental avancé",
    goal: "Calculs plus durs, ordres de grandeur, vérifications.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "Utilise les identités remarquables : 99 × 101 = 100² − 1 = 9 999.",
      "Règle de 72 : ln(2) ≈ 0,69, donc le temps pour doubler ≈ 72 / taux en %.",
      "Vérifie toujours un résultat par un calcul approché : l’ordre de grandeur doit être cohérent.",
    ],
  },
  {
    id: "a2", level: "advanced", title: "Taux, banques centrales et change",
    goal: "Parité des taux, régimes de change, resserrement monétaire.",
    categories: ["central-banks", "monetary-policy", "fx"], chapter: "politique-monetaire", ready: true,
    points: [
      "Parité couverte des taux d’intérêt : le taux de change à terme reflète l’écart de taux entre deux devises.",
      "Régimes de change : flottant, fixe ou ancré. Une banque centrale peut intervenir pour défendre sa devise.",
      "Un resserrement monétaire pèse sur la croissance mais ancre les anticipations d’inflation.",
    ],
  },
  {
    id: "a3", level: "advanced", title: "Macro, ordres de grandeur et marchés",
    goal: "Guesstimates : décomposer et arrondir.",
    categories: ["macroeconomics", "macro-guesstimates", "financial-markets", "commodities"], chapter: "guesstimates", ready: true,
    points: [
      "Guesstimate : décompose le problème (population × part concernée × montant) et arrondis chaque terme.",
      "Repères : environ 8 milliards d’habitants ; PIB mondial de l’ordre de 100 000 Md$.",
      "Une croissance de 2 % par an double l’économie en environ 36 ans (72 / 2).",
    ],
  },
  {
    id: "a4", level: "advanced", title: "Obligations : duration et convexité",
    goal: "Sensibilité du prix aux taux.", categories: ["financial-markets"], chapter: "obligations", ready: true,
    points: [
      "Variation relative du prix ≈ −duration modifiée × variation du rendement, en décimal.",
      "Pour une convexité C, ajoute ½ × C × variation du rendement au carré à cette approximation.",
      "Le DV01 exprime en monnaie la perte approximative causée par une hausse de rendement de 1 pb.",
    ],
  },
  {
    id: "a5", level: "advanced", title: "Dérivés et options",
    goal: "Calls, puts, payoffs et règlement à l’échéance.", categories: ["financial-markets"], chapter: "derives", ready: true,
    points: [
      "À l’échéance, un call vaut max(S − K, 0) et un put vaut max(K − S, 0).",
      "Le résultat de l’acheteur retranche la prime payée. Distingue toujours valeur de l’option et résultat net.",
      "Un straddle acheté combine un call et un put de même strike et échéance.",
    ],
  },
  // ------------------------------------------------------------------ EXPERT
  {
    id: "e1", level: "expert", title: "Calcul mental expert", goal: "Vitesse et fiabilité sous pression.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: ["Décompose le problème en coefficients ou en facteurs simples. Vérifie le signe, l’unité et l’ordre de grandeur avant de valider."],
  },
  {
    id: "e2", level: "expert", title: "Obligations et courbe des taux", goal: "Convexité, taux à terme et pentes.",
    categories: ["financial-markets"], chapter: "obligations", ready: true,
    points: [
      "La pente 2–10 ans est le rendement à 10 ans moins celui à 2 ans, souvent en points de base.",
      "En capitalisation annuelle, (1 + z₂)² = (1 + z₁) × (1 + f₁,₂), avec f₁,₂ le taux à terme d’un an dans un an.",
      "Une variation de pente change le risque selon les échéances. Une duration globale suppose un mouvement parallèle du rendement.",
    ],
  },
  {
    id: "e3", level: "expert", title: "Dérivés, grecs et volatilité", goal: "Delta, gamma et vega.",
    categories: ["financial-markets"], chapter: "derives", ready: true,
    points: [
      "Le delta approxime la variation de valeur pour une unité de variation du sous-jacent. Le gamma approxime la variation du delta.",
      "Le vega s’exprime souvent en monnaie par point de volatilité. Vérifie la convention utilisée avant le calcul.",
      "Une couverture delta est locale. Le gamma fait évoluer l’exposition si le sous-jacent bouge.",
    ],
  },
  {
    id: "e4", level: "expert", title: "Macro et politique monétaire : cas", goal: "Mesurer une surprise, un taux réel ou une réponse de politique monétaire.",
    categories: ["macroeconomics", "monetary-policy"], chapter: "politique-monetaire", ready: true,
    points: [
      "Une surprise est l’écart entre la publication et le consensus. Distingue-la de la variation par rapport au mois précédent.",
      "Le taux réel ex ante se calcule avec l’inflation anticipée sur le même horizon.",
      "Une règle de Taylor est un repère conditionnel. Le résultat dépend des coefficients, du taux neutre et de l’écart de production.",
    ],
  },
  {
    id: "e5", level: "expert", title: "Mises en situation d’entretien", goal: "Résoudre des cas chiffrés de risque et justifier les hypothèses.",
    categories: ["macro-guesstimates"], chapter: "guesstimates", ready: true,
    points: [
      "Pour un choc de marché donné, calcule la contribution de chaque position, puis agrège dans la même monnaie.",
      "Un portefeuille se juge aussi par ses expositions et sa concentration. Le levier brut rapporte la somme des expositions absolues aux fonds propres.",
      "Expose la convention de change, les hypothèses et l’ordre de grandeur dans ta réponse.",
    ],
  },
];

export const GUEST_MODULE = "d1"; // le seul module jouable sans compte

export type Progress = Record<string, { passed: boolean; best_pct: number; attempts: number }>;
export type Status = "placed" | "validated" | "open" | "locked" | "soon";

export function moduleById(id: string | null): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

export function levelOfModule(m: Module) {
  return LEVELS.find((l) => l.id === m.level)!;
}

export function placementDone(placement: string | null): LevelId[] {
  if (placement === "avance") return ["beginner", "intermediate"];
  if (placement === "intermediaire") return ["beginner"];
  return [];
}

// Statut de chaque module : on valide dans l'ordre, le suivant s'ouvre quand le précédent est validé.
export function computeStatuses(progress: Progress, placement: string | null): Record<string, Status> {
  const placed = placementDone(placement);
  const out: Record<string, Status> = {};
  let prevOk = true;
  for (const m of MODULES) {
    if (placed.includes(m.level)) {
      out[m.id] = "placed";
      continue;
    }
    if (!m.ready) {
      out[m.id] = "soon";
      prevOk = false;
      continue;
    }
    if (progress[m.id]?.passed) {
      out[m.id] = "validated";
      continue;
    }
    out[m.id] = prevOk ? "open" : "locked";
    prevOk = false;
  }
  return out;
}

export function nextOpenModule(statuses: Record<string, Status>): Module | undefined {
  return MODULES.find((m) => statuses[m.id] === "open");
}

// Module qui précède dans l'ordre (pour dire « valide d'abord … »).
export function previousModule(id: string): Module | undefined {
  const i = MODULES.findIndex((m) => m.id === id);
  return i > 0 ? MODULES[i - 1] : undefined;
}
