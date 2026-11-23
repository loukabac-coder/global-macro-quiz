import { lessonsFor } from "@/lib/courseTree";
import { questionLocation } from "@/lib/curriculum/legacyMapping";
import { GROUPS, unitHref } from "@/lib/program";
import { searchText } from "@/lib/searchText";
import { hasStudyReferences, studyDataHref } from "@/lib/studyReferences";
import { fmt, isNumeric, mcqOptions, parseNumber, unitOf, type Question } from "@/lib/quiz";

export function questionCourseHref(q: Question): string | undefined {
  const company = /^live:([^:]+):\d{4}-\d{2}-\d{2}$/.exec(q.id);
  if (company) return studyDataHref("reperes/capitalisations", `cap-${company[1]}`);
  if (q.reference_href?.startsWith("/cours/")) {
    const [path, anchor] = q.reference_href.split("#");
    const scope = path.slice("/cours/".length);
    if (q.reference_date && hasStudyReferences(scope)) return `${studyDataHref(scope)}${anchor ? `#${anchor}` : ""}`;
    return q.reference_href;
  }
  const stored = q as Question & { groupNo?: string; unitSlug?: string };
  const inferred = questionLocation(q);
  const group = GROUPS.find(({ no }) => no === (stored.groupNo ?? inferred.groupNo));
  const unit = group?.units.find(({ slug }) => slug === (stored.unitSlug ?? inferred.unitSlug));
  if (!group || !unit) return;
  const terms = new Set(searchText(`${q.prompt} ${q.competency ?? ""}`).match(/[a-z]{4,}/g));
  let section: string | undefined;
  let best = 0;
  for (const lesson of lessonsFor(group, unit)) {
    const matches = searchText(lesson.title).match(/[a-z]{4,}/g)?.filter((term) => terms.has(term)).length ?? 0;
    if (matches > best) {
      best = matches;
      section = lesson.slug;
    }
  }
  return `${unitHref(group, unit)}${section ? `#${section}` : ""}`;
}

export function mentalMethod(q: Question): string[] | undefined {
  if (q.reference_date || !q.explanation?.trim()) return;
  const quantities = q.prompt.match(/\d+(?:[,.]\d+)?/g)?.length ?? 0;
  const numericChoice = q.type === "mcq" && quantities >= 2 && mcqOptions(q).every((option) => /\d/.test(option));
  if (!isNumeric(q) && !numericChoice) return;
  const variation = /(?:passe|passent|passé|varie) de (\d+(?:[ \u202f\u00a0]\d{3})*(?:[,.]\d+)?) à (\d+(?:[ \u202f\u00a0]\d{3})*(?:[,.]\d+)?)/iu.exec(q.prompt);
  if (variation && unitOf(q) === "%") {
    const start = parseNumber(variation[1]);
    const end = parseNumber(variation[2]);
    if (start && end !== null) {
      const delta = end - start;
      const expected = delta / start * 100;
      if (Math.abs(Number(q.correct) - expected) < 0.05) {
        const fraction = new Map([[10, "un dixième"], [12.5, "un huitième"], [20, "un cinquième"], [25, "un quart"], [50, "la moitié"]]).get(Math.abs(expected));
        return [
          `Fais la différence entre ${fmt(end)} et ${fmt(start)}. L’écart vaut ${fmt(delta)}.`,
          fraction ? `En valeur absolue, cet écart représente ${fraction} de ${fmt(start)}.`
            : `Prends ${fmt(start / 100)} comme repère de 1 %. Compare-lui l’écart de ${fmt(Math.abs(delta))}.`,
          `La variation est de ${fmt(expected)} %.`,
        ];
      }
    }
  }
  const steps = q.explanation.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ü\d])/u).filter(Boolean);
  if (steps.length > 4) return [...steps.slice(0, 3), steps.slice(3).join(" ")];
  if (steps.length === 1 && isNumeric(q)) return [...steps, `Résultat · ${fmt(Number(q.correct))} ${unitOf(q)}`.trim()];
  return steps;
}
