// Générateur infini de calcul mental. Chaque question est calculée par le code
// (jamais écrite à la main) et vient avec une explication de la méthode rapide.

import { NUMERIC_TOLERANCE, type Question } from "@/lib/quiz";

export type Topic =
  | "pourcentages"
  | "variations"
  | "interets"
  | "devises"
  | "bps"
  | "multiplications"
  | "ratios"
  | "ordres";

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "pourcentages", label: "Pourcentages" },
  { id: "variations", label: "Variations" },
  { id: "interets", label: "Intérêts composés et règle de 72" },
  { id: "devises", label: "Devises" },
  { id: "bps", label: "Points de base et points de %" },
  { id: "multiplications", label: "Multiplications rapides" },
  { id: "ratios", label: "Ratios (PER, rendement, marge)" },
  { id: "ordres", label: "Ordres de grandeur" },
];

export type Rng = () => number;
type Gen = { prompt: string; answer: number; tol: number; unit: string; explanation: string };

const ri = (r: Rng, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const pick = <T,>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const nf = (n: number) => r4(n).toLocaleString("fr-FR", { maximumFractionDigits: 4 });
const fx2 = (n: number) => n.toFixed(2).replace(".", ",");
const sign = (n: number) => (n > 0 ? "+" : "") + nf(n);

// ---------- Pourcentages ----------
function pourcentages(level: number, r: Rng): Gen {
  if (level >= 5 && r() < 0.5) {
    const total = pick(r, [80, 120, 160, 200, 240, 320, 400, 600]);
    const pct = pick(r, [2.5, 7.5, 12.5, 17.5, 37.5, 62.5]);
    const part = (total * pct) / 100;
    return {
      prompt: `${nf(part)} représente quel pourcentage de ${nf(total)} ?`,
      answer: pct,
      tol: NUMERIC_TOLERANCE.rounding,
      unit: "%",
      explanation: `${nf(part)} / ${nf(total)} = ${nf(pct / 100)}, soit ${nf(pct)} %. Astuce : 1 % de ${nf(total)} = ${nf(total / 100)}, puis on divise ${nf(part)} par ${nf(total / 100)}.`,
    };
  }
  const sets: { p: number[]; bases: number[]; tol: number }[] = [
    { p: [10, 50, 25, 20, 1, 5], bases: [40, 60, 80, 120, 160, 200, 240, 360, 400, 480, 600, 800, 900], tol: 0 },
    { p: [15, 30, 75, 12.5, 40, 60, 2, 3], bases: [40, 80, 120, 160, 200, 240, 320, 400, 800], tol: 0 },
    { p: [7, 35, 45, 18, 22, 6, 9], bases: [100, 200, 250, 300, 400, 500, 600, 800], tol: 0 },
    { p: [8.5, 17.5, 37.5, 62.5, 6.25, 12, 14], bases: [80, 160, 240, 320, 400, 800, 1200], tol: NUMERIC_TOLERANCE.rounding },
  ];
  const s = sets[Math.min(level, 4) - 1];
  const p = pick(r, s.p);
  const base = pick(r, s.bases);
  const ans = r4((base * p) / 100);
  let tip: string;
  if (p === 10) tip = `10 % = diviser par 10 : ${nf(base)} / 10 = ${nf(ans)}.`;
  else if (p === 50) tip = `50 % = la moitié : ${nf(base)} / 2 = ${nf(ans)}.`;
  else if (p === 25) tip = `25 % = un quart : ${nf(base)} / 4 = ${nf(ans)}.`;
  else if (p === 20) tip = `20 % = 2 × 10 % : 10 % = ${nf(base / 10)}, donc ${nf(ans)}.`;
  else if (p === 5) tip = `5 % = la moitié de 10 % : 10 % = ${nf(base / 10)}, donc ${nf(ans)}.`;
  else if (p === 1) tip = `1 % = diviser par 100 : ${nf(ans)}.`;
  else if (p === 15) tip = `15 % = 10 % + 5 % : ${nf(base / 10)} + ${nf(base / 20)} = ${nf(ans)}.`;
  else if (p === 75) tip = `75 % = trois quarts : ${nf(base / 4)} × 3 = ${nf(ans)}.`;
  else if (p === 12.5) tip = `12,5 % = un huitième : ${nf(base)} / 8 = ${nf(ans)}.`;
  else tip = `1 % de ${nf(base)} = ${nf(base / 100)}, donc ${nf(p)} % = ${nf(base / 100)} × ${nf(p)} = ${nf(ans)}.`;
  return { prompt: `Combien font ${nf(p)} % de ${nf(base)} ?`, answer: ans, tol: s.tol, unit: "", explanation: tip };
}

// ---------- Variations ----------
function variations(level: number, r: Rng): Gen {
  if (level >= 4 && r() < 0.5) {
    const pct = pick(r, level >= 5 ? [-35, -40, 35, -15, 60] : [20, 25, -20, 50, -25]);
    const start = pick(r, [80, 100, 120, 140, 200, 240]);
    const end = r4(start * (1 + pct / 100));
    return {
      prompt: `Après une variation de ${sign(pct)} %, un prix vaut ${nf(end)}. Quel était le prix de départ ?`,
      answer: start,
      tol: NUMERIC_TOLERANCE.rounding,
      unit: "",
      explanation: `Prix de départ = prix final / (1 + variation) = ${nf(end)} / ${nf(1 + pct / 100)} = ${nf(start)}.`,
    };
  }
  if (level >= 2 && r() < 0.4) {
    const pairs: [number, number][] = [
      [20, -20], [10, -10], [50, -50], [30, -10], [25, -20], [-50, 50], [100, -50], [20, 10], [-10, -10], [40, -25],
    ];
    const [a, b] = pick(r, pairs);
    const total = r4(((1 + a / 100) * (1 + b / 100) - 1) * 100);
    return {
      prompt: `Un actif varie de ${sign(a)} % puis de ${sign(b)} %. Quelle est la variation totale, en % ?`,
      answer: total,
      tol: 0,
      unit: "%",
      explanation: `Les variations se multiplient : ${nf(1 + a / 100)} × ${nf(1 + b / 100)} = ${nf(1 + total / 100)}, soit ${sign(total)} %.`,
    };
  }
  const pcts =
    level <= 1
      ? [10, 20, 25, 50, 100, -10, -20, -25, -50]
      : level === 2
        ? [5, 15, 30, 40, -5, -15, -30, 12.5, -12.5]
        : [8, 12, 35, 60, -8, -35, -60, 75, -40];
  const pct = pick(r, pcts);
  const a = pick(r, [40, 80, 100, 160, 200, 240, 400, 800]);
  const b = r4(a * (1 + pct / 100));
  return {
    prompt: `Un titre passe de ${nf(a)} à ${nf(b)}. Quelle est la variation, en % ?`,
    answer: pct,
    tol: level >= 3 ? NUMERIC_TOLERANCE.rounding : 0,
    unit: "%",
    explanation: `Variation = (${nf(b)} − ${nf(a)}) / ${nf(a)} = ${nf(b - a)} / ${nf(a)} = ${sign(pct)} %.`,
  };
}

// ---------- Intérêts, règle de 72 ----------
function interets(level: number, r: Rng): Gen {
  if (level <= 1) {
    const cap = pick(r, [100, 200, 500, 1000]);
    const rate = pick(r, [5, 10, 20]);
    const ans = r4(cap * (1 + rate / 100));
    return {
      prompt: `Tu places ${nf(cap)} € à ${rate} % pendant 1 an. Combien d’euros d’intérêts gagnes-tu ?`,
      answer: r4(ans - cap),
      tol: 0,
      unit: "€",
      explanation: `Les intérêts correspondent à ${rate} % de ${nf(cap)} €, soit ${nf(ans - cap)} €.`,
    };
  }
  if (level === 2) {
    if (r() < 0.5) {
      const rate = pick(r, [2, 3, 4, 6, 8, 9, 12]);
      return {
        prompt: `Règle de 72 : à ${rate} % par an, en combien d’années un capital double-t-il environ ?`,
        answer: r4(72 / rate),
        tol: 10,
        unit: "ans",
        explanation: `72 / ${rate} = ${nf(72 / rate)} ans.`,
      };
    }
    const cap = pick(r, [100, 1000]);
    const rate = pick(r, [10, 20]);
    const n = 2;
    const ans = r4(cap * Math.pow(1 + rate / 100, n));
    return {
      prompt: `${nf(cap)} € placés à ${rate} % par an en intérêts composés pendant ${n} ans valent combien ?`,
      answer: ans,
      tol: 0,
      unit: "€",
      explanation: `${nf(cap)} × ${nf(1 + rate / 100)}² = ${nf(ans)} €. On applique la hausse deux fois.`,
    };
  }
  if (level === 3) {
    if (r() < 0.5) {
      const years = pick(r, [6, 8, 9, 12, 18, 24]);
      return {
        prompt: `Un capital double en ${years} ans. Quel est le taux annuel approximatif (règle de 72) ?`,
        answer: r4(72 / years),
        tol: 10,
        unit: "%",
        explanation: `72 / ${years} = ${nf(72 / years)} % par an.`,
      };
    }
    const cap = pick(r, [1000, 2000, 5000]);
    const rate = pick(r, [5, 10]);
    const n = 3;
    const ans = r4(cap * Math.pow(1 + rate / 100, n));
    return {
      prompt: `${nf(cap)} € à ${rate} % par an en intérêts composés pendant ${n} ans. Combien à la fin ?`,
      answer: ans,
      tol: 1,
      unit: "€",
      explanation: `${nf(cap)} × ${nf(1 + rate / 100)}³ = ${nf(ans)} €. Les intérêts composés rapportent plus que 3 × ${rate} % (= ${nf(cap * (1 + (3 * rate) / 100))} €).`,
    };
  }
  if (level === 4) {
    const cap = pick(r, [200000, 300000, 500000, 600000, 1000000]);
    const rate = pick(r, [2.4, 3, 3.6, 4.8, 6]);
    const months = pick(r, [3, 6, 9]);
    const ans = r4((cap * (rate / 100) * months) / 12);
    return {
      prompt: `Intérêts simples sur ${nf(cap)} € à ${nf(rate)} % par an pendant ${months} mois ?`,
      answer: ans,
      tol: NUMERIC_TOLERANCE.rounding,
      unit: "€",
      explanation: `Intérêt annuel = ${nf((cap * rate) / 100)} €. Pour ${months} mois : × ${months}/12 = ${nf(ans)} €.`,
    };
  }
  const rate = pick(r, [6, 7, 8]);
  const n = 10;
  const ans = r4(100 * Math.pow(1 + rate / 100, n));
  return {
    prompt: `100 € à ${rate} % par an, intérêts composés, pendant ${n} ans : quelle valeur à peu près ?`,
    answer: ans,
    tol: NUMERIC_TOLERANCE.estimate,
    unit: "€",
    explanation: `La règle de 72 estime le temps de doublement à ${nf(72 / rate)} ans. Le calcul 100 × ${nf(1 + rate / 100)}^${n} donne ${nf(ans)} €.`,
  };
}

// ---------- Devises ----------
function devises(level: number, r: Rng): Gen {
  if (level <= 1) {
    const rate = pick(r, [1.1, 1.2, 1.25, 1.5, 2]);
    const amt = pick(r, [100, 200, 500, 1000, 2000]);
    const ans = r4(amt * rate);
    return {
      prompt: `EUR/USD = ${fx2(rate)}. Combien de dollars pour ${nf(amt)} € ?`,
      answer: ans,
      tol: 0,
      unit: "$",
      explanation: `EUR/USD = ${nf(rate)} : 1 € = ${nf(rate)} $. ${nf(amt)} × ${nf(rate)} = ${nf(ans)} $.`,
    };
  }
  if (level === 2) {
    const rate = pick(r, [1.25, 1.5, 1.2, 1.6, 2]);
    const eur = pick(r, [100, 200, 400, 800, 1000]);
    const usd = r4(eur * rate);
    return {
      prompt: `GBP/USD = ${fx2(rate)}. Combien de livres pour ${nf(usd)} $ ?`,
      answer: eur,
      tol: 0,
      unit: "£",
      explanation: `Pour passer des dollars aux livres, on divise : ${nf(usd)} / ${nf(rate)} = ${nf(eur)} £.`,
    };
  }
  if (level === 3) {
    const rate = pick(r, [100, 120, 150, 160]);
    const jpy = pick(r, [6, 9, 12, 15, 30]) * 1_000_000;
    const ans = r4(jpy / rate);
    return {
      prompt: `USD/JPY = ${rate}. Combien de dollars pour ${nf(jpy)} yens ?`,
      answer: ans,
      tol: NUMERIC_TOLERANCE.rounding,
      unit: "$",
      explanation: `On divise les yens par ${rate} : ${nf(jpy)} / ${rate} = ${nf(ans)} $.`,
    };
  }
  if (level === 4) {
    const [eu, gb] = pick<[number, number]>(r, [[1.1, 1.25], [1.2, 1.5], [1.2, 1.25], [1.2, 1.6], [1.08, 1.35]]);
    const ans = r4(eu / gb);
    return {
      prompt: `EUR/USD = ${fx2(eu)} et GBP/USD = ${fx2(gb)}. Quel est le cours EUR/GBP ?`,
      answer: ans,
      tol: NUMERIC_TOLERANCE.rounding,
      unit: "",
      explanation: `Cours croisé : EUR/GBP = (EUR/USD) / (GBP/USD) = ${nf(eu)} / ${nf(gb)} = ${nf(ans)}.`,
    };
  }
  const start = pick(r, [1.0, 1.2, 1.5, 2.0]);
  const rise = pick(r, [10, 20]);
  const end = r4(start * (1 + rise / 100));
  const drop = r4((1 - 1 / (1 + rise / 100)) * 100);
  return {
    prompt: `EUR/USD passe de ${fx2(start)} à ${fx2(end)}. Le dollar perd combien contre l’euro, en % ?`,
    answer: drop,
    tol: NUMERIC_TOLERANCE.estimate,
    unit: "%",
    explanation: `L’euro prend ${rise} %. Le dollar perd x / (1 + x) = ${rise / 100} / ${nf(1 + rise / 100)} = ${nf(drop)} %. Une hausse de x % d’une devise est une baisse inférieure à x % de l’autre.`,
  };
}

// ---------- Points de base ----------
function bps(level: number, r: Rng): Gen {
  if (level <= 1) {
    if (r() < 0.5) {
      const b = pick(r, [10, 25, 50, 75, 100, 150, 200]);
      return { prompt: `${b} points de base valent combien de % ?`, answer: r4(b / 100), tol: 0, unit: "%", explanation: `1 pb = 0,01 %, donc ${b} pb = ${nf(b / 100)} %.` };
    }
    const p = pick(r, [0.25, 0.5, 1, 1.5, 2, 3]);
    return { prompt: `${nf(p)} % valent combien de points de base ?`, answer: r4(p * 100), tol: 0, unit: "pb", explanation: `1 % = 100 pb, donc ${nf(p)} % = ${nf(p * 100)} pb.` };
  }
  if (level === 2) {
    if (r() < 0.5) {
      const rate = pick(r, [2.75, 3.25, 3.5, 4.25, 4.5]);
      const b = pick(r, [25, 50, 75]);
      return { prompt: `Un taux de ${nf(rate)} % augmente de ${b} pb. Nouveau taux, en % ?`, answer: r4(rate + b / 100), tol: 0, unit: "%", explanation: `${b} pb = ${nf(b / 100)} %, donc ${nf(rate)} + ${nf(b / 100)} = ${nf(rate + b / 100)} %.` };
    }
    const a = pick(r, [4.1, 3.9, 4.5, 5.25]);
    const b = pick(r, [3.65, 3.4, 4.0, 4.75]);
    return { prompt: `Quel est l’écart, en points de base, entre ${nf(a)} % et ${nf(b)} % ?`, answer: r4(Math.abs(a - b) * 100), tol: 0, unit: "pb", explanation: `|${nf(a)} − ${nf(b)}| = ${nf(Math.abs(a - b))} %, soit ${nf(Math.abs(a - b) * 100)} pb.` };
  }
  if (level === 3) {
    const sp = pick(r, [45, 60, 85, 120, 150]);
    const notional = pick(r, [10, 20, 40, 50]);
    const ans = r4(notional * 1_000_000 * (sp / 10000));
    return { prompt: `Un spread de ${sp} pb sur ${notional} M€ de notionnel : coût annuel, en € ?`, answer: ans, tol: 0, unit: "€", explanation: `${sp} pb = ${nf(sp / 100)} %. ${notional} M€ × ${nf(sp / 100)} % = ${nf(ans)} €. Repère : 1 pb sur 10 M€ = 1 000 €.` };
  }
  if (level === 4) {
    if (r() < 0.5) {
      const dur = pick(r, [3, 4, 5, 6, 7, 8, 10]);
      const move = pick(r, [25, 50, 100]);
      const ans = r4(-dur * (move / 100));
      return { prompt: `Obligation de duration modifiée ${dur}. Le rendement monte de ${move} pb. Variation approximative du prix, en % ?`, answer: ans, tol: NUMERIC_TOLERANCE.estimate, unit: "%", explanation: `Variation du prix ≈ − duration modifiée × variation du rendement = −${dur} × ${nf(move / 100)} % = ${nf(ans)} %.` };
    }
    const notional = pick(r, [2, 5, 10, 20]);
    const dur = pick(r, [2, 4, 5, 10]);
    const ans = r4(notional * 1_000_000 * dur * 0.0001);
    return { prompt: `Obligation de ${notional} M€ et de duration modifiée ${dur}. Quel est le DV01 approximatif (perte pour +1 pb), en € ?`, answer: ans, tol: NUMERIC_TOLERANCE.estimate, unit: "€", explanation: `DV01 ≈ valeur × duration modifiée × 0,0001 = ${nf(notional * 1_000_000)} × ${dur} × 0,0001 = ${nf(ans)} €.` };
  }
  const a = pick(r, [2, 3, 4, 5]);
  const b = a + pick(r, [1, 1, 2]);
  const rel = r4(((b - a) / a) * 100);
  return {
    prompt: `Le taux passe de ${a} % à ${b} %. Quelle est la hausse relative du taux, en % ? (attention : ce n’est pas la hausse en points de pourcentage)`,
    answer: rel,
    tol: NUMERIC_TOLERANCE.rounding,
    unit: "%",
    explanation: `En points de pourcentage : +${b - a} point(s). En relatif : (${b} − ${a}) / ${a} = ${nf(rel)} %. Ne pas confondre points de % et %.`,
  };
}

// ---------- Multiplications rapides ----------
function multiplications(level: number, r: Rng): Gen {
  if (level <= 1) {
    const k = pick(r, [5, 11, 25, 9]);
    const n = k === 25 ? pick(r, [4, 8, 12, 16, 24, 40]) : pick(r, [12, 14, 16, 18, 24, 32, 36, 44]);
    const tip: Record<number, string> = {
      5: `× 5 = × 10 puis ÷ 2 : ${n * 10} / 2 = ${n * 5}.`,
      11: `× 11 = × 10 + le nombre : ${n * 10} + ${n} = ${n * 11}.`,
      25: `× 25 = × 100 puis ÷ 4 : ${n * 100} / 4 = ${n * 25}.`,
      9: `× 9 = × 10 − le nombre : ${n * 10} − ${n} = ${n * 9}.`,
    };
    return { prompt: `Calcule ${n} × ${k}.`, answer: n * k, tol: 0, unit: "", explanation: tip[k] };
  }
  if (level === 2) {
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const n = ri(r, 3, 9);
      return { prompt: `Calcule 99 × ${n}.`, answer: 99 * n, tol: 0, unit: "", explanation: `99 × ${n} = 100 × ${n} − ${n} = ${100 * n} − ${n} = ${99 * n}.` };
    }
    if (kind === 1) {
      const n = ri(r, 12, 40);
      return { prompt: `Calcule ${n} × 15.`, answer: n * 15, tol: 0, unit: "", explanation: `× 15 = × 10 + × 5 : ${n * 10} + ${n * 5} = ${n * 15}.` };
    }
    const n = ri(r, 12, 46);
    return { prompt: `Calcule ${n} × 50.`, answer: n * 50, tol: 0, unit: "", explanation: `× 50 = × 100 puis ÷ 2 : ${n * 100} / 2 = ${n * 50}.` };
  }
  if (level === 3) {
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const n = pick(r, [15, 25, 35, 45, 55, 65, 75, 85, 95]);
      const t = Math.floor(n / 10);
      return { prompt: `Calcule ${n}².`, answer: n * n, tol: 0, unit: "", explanation: `Nombre finissant par 5 : ${t} × ${t + 1} = ${t * (t + 1)}, puis on écrit 25 : ${n * n}.` };
    }
    if (kind === 1) {
      const base = pick(r, [100, 200]);
      const d = ri(r, 1, 5);
      const n = base + (r() < 0.5 ? d : -d);
      return { prompt: `Calcule ${n}².`, answer: n * n, tol: 0, unit: "", explanation: `(${base} ${n > base ? "+" : "−"} ${d})² = ${base * base} ${n > base ? "+" : "−"} ${2 * base * d} + ${d * d} = ${n * n}.` };
    }
    const m = pick(r, [20, 30, 40, 50, 60]);
    const d = ri(r, 1, 4);
    return { prompt: `Calcule ${m - d} × ${m + d}.`, answer: m * m - d * d, tol: 0, unit: "", explanation: `(a − b)(a + b) = a² − b² : ${m}² − ${d}² = ${m * m} − ${d * d} = ${m * m - d * d}.` };
  }
  if (level === 4) {
    const kind = ri(r, 0, 2);
    if (kind === 0) {
      const a = ri(r, 12, 29);
      const b = ri(r, 12, 29);
      return { prompt: `Calcule ${a} × ${b}.`, answer: a * b, tol: 0, unit: "", explanation: `${a} × ${b} = ${a} × ${Math.floor(b / 10) * 10} + ${a} × ${b % 10} = ${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${a * b}.` };
    }
    if (kind === 1) {
      const n = pick(r, [8, 16, 24, 32, 40, 48]);
      return { prompt: `Calcule 125 × ${n}.`, answer: 125 * n, tol: 0, unit: "", explanation: `125 = 1 000 / 8. ${n} / 8 = ${n / 8}, donc ${n / 8} × 1 000 = ${125 * n}.` };
    }
    const n = ri(r, 21, 79);
    return { prompt: `Calcule ${n}².`, answer: n * n, tol: 0, unit: "", explanation: `Passe par un nombre rond : ${n}² avec (${Math.round(n / 10) * 10} ${n >= Math.round(n / 10) * 10 ? "+" : "−"} ${Math.abs(n - Math.round(n / 10) * 10)})².` };
  }
  const kind = ri(r, 0, 1);
  if (kind === 0) {
    const a = ri(r, 31, 69);
    const b = ri(r, 11, 19);
    return { prompt: `Calcule ${a} × ${b}.`, answer: a * b, tol: 0, unit: "", explanation: `${a} × ${b} = ${a} × 10 + ${a} × ${b - 10} = ${a * 10} + ${a * (b - 10)} = ${a * b}.` };
  }
  const a = ri(r, 3, 9);
  return { prompt: `Calcule 999 × ${a}.`, answer: 999 * a, tol: 0, unit: "", explanation: `999 × ${a} = 1 000 × ${a} − ${a} = ${1000 * a} − ${a} = ${999 * a}.` };
}

// ---------- Ratios ----------
function ratios(level: number, r: Rng): Gen {
  if (level <= 1) {
    const eps = pick(r, [2, 3, 4, 5, 6]);
    const per = pick(r, [10, 15, 20, 25]);
    return { prompt: `Le PER se calcule en divisant le cours par le bénéfice par action. Cours : ${eps * per} $. Bénéfice par action : ${eps} $. Quel est le PER ?`, answer: per, tol: 0, unit: "", explanation: `Divise le cours par le bénéfice par action : ${eps * per} / ${eps} = ${per}.` };
  }
  if (level === 2) {
    const price = pick(r, [40, 50, 80, 100, 200]);
    const rate = pick(r, [2, 2.5, 4, 5]);
    const d = r4((price * rate) / 100);
    return { prompt: `Une action à ${nf(price)} $ verse ${nf(d)} $ de dividende. Rendement du dividende, en % ?`, answer: rate, tol: 0, unit: "%", explanation: `${nf(d)} / ${nf(price)} = ${nf(rate / 100)}, soit ${nf(rate)} %.` };
  }
  if (level === 3) {
    const per = pick(r, [10, 20, 25, 40, 50]);
    return { prompt: `Un PER de ${per} correspond à quel rendement des bénéfices (earnings yield), en % ?`, answer: r4(100 / per), tol: 1, unit: "%", explanation: `Rendement des bénéfices = 1 / PER = 1 / ${per} = ${nf(100 / per)} %.` };
  }
  if (level === 4) {
    if (r() < 0.5) {
      const ca = pick(r, [200, 400, 480, 800]);
      const m = pick(r, [5, 7.5, 10, 12.5]);
      return { prompt: `Chiffre d’affaires ${ca} M€, marge nette ${nf(m)} %. Quel est le résultat net, en M€ ?`, answer: r4((ca * m) / 100), tol: 0, unit: "M€", explanation: `${ca} × ${nf(m)} % = ${nf((ca * m) / 100)} M€.` };
    }
    const cap = pick(r, [100, 200, 300]);
    const debt = pick(r, [20, 40, 60]);
    const ebitda = pick(r, [10, 20, 30]);
    const ev = cap + debt;
    return { prompt: `Capitalisation ${cap} Md$, dette nette ${debt} Md$, EBITDA ${ebitda} Md$. Estime le multiple EV / EBITDA.`, answer: r4(ev / ebitda), tol: NUMERIC_TOLERANCE.estimate, unit: "", explanation: `EV = capitalisation + dette nette = ${cap} + ${debt} = ${ev}. EV / EBITDA = ${ev} / ${ebitda} = ${nf(ev / ebitda)}.` };
  }
  const earnings = pick(r, [6, 10, 12, 15, 20, 30]);
  const per = pick(r, [10, 15, 20, 25]);
  const cap = earnings * per;
  const sharesOptions = [2, 4, 5, 10].filter((x) => cap % x === 0);
  const shares = pick(r, sharesOptions.length ? sharesOptions : [1]);
  const price = cap / shares;
  return { prompt: `Une action cote ${nf(price)} $, il y a ${shares} Md d’actions et le bénéfice net est de ${earnings} Md$. Quel est le PER ?`, answer: per, tol: 0, unit: "", explanation: `Capitalisation = ${nf(price)} × ${shares} = ${nf(cap)} Md$. PER = ${nf(cap)} / ${earnings} = ${per}.` };
}

// ---------- Ordres de grandeur ----------
function ordres(level: number, r: Rng): Gen {
  if (level <= 1) {
    if (r() < 0.5) {
      const x = pick(r, [0.4, 1.5, 2.5, 3.2, 7.5]);
      return { prompt: `${nf(x)} Md$ valent combien de millions de dollars (M$) ?`, answer: x * 1000, tol: 0, unit: "M$", explanation: `1 milliard = 1 000 millions : ${nf(x)} × 1 000 = ${nf(x * 1000)} M$.` };
    }
    const x = pick(r, [0.4, 1.2, 2.5, 3, 5]);
    return { prompt: `${nf(x)} T$ valent combien de milliards de dollars (Md$) ?`, answer: x * 1000, tol: 0, unit: "Md$", explanation: `1 billion (T) = 1 000 milliards : ${nf(x)} × 1 000 = ${nf(x * 1000)} Md$.` };
  }
  if (level === 2) {
    const px = pick(r, [50, 80, 100, 120, 200]);
    const sh = pick(r, [0.5, 1, 2, 2.5, 4]);
    return { prompt: `Une action cote ${px} $ et l’entreprise a ${nf(sh)} Md d’actions. Quelle est sa capitalisation, en Md$ ?`, answer: r4(px * sh), tol: 0, unit: "Md$", explanation: `Capitalisation = cours × nombre d’actions = ${px} × ${nf(sh)} = ${nf(px * sh)} Md$.` };
  }
  if (level === 3) {
    const gdp = pick(r, [3, 4, 5, 20, 30]);
    const ratio = pick(r, [60, 100, 120, 250]);
    return { prompt: `PIB de ${gdp} T$ et dette publique à ${ratio} % du PIB. Quelle est la dette, en T$ ?`, answer: r4((gdp * ratio) / 100), tol: NUMERIC_TOLERANCE.rounding, unit: "T$", explanation: `${gdp} T$ × ${ratio} % = ${nf((gdp * ratio) / 100)} T$.` };
  }
  if (level === 4) {
    const pop = pick(r, [60, 68, 80, 340]);
    const inc = pick(r, [30000, 40000, 50000, 80000]);
    const ans = (pop * 1e6 * inc) / 1e12;
    return { prompt: `${pop} millions d’habitants avec un PIB par habitant de ${nf(inc)} $. Estime le PIB total en T$.`, answer: r4(ans), tol: NUMERIC_TOLERANCE.estimate, unit: "T$", explanation: `${pop} M × ${nf(inc)} $ = ${nf(pop * inc)} M$ = ${nf(ans)} T$ (1 T$ = 1 000 000 M$).` };
  }
  const total = pick(r, [10, 20, 30]);
  const part = pick(r, [5, 8, 12, 20]);
  return { prompt: `Dans un indice de ${total} T$ de capitalisation, une entreprise vaut ${nf(part * 100)} Md$. Estime son poids en %.`, answer: r4(((part * 100) / (total * 1000)) * 100), tol: NUMERIC_TOLERANCE.weight, unit: "%", explanation: `${nf(total)} T$ = ${nf(total * 1000)} Md$. Poids = ${part * 100} / ${nf(total * 1000)} = ${nf(((part * 100) / (total * 1000)) * 100)} %.` };
}

const GENERATORS: Record<Topic, (level: number, r: Rng) => Gen> = {
  pourcentages,
  variations,
  interets,
  devises,
  bps,
  multiplications,
  ratios,
  ordres,
};

const DIFF_BY_LEVEL = ["beginner", "intermediate", "intermediate", "advanced", "expert"];
export const MENTAL_QUESTION_PREFIX = "gen:mental:v2:";

export function mentalDifficulty(level: number): string {
  return DIFF_BY_LEVEL[Math.min(5, Math.max(1, Math.round(level))) - 1];
}

let counter = 0;

export function mentalQuestion(level: number, r: Rng, topic?: Topic | null): Question {
  const lv = Math.min(5, Math.max(1, Math.round(level)));
  const t = topic ?? pick(r, TOPICS).id;
  const g = GENERATORS[t](lv, r);
  counter += 1;
  return {
    id: `${MENTAL_QUESTION_PREFIX}${t}:${lv}:${counter}`,
    category_id: "mental-math",
    type: "numeric",
    difficulty: mentalDifficulty(lv),
    prompt: g.prompt,
    options: g.unit ? { unit: g.unit } : null,
    correct: g.answer,
    tolerance_pct: g.tol,
    explanation: g.explanation,
    wrong_explanations: null,
    source: "Question générée automatiquement (calcul vérifié par le code)",
    kind: "structural",
    reference_date: null,
  };
}

// Une série progressive : la difficulté monte tous les `step` questions.
export function mentalSession(count: number, startLevel: number, r: Rng, topic?: Topic | null, step = 3): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 20) {
    guard += 1;
    const level = Math.min(5, startLevel + Math.floor(out.length / step));
    const q = mentalQuestion(level, r, topic);
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}
