import { CHECK_MAX_HOURS, observationAge, wasRecentlyChecked, type SnapshotDates } from "@/lib/dataFreshness";
import { type Question } from "@/lib/quiz";

type DatedFact = { id: string; date: string; retrieved_at: string; source: string; url: string };
export type NewsItem = DatedFact & { title: string; context: string; topic: string; published_at?: string | null };
export type Leader = DatedFact & { office: string; name: string; previous_name?: string; change_date?: string };
export type ElectionResult = DatedFact & { country: string; winner: string; seats: number; total: number };
export type PolicyDecision = DatedFact & { movement: "unchanged" | "up" | "down" };
export const POLICY_MOVEMENT = { unchanged: "Maintien du taux", up: "Hausse du taux", down: "Baisse du taux" } as const;
export const POLICY_BANKS = {
  ecb: "Banque centrale européenne", fed: "Réserve fédérale", boe: "Banque d’Angleterre",
  boj: "Banque du Japon", snb: "Banque nationale suisse",
};
export type NewsData = SnapshotDates & { events: NewsItem[]; leaders: Leader[]; decisions?: PolicyDecision[]; elections?: ElectionResult[]; failed: string[] };

export function isNewsVerified(row: DatedFact, now: number, maxDays: number) {
  const age = observationAge(row.date, now);
  return age >= 0 && age <= maxDays && wasRecentlyChecked(row.retrieved_at, now, CHECK_MAX_HOURS);
}

export function electionSummary(row: ElectionResult) {
  return `${row.winner} · ${row.seats} sièges sur ${row.total}`;
}

const topics = [
  "Sanctions et mesures restrictives", "Énergie et approvisionnement", "Commerce et coopération internationale",
  "Réglementation financière", "Budget et financement public", "Élections et institutions",
];

export function buildNewsQuestions(data: NewsData, now: number): Question[] {
  const leaders = data.leaders.filter((row) => isNewsVerified(row, now, 2));
  const facts: Question[] = leaders.flatMap((row, i) => {
    const names = [...new Set(leaders.filter((other) => other.name !== row.name).map((other) => other.name))].slice(0, 2);
    if (names.length < 2) return [];
    const correct = i % 3;
    names.splice(correct, 0, row.name);
    return [{
      id: `news:leader:${row.id}:${row.date}`, category_id: "geopolitics", type: "mcq", difficulty: "intermediate",
      family: "institutions:titulaires", competency: "Identifier un responsable en fonction",
      prompt: `Qui occupe cette fonction au ${row.date} ? ${row.office}.`,
      options: names, correct, tolerance_pct: null, explanation: `${row.name} occupe cette fonction à la date de vérification.`,
      wrong_explanations: null, source: row.source, source_url: row.url, kind: "conjunctural", reference_date: row.date,
    }];
  });
  const events = data.events.filter((row) => isNewsVerified(row, now, 35));
  for (const row of events) {
    if (!topics.includes(row.topic)) continue;
    const topicsToCompare = topics.filter((topic) => topic !== row.topic).slice(0, 2);
    const correct = facts.length % 3;
    topicsToCompare.splice(correct, 0, row.topic);
    facts.push({
      id: `news:event:${row.id}`, category_id: "geopolitics", type: "mcq", difficulty: "intermediate",
      family: "actualite:enjeu", competency: "Identifier le sujet économique d’un communiqué",
      prompt: `À quel sujet économique se rapporte ce communiqué du ${row.date} ? « ${row.title} »`,
      options: topicsToCompare, correct, tolerance_pct: null, explanation: row.context, wrong_explanations: null,
      source: row.source, source_url: row.url, kind: "conjunctural", reference_date: row.date,
    });
    if (/accord provisoire|provisional agreement|accord politique provisoire/i.test(row.context)) {
      facts.push({
        id: `news:stage:${row.id}`, category_id: "geopolitics", type: "mcq", difficulty: "advanced",
        family: "actualite:etape", competency: "Distinguer accord politique et texte en vigueur",
        prompt: `Quelle étape le communiqué du ${row.date} annonçait-il ? « ${row.title} »`,
        options: ["Entrée en vigueur définitive", "Accord provisoire", "Décision d’une juridiction"], correct: 1, tolerance_pct: null,
        explanation: row.context, wrong_explanations: null, source: row.source, source_url: row.url, kind: "conjunctural", reference_date: row.date,
      });
    }
  }
  return facts;
}

export async function fetchNews(): Promise<NewsData | null> {
  const res = await fetch("/api/donnees?type=actualite", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json() as NewsData;
  return Array.isArray(data.events) && Array.isArray(data.leaders) ? data : null;
}
