import { isNumeric, parseNumber, unitOf, type Question } from "@/lib/quiz";

const SCALE_LABELS = ["unités", "milliers", "millions", "milliards", "billions"] as const;
const POWERS = { k: 3, M: 6, Md: 9, T: 12 } as const;
const CURRENCIES = {
  "€": "d’€", "$": "de $", "£": "de £", "¥": "de ¥",
  EUR: "d’EUR", USD: "d’USD", GBP: "de GBP", JPY: "de JPY", CHF: "de CHF", CAD: "de CAD", AUD: "d’AUD",
} as const;
const COUNTS = new Set(["appareils", "bacs", "barils", "billets", "colis", "foyers", "habitants", "kg", "litres", "nuitées", "personnes", "places", "tonnes", "trajets", "unités", "ventes", "vélos"]);

function referenceUnit(unit: string): { power: number; base: string; suffix: string } | null {
  const currency = /^(Md|M|k|T)?\s*(€|\$|£|¥|EUR|USD|GBP|JPY|CHF|CAD|AUD)$/.exec(unit);
  if (currency) {
    const [, prefix, code] = currency;
    return { power: POWERS[prefix as keyof typeof POWERS] ?? 0, base: code, suffix: CURRENCIES[code as keyof typeof CURRENCIES] };
  }
  const written = /^(milliers de milliards|milliers|millions|milliards|billions)(?:\s+(?:de |d[’'])(.+))?$/.exec(unit);
  if (written) {
    const [, scale, base = "unités"] = written;
    const power = scale === "milliers de milliards" ? 12 : SCALE_LABELS.findIndex((label) => label === scale) * 3;
    const suffix = CURRENCIES[base as keyof typeof CURRENCIES];
    if (suffix) return { power, base, suffix };
    if (!COUNTS.has(base)) return null;
    return { power, base,
      suffix: base === "unités" ? "" : base.startsWith("a") ? `d’${base}` : `de ${base}` };
  }
  if (COUNTS.has(unit)) return { power: 0, base: unit, suffix: unit === "unités" ? "" : unit.startsWith("a") ? `d’${unit}` : `de ${unit}` };
  return null;
}

export function answerScales(q: Question) {
  const reference = isNumeric(q) && referenceUnit(unitOf(q).trim());
  if (!reference) return null;
  return {
    referencePower: reference.power,
    options: SCALE_LABELS.slice(0, reference.power === 12 ? 5 : 4).map((scale, i) => ({
      power: i * 3,
      label: i === 0 ? reference.base : [scale, reference.suffix].filter(Boolean).join(" "),
    })),
  };
}

export function parseNumericAnswer(q: Question, input: string, power: number | null): number | null {
  const scales = answerScales(q);
  if (!scales) return parseNumber(input);
  if (input.trimEnd().endsWith("%")) return null;
  if (power === null) return parseNumber(input);
  if (!scales.options.some((option) => option.power === power)) return null;
  return parseNumber(input, power - scales.referencePower);
}
