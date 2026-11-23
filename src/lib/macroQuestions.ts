import type { Question } from "@/lib/quiz";
import { fmt } from "@/lib/quiz";
import { fmtValue, isVerifiedMacro, referenceLabel, type Indicator, type MacroData } from "@/lib/macro";

// Questions générées à partir des indicateurs du jour. Une question n'existe que si sa donnée
// est assez récente : sinon elle disparaît toute seule.

const META: Record<string, { prompt: string; tol: number; diff: string }> = {
  ecb_deposit_rate: { prompt: "Quel est le taux de la facilité de dépôt de la BCE, en % ?", tol: 0, diff: "intermediate" },
  fed_target_upper: { prompt: "Quelle est la borne haute de la fourchette cible des fed funds, en % ?", tol: 0, diff: "intermediate" },
  us_cpi_yoy: { prompt: "Quelle est la hausse annuelle de l’IPC-U aux États-Unis, en % ?", tol: 12, diff: "intermediate" },
  ez_hicp_yoy: { prompt: "Quelle est l’inflation IPCH en zone euro sur 12 mois, en % ?", tol: 12, diff: "intermediate" },
  us_unrate: { prompt: "Quel est le taux de chômage aux États-Unis ? (en %)", tol: 8, diff: "intermediate" },
  us_10y: { prompt: "Quel est le rendement du Treasury américain à 10 ans ? (en %)", tol: 6, diff: "intermediate" },
  eurusd: { prompt: "Quel est le taux de référence BCE EUR/USD, en dollars par euro ?", tol: 1.5, diff: "intermediate" },
  brent: { prompt: "Quel est le prix au comptant du Brent, en dollars par baril ?", tol: 6, diff: "intermediate" },
  wti: { prompt: "Quel est le prix au comptant du WTI, en dollars par baril ?", tol: 6, diff: "intermediate" },
  gold: { prompt: "Quel est le prix du contrat à terme sur l’or (GC=F), en dollars par once troy ?", tol: 4, diff: "intermediate" },
  copper: { prompt: "Quel est le prix du contrat à terme sur le cuivre (HG=F), en dollars par livre ?", tol: 6, diff: "intermediate" },
  copper_imf: { prompt: "Quel est le prix mensuel moyen du cuivre selon le FMI, en dollars par tonne ?", tol: 10, diff: "advanced" },
  eurjpy: { prompt: "À combien de yens correspond un euro selon le taux de référence de la BCE ?", tol: 4, diff: "intermediate" },
  eurgbp: { prompt: "À combien de livres sterling correspond un euro selon le taux de référence de la BCE ?", tol: 4, diff: "intermediate" },
};

function base(key: string, ind: Indicator, diff: string, prompt: string, explanation: string) {
  const category = key.includes("rate") || ["fed_target_upper", "us_10y", "tf_fed_ecb"].includes(key) ? "monetary-policy"
    : /^(gdp_|tf_(hicp|cpi))/.test(key) || /cpi|hicp|us_unrate/.test(key) ? "macroeconomics"
      : /^eur/.test(key) ? "fx" : "commodities";
  return {
    id: `macro:${key}:${ind.ref_date}`,
    category_id: category,
    family: key.startsWith("gdp_") ? `pib:${key.split("_")[1] === "ordre" ? "classement" : "estimation"}` : `${category}:${key.startsWith("eur") ? "cotation" : key.replace(/^tf_/, "")}`,
    competency: key.startsWith("gdp_") ? key.startsWith("gdp_ordre") ? "Classer plusieurs économies" : "Estimer un PIB daté" : `Lire ${ind.label}`,
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
      ...base(key, ind, meta.diff, `${meta.prompt} (${period}${convention})${meta.tol ? ` Marge relative de ±${fmt(meta.tol)} %.` : ""}`, `${ind.label} · ${fmtValue(ind)} (${period}${convention}).`),
      type: "numeric",
      options: ind.unit ? { unit: ind.unit } : null,
      correct: ind.value,
      tolerance_pct: meta.tol,
    });
  }

  const gdp = Object.keys(data.indicators).filter((key) => key.startsWith("gdp_")).flatMap((key) => {
    const ind = get(key);
    if (!ind || ind.frequency !== "annual" || ind.unit !== "Md$" || ind.value <= 0) return [];
    const country = ind.label.replace(/^PIB nominal · /, "");
    const year = referenceLabel(key, ind);
    out.push({
      ...base(key, ind, "intermediate", `Estime le PIB nominal du pays suivant en ${year} · ${country}. Réponds en milliards de dollars courants. Marge de ±15 %.`,
        `La Banque mondiale indique ${fmtValue(ind)} pour ${country} en ${year}, aux prix et au change courants.`),
      type: "numeric", options: { unit: ind.unit }, correct: ind.value, tolerance_pct: 15,
    });
    return [{ key, country, ind, year }];
  });
  const panels = [["fra", "deu", "ita"], ["usa", "chn", "jpn"], ["bra", "can", "esp"], ["ind", "gbr", "kor"]];
  for (const panel of panels) {
    const selected = gdp.filter(({ key }) => panel.includes(key.slice(4))).toSorted((a, b) => b.ind.value - a.ind.value);
    if (selected.length !== 3 || new Set(selected.map((x) => x.year)).size !== 1 ||
        new Set(selected.map((x) => x.ind.value)).size !== 3) continue;
    const [a, b, c] = selected;
    out.push({
      ...base(`gdp_ordre_${panel[0]}`, a.ind, "advanced", `Pour ${a.year}, quel ordre va du plus grand au plus petit PIB nominal en dollars courants ?`,
        selected.map(({ country, ind }) => `${country} · ${fmtValue(ind)}`).join(" / ") + "."),
      type: "mcq", options: [[b, c, a], [a, b, c], [c, b, a]].map((order) => order.map((x) => x.country).join(" → ")),
      correct: 1, tolerance_pct: null,
    });
  }

  const tfq = (id: string, ind: Indicator, prompt: string, answer: boolean, explanation: string) => {
    out.push({ ...base(id, ind, "intermediate", prompt, explanation), type: "true_false", options: null, correct: answer, tolerance_pct: null });
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
