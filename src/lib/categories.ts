// Catégories de questions, avec leur nom affiché. Utilisé par l'entraînement libre et le mode invité.
export const CATS: [string, string][] = [
  ["mental-math", "Calcul mental"],
  ["market-caps", "Capitalisations"],
  ["financial-markets", "Marchés financiers"],
  ["central-banks", "Banques centrales"],
  ["monetary-policy", "Politique monétaire"],
  ["macroeconomics", "Macroéconomie"],
  ["geopolitics", "Géopolitique"],
  ["fx", "Change"],
  ["commodities", "Matières premières"],
  ["macro-guesstimates", "Ordres de grandeur"],
];

export const CAT_NAME: Record<string, string> = Object.fromEntries(CATS);
