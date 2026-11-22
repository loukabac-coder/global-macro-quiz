import type { Question } from "@/lib/quiz";
import { fmtValue, isVerifiedMacro, referenceLabel, type Indicator, type MacroData } from "@/lib/macro";

// Questions générées à partir des indicateurs du jour. Une question n'existe que si sa donnée
// est assez récente : sinon elle disparaît toute seule.

const META: Record<string, { prompt: string; tol: number; diff: string }> = {
  ecb_deposit_rate: { prompt: "Quel est le taux de la facilité de dépôt de la BCE, en % ?", tol: 0, diff: "intermediate" },
  fed_target_upper: { prompt: "Quelle est la borne haute de la fourchette cible des fed funds, en % ?", tol: 0, diff: "intermediate" },
  us_cpi_yoy: { prompt: "Quelle est la hausse annuelle de l’IPC-U aux États-Unis, en % ?", tol: 12, diff: "intermediate" },
  ez_hicp_yoy: { prompt: "Quelle est l’inflation IPCH en zone euro sur 12 mois, en % ?", tol: 12, diff: "intermediate" },
  us_unrate: { prompt: "Quel est le taux de chômage aux États-Unis ? (en %)", tol: 8, diff: "beginner" },
  us_10y: { prompt: "Quel est le rendement du Treasury américain à 10 ans ? (en %)", tol: 6, diff: "intermediate" },
  eurusd: { prompt: "Quel est le taux de référence BCE EUR/USD, en dollars par euro ?", tol: 1.5, diff: "beginner" },
  brent: { prompt: "Quel est le prix au comptant du Brent, en dollars par baril ?", tol: 6, diff: "beginner" },
  wti: { prompt: "Quel est le prix au comptant du WTI, en dollars par baril ?", tol: 6, diff: "beginner" },
  gold: { prompt: "Quel est le prix du contrat à terme sur l’or (GC=F), en dollars par once troy ?", tol: 4, diff: "beginner" },
};

function base(key: string, ind: Indicator, diff: string, prompt: string, explanation: string) {
  return {
    id: `macro:${key}:${ind.ref_date}`,
    category_id: key.includes("rate") || key === "fed_target_upper" || key === "us_10y" || key === "tf_fed_ecb" ? "monetary-policy" : key.includes("cpi") || key.includes("hicp") || key === "us_unrate" ? "macroeconomics" : key === "eurusd" ? "fx" : "commodities",
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
    return i && isVerifiedMacro(data, k, nowMs) ? i : null;
  };

  for (const [key, meta] of Object.entries(META)) {
    const ind = get(key);
    if (!ind) continue;
    const period = referenceLabel(key, ind);
    const convention = key === "us_cpi_yoy" ? (ind.source.includes("CPIAUCSL") ? " · désaisonnalisé" : " · non désaisonnalisé") : "";
    out.push({
      ...base(key, ind, meta.diff, `${meta.prompt} (${period}${convention})`, `${ind.label} : ${fmtValue(ind)} (${period}${convention}).`),
      type: "numeric",
      options: ind.unit ? { unit: ind.unit } : null,
      correct: ind.value,
      tolerance_pct: meta.tol,
    });
  }

  const tfq = (id: string, ind: Indicator, prompt: string, answer: boolean, explanation: string) => {
    out.push({ ...base(id, ind, "beginner", prompt, explanation), type: "true_false", options: null, correct: answer, tolerance_pct: null });
  };

  const hicp = get("ez_hicp_yoy");
  if (hicp && Math.abs(hicp.value - 2) > 0.05) {
    const period = referenceLabel("ez_hicp_yoy", hicp);
    tfq("tf_hicp", hicp, `Vrai ou faux : l’IPCH sur douze mois en zone euro est supérieur à 2 % pour ${period}.`, hicp.value > 2,
      `Inflation IPCH sur 12 mois : ${fmtValue(hicp)} pour ${period}. La BCE cible 2 % à moyen terme.`);
  }
  const cpi = get("us_cpi_yoy");
  if (cpi && Math.abs(cpi.value - 2) > 0.05) {
    const period = referenceLabel("us_cpi_yoy", cpi);
    tfq("tf_cpi", cpi, `Vrai ou faux : l’inflation IPC-U américaine sur 12 mois dépasse 2 % pour ${period}.`, cpi.value > 2,
      `Inflation IPC sur 12 mois : ${fmtValue(cpi)} pour ${period}. L’objectif de la Fed porte sur le PCE.`);
  }
  const fed = get("fed_target_upper");
  const ecb = get("ecb_deposit_rate");
  if (fed && ecb && Math.abs(fed.value - ecb.value) > 0.05) {
    const fedDay = referenceLabel("fed_target_upper", fed);
    const ecbDay = referenceLabel("ecb_deposit_rate", ecb);
    tfq("tf_fed_ecb", { ...fed, source: `${fed.source} · ${ecb.source}` },
      `Vrai ou faux : la borne haute de la Fed au ${fedDay} est supérieure au taux de dépôt de la BCE au ${ecbDay}.`, fed.value > ecb.value,
      `Fed : ${fmtValue(fed)} au ${fedDay}. Dépôt BCE : ${fmtValue(ecb)} au ${ecbDay}.`);
  }
  const brent = get("brent");
  const wti = get("wti");
  if (brent && wti && brent.ref_date === wti.ref_date && Math.abs(brent.value - wti.value) > 0.05) {
    tfq("tf_brent_wti", { ...brent, source: `${brent.source} · ${wti.source}` },
      `Vrai ou faux : le Brent cote au comptant plus cher que le WTI le ${referenceLabel("brent", brent)}.`, brent.value > wti.value,
      `Brent : ${fmtValue(brent)}. WTI : ${fmtValue(wti)}.`);
  }
  return out;
}
