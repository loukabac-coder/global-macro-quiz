import type { Question } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";
import { GROUPS } from "@/lib/program";

export function questionLocation(q: Question) {
  if (q.reference_href?.startsWith("/cours/")) {
    const [, , group, unit] = q.reference_href.split("#")[0].split("/");
    const match = GROUPS.find(({ slug }) => slug === group);
    if (match?.units.some(({ slug }) => slug === unit)) return { groupNo: match.no, unitSlug: unit };
  }
  const text = searchText(q.prompt);
  switch (q.category_id) {
    case "macroeconomics":
      if (q.id.startsWith("macro:gdp_")) return { groupNo: "01", unitSlug: "pib" };
      return { groupNo: "01", unitSlug: /chomage|emploi|salaire|recession/.test(text) ? "emploi"
        : /deficit|dette|maastricht|budget/.test(text) ? "finances"
          : /courant|export|import|commercial/.test(text) ? "commerce"
            : /inflation|indice des prix|ipc|hicp|deflation|desinflation|pouvoir d.achat/.test(text) && !/pib/.test(text) ? "inflation" : "pib" };
    case "geopolitics":
      return { groupNo: "03", unitSlug: q.id.startsWith("news:leader:") ? "institutions" : q.kind === "conjunctural" ? "actualite" : "institutions" };
    case "central-banks":
    case "monetary-policy":
      return { groupNo: "02", unitSlug: /communique|surprise|consensus|ois|cot[eé]|price|mediane/.test(text) ? "decisions"
        : /\bqt\b|\bqe\b|bilan|liquidite|pret marginal|facilite|projections/.test(text) ? "instruments"
          : /mandat|quel organe|quel comite|quelle banque|quelle monnaie|bce.*siege|fomc.*reunion|francfort|banque des banques|comptes? courant/.test(text) ? "institutions" : "taux" };
    case "market-caps":
      if (q.id.startsWith("live:")) return { groupNo: "04", unitSlug: "capitalisations" };
      return /valorisation|multiple|ebitda|flottant|poids|actualisation|compte.*cours/.test(text)
        ? { groupNo: "05", unitSlug: "actions" }
        : { groupNo: "04", unitSlug: /indice|s&p|dax|nikkei/.test(text) ? "indices" : "capitalisations" };
    case "fx":
      return /terme|carry|swap|hedge|couverture|arbitrage|basis|parite couverte/.test(text)
        ? { groupNo: "05", unitSlug: "contrats" } : { groupNo: "04", unitSlug: "devises" };
    case "commodities":
      if (q.id.startsWith("macro:")) return { groupNo: "04", unitSlug: "matieres" };
      return /terme|futur|couverture|contango|backwardation|roll|pnl|position.*(long|court)/.test(text)
        ? { groupNo: "05", unitSlug: "contrats" }
        : { groupNo: "04", unitSlug: /producteur|export|opep|raffinerie|stock|offre/.test(text) ? "producteurs" : "matieres" };
    case "financial-markets":
      return { groupNo: "05", unitSlug: /option|\bput\b|\bcall\b|strike|straddle|grecs|vega|gamma/.test(text) ? "options"
        : /obligation|obligataire|duration|dv01|convexite|rendement.*ans|coupon|nominal/.test(text) ? "obligations"
          : /dividende|action|bourse|capitalisation/.test(text) && !/bid|ask|spread/.test(text) ? "actions" : "bases" };
    case "macro-guesstimates":
      return { groupNo: "06", unitSlug: "estimations" };
    default:
      return { groupNo: "06", unitSlug: /interets|capital.*(plac|double)|regle de 72/.test(text) ? "interets"
        : /dollars|usd|yen|livre|multipli|calcule|unite|milliard|million|ratio|per\b/.test(text) && !/variation|points? de base/.test(text) ? "unites" : "pourcentages" };
  }
}

export function questionFamily(q: Question) {
  if (q.family) return q.family;
  const last = q.id.split(":").at(-1) ?? q.id;
  return `${q.category_id}:${last.replace(/-\d+(?:-v\d+)?$/, "")}`;
}
