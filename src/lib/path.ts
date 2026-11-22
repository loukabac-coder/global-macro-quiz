// Le parcours en 6 étapes, des bases au niveau entretien.

export type StatRow = { category_id: string; difficulty: string; answered: number; correct: number };

export type Step = {
  id: number;
  title: string;
  goal: string;
  chapters: string[]; // slugs de cours
  targets: { categories: string[]; levels: string[] };
  needed: number; // nombre de réponses à donner
  accuracy: number; // % de réussite visé
  play: string; // lien du bouton d'entraînement
  playLabel: string;
};

export const STEPS: Step[] = [
  {
    id: 1,
    title: "Les bases du calcul",
    goal: "Pourcentages, variations, produits rapides. Sans calculatrice.",
    chapters: ["calcul-mental"],
    targets: { categories: ["mental-math"], levels: ["beginner"] },
    needed: 25,
    accuracy: 70,
    play: "/calcul-mental?niveau=1",
    playLabel: "Calcul mental niveau 1",
  },
  {
    id: 2,
    title: "Culture marchés",
    goal: "Capitalisations, indices, actions, vocabulaire de base.",
    chapters: ["capitalisations", "actions-et-indices"],
    targets: { categories: ["market-caps", "financial-markets", "central-banks"], levels: ["beginner"] },
    needed: 25,
    accuracy: 70,
    play: "/quiz?categorie=market-caps,financial-markets,central-banks&niveau=beginner",
    playLabel: "Questions débutant",
  },
  {
    id: 3,
    title: "Macro et banques centrales",
    goal: "Inflation, croissance, mandats et outils des banques centrales.",
    chapters: ["banques-centrales", "inflation", "macroeconomie"],
    targets: { categories: ["central-banks", "macroeconomics", "monetary-policy"], levels: ["beginner", "intermediate"] },
    needed: 30,
    accuracy: 70,
    play: "/quiz?categorie=central-banks,macroeconomics,monetary-policy&niveau=beginner,intermediate",
    playLabel: "Macro et banques centrales",
  },
  {
    id: 4,
    title: "Taux, change, matières premières",
    goal: "Courbe des taux, parités de change, pétrole et or.",
    chapters: ["politique-monetaire", "change", "matieres-premieres"],
    targets: { categories: ["monetary-policy", "fx", "commodities"], levels: ["intermediate"] },
    needed: 30,
    accuracy: 70,
    play: "/quiz?categorie=monetary-policy,fx,commodities&niveau=intermediate",
    playLabel: "Taux, change, matières premières",
  },
  {
    id: 5,
    title: "Niveau entretien",
    goal: "Obligations, dérivés, ordres de grandeur, calculs plus durs.",
    chapters: ["obligations", "derives", "guesstimates"],
    targets: {
      categories: ["financial-markets", "macro-guesstimates", "market-caps", "fx", "monetary-policy"],
      levels: ["advanced"],
    },
    needed: 25,
    accuracy: 65,
    play: "/quiz?niveau=advanced",
    playLabel: "Questions avancées",
  },
  {
    id: 6,
    title: "Finance Games",
    goal: "Séries chronométrées, comme à l’oral : vitesse et fiabilité.",
    chapters: [],
    targets: { categories: ["mental-math"], levels: ["intermediate", "advanced", "expert"] },
    needed: 50,
    accuracy: 70,
    play: "/jeux",
    playLabel: "Lancer une série",
  },
];

export function stepProgress(step: Step, stats: StatRow[]) {
  let answered = 0;
  let correct = 0;
  for (const s of stats) {
    if (step.targets.categories.includes(s.category_id) && step.targets.levels.includes(s.difficulty)) {
      answered += s.answered;
      correct += s.correct;
    }
  }
  const acc = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const volumePct = Math.min(100, Math.round((answered / step.needed) * 100));
  const done = answered >= step.needed && acc >= step.accuracy;
  return { answered, correct, acc, volumePct, done };
}

export function startStepFromPlacement(level: string | null): number {
  if (level === "avance") return 5;
  if (level === "intermediaire") return 3;
  return 1;
}

// Étape recommandée : la première non terminée, mais pas avant celle du test de niveau.
export function currentStep(stats: StatRow[], placement: string | null): Step {
  const start = startStepFromPlacement(placement);
  for (const s of STEPS) {
    if (s.id < start) continue;
    if (!stepProgress(s, stats).done) return s;
  }
  return STEPS[STEPS.length - 1];
}
