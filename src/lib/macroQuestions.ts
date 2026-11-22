import type { Question } from "@/lib/quiz";
import { isFresh, type Indicator, type MacroData } from "@/lib/macro";

// Questions générées à partir des indicateurs du jour. Une question n'existe que si sa donnée
// est assez récente : sinon elle disparaît toute seule.

const META: Record<string, { prompt: string; tol: number; diff: string }> = {
  ecb_deposit_rate: { prompt: "Quel est le taux de la facilité de dépôt de la BCE ? (en %)", tol: 6, diff: "intermediate" },
  fed_target_upper: { prompt: "Quelle est la borne haute de la fourchette cible des fed funds de la Fed ? (en %)", tol: 6, diff: "intermediate" },
  us_cpi_yoy: { prompt: "Quelle est l’inflation (IPC) aux États-Unis sur 12 mois ? (en %)", tol: 12, diff: "intermediate" },
  ez_hicp_yoy: { prompt: "Quelle est l’inflation (IPCH) en zone euro sur 12 mois ? (en %)", tol: 12, diff: "intermediate" },
  us_unrate: { prompt: "Quel est le taux de chômage aux États-Unis ? (en %)", tol: 8, diff: "beginner" },
  us_10y: { prompt: "Quel est le rendement du Treasury américain à 10 ans ? (en %)", tol: 6, diff: "intermediate" },
  eurusd: { prompt: "Quel est le cours EUR/USD ?", tol: 1.5, diff: "beginner" },
  brent: { prompt: "Quel est le prix du Brent, en dollars par baril ?", tol: 6, diff: "beginner" },
  wti: { prompt: "Quel est le prix du WTI, en dollars par baril ?", tol: 6, diff: "beginner" },
  gold: { prompt: "Quel est le prix de l’once d’or, en dollars ?", tol: 4, diff: "beginner" },
};

function dayFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function base(key: string, ind: Indicator, diff: string, prompt: string, explanation: string) {
  return {
    id: `macro:${key}:${ind.ref_date}`,
    category_id: key.includes("rate") || key === "fed_target_upper" || key === "us_10y" ? "monetary-policy" : key.includes("cpi") || key.includes("hicp") || key === "us_unrate" ? "macroeconomics" : key === "eurusd" ? "fx" : "commodities",
    difficulty: diff,
    prompt,
    explanation,
    wrong_explanations: null,
    source: ind.source,
    kind: "conjunctural",
    reference_date: ind.ref_date,
  };
}

export function buildMacroQuestions(data: MacroData, nowMs: number): Question[] {
  const out: Question[] = [];
  const get = (k: string): Indicator | null => {
    const i = data.indicators[k];
    return i && isFresh(i, nowMs) && Number.isFinite(i.value) ? i : null;
  };

  for (const [key, meta] of Object.entries(META)) {
    const ind = get(key);
    if (!ind) continue;
    const unit = ind.unit === "%" ? "%" : ind.unit;
    out.push({
      ...base(key, ind, meta.diff, meta.prompt, `${ind.label} : ${ind.value.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} ${ind.unit} (observation du ${dayFr(ind.ref_date)}).`),
      type: "numeric",
      options: unit ? { unit } : null,
      correct: ind.value,
      tolerance_pct: meta.tol,
    });
  }

  const tfq = (id: string, ind: Indicator, prompt: string, answer: boolean, explanation: string) => {
    out.push({ ...base(id, ind, "beginner", prompt, explanation), type: "true_false", options: null, correct: answer, tolerance_pct: null });
  };

  const hicp = get("ez_hicp_yoy");
  if (hicp && Math.abs(hicp.value - 2) > 0.05) {
    tfq("tf_hicp", hicp, "Vrai ou faux : l’inflation en zone euro est actuellement supérieure à la cible de 2 % de la BCE.", hicp.value > 2,
      `Inflation IPCH sur 12 mois : ${hicp.value.toLocaleString("fr-FR")} % (${dayFr(hicp.ref_date)}), pour une cible de 2 %.`);
  }
  const cpi = get("us_cpi_yoy");
  if (cpi && Math.abs(cpi.value - 2) > 0.05) {
    tfq("tf_cpi", cpi, "Vrai ou faux : l’inflation (IPC) américaine sur 12 mois est actuellement supérieure à 2 %.", cpi.value > 2,
      `Inflation IPC sur 12 mois : ${cpi.value.toLocaleString("fr-FR")} % (${dayFr(cpi.ref_date)}).`);
  }
  const fed = get("fed_target_upper");
  const ecb = get("ecb_deposit_rate");
  if (fed && ecb && Math.abs(fed.value - ecb.value) > 0.05) {
    tfq("tf_fed_ecb", fed, "Vrai ou faux : la borne haute de la Fed est actuellement plus élevée que le taux de dépôt de la BCE.", fed.value > ecb.value,
      `Fed (borne haute) : ${fed.value.toLocaleString("fr-FR")} % ; BCE (facilité de dépôt) : ${ecb.value.toLocaleString("fr-FR")} %.`);
  }
  const brent = get("brent");
  const wti = get("wti");
  if (brent && wti && Math.abs(brent.value - wti.value) > 0.05) {
    tfq("tf_brent_wti", brent, "Vrai ou faux : le Brent cote actuellement plus cher que le WTI.", brent.value > wti.value,
      `Brent : ${brent.value.toLocaleString("fr-FR")} $ ; WTI : ${wti.value.toLocaleString("fr-FR")} $ (dernières observations disponibles).`);
  }
  return out;
}
