import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { parseNumber, checkNumeric, correctLabel, withBankTolerance } = await import("../src/lib/quiz.ts");
const { mentalQuestion } = await import("../src/lib/mental.ts");
const { dailyQuestions } = await import("../src/lib/guest.ts");
const { MODULES, computeStatuses } = await import("../src/lib/modules.ts");
const { moduleQuestions } = await import("../src/lib/moduleQuestions.ts");
const { gameSeconds } = await import("../src/lib/quizSession.ts");
const { buildMacroQuestions } = await import("../src/lib/macroQuestions.ts");
const { isFresh, isVerifiedMacro } = await import("../src/lib/macro.ts");
const { hasFreshMarketCaps } = await import("../src/lib/marketcaps.ts");
const { readMacroSnapshot } = await import("../src/lib/dataSnapshots.ts");
const { isAtLeastAsRecent } = await import("../src/lib/dataFreshness.ts");
const { GET: marketDataRoute } = await import("../src/app/api/donnees/route.ts");
const guestPool = JSON.parse(readFileSync(new URL("../public/data/guest-questions.json", import.meta.url), "utf8"));

test("saisie numérique française, finie et correctement groupée", () => {
  assert.equal(parseNumber("−1 234,50 %"), -1234.5);
  assert.equal(parseNumber("+0,15"), 0.15);
  assert.equal(parseNumber("1 2"), null);
  assert.equal(parseNumber("1/0"), null);
  assert.equal(parseNumber("9".repeat(400)), null);
  assert.equal(checkNumeric({ correct: -100, tolerance_pct: 5 }, -105), true);
  assert.equal(checkNumeric({ correct: 0, tolerance_pct: 10 }, 0.01), false);
});

test("calculs approchés plus souples et conversions exactes", () => {
  const weight = mentalQuestion(5, () => 0, "ordres");
  assert.equal(weight.correct, 5);
  assert.equal(weight.tolerance_pct, 8);
  for (const rounded of [4.6, 4.7, 5.4]) assert.equal(checkNumeric(weight, rounded), true);
  for (const wrong of [4.59, 5.41, -5]) assert.equal(checkNumeric(weight, wrong), false);
  assert.match(correctLabel(weight), /accepté de 4,6 à 5,4 %/);
  assert.equal(checkNumeric(guestPool.find((q) => q.id === "guest:003"), 4.7), true);

  const precise = mentalQuestion(1, () => 0, "bps");
  assert.equal(precise.tolerance_pct, 0);
  assert.equal(checkNumeric(precise, precise.correct + 0.01), false);
  const multiplication = mentalQuestion(1, () => 0, "multiplications");
  assert.equal(checkNumeric(multiplication, multiplication.correct + 1), false);

  const duration = mentalQuestion(4, () => 0, "bps");
  assert.equal(duration.correct, -0.75);
  assert.equal(checkNumeric(duration, -0.78), true);
  assert.equal(checkNumeric(duration, 0.75), false);
});

test("les modules et l’ancienne banque utilisent des marges adaptées à la consigne", () => {
  const exercises = moduleQuestions(MODULES.find((m) => m.id === "d2"), 10);
  const weight = exercises.find((q) => q.prompt.includes("Estime son poids"));
  assert.equal(checkNumeric(weight, weight.correct * 1.06), true);
  const cap = exercises.find((q) => q.prompt.includes("Quelle est la capitalisation"));
  assert.equal(cap.tolerance_pct, 0);

  const previous = { ...weight, prompt: "Quel est le poids de la société dans la capitalisation totale ?", tolerance_pct: 1 };
  assert.equal(withBankTolerance(previous).tolerance_pct, 8);
  assert.equal(withBankTolerance(withBankTolerance(previous)).tolerance_pct, 8);
  const estimate = { ...previous, type: "guesstimate", prompt: "Dépense annuelle totale ?", tolerance_pct: null };
  assert.equal(withBankTolerance(estimate).tolerance_pct, 15);
  assert.equal(withBankTolerance({ ...estimate, tolerance_pct: 20 }).tolerance_pct, 20);
  assert.equal(withBankTolerance({ ...estimate, prompt: "Calcule la dépense totale. Arrondis au centime.", tolerance_pct: 0 }).tolerance_pct, 0);
  assert.equal(withBankTolerance({ ...previous, kind: "conjunctural" }).tolerance_pct, 1);
});

test("les capitalisations débutant mêlent culture de marché, estimations datées et calculs", () => {
  const lesson = MODULES.find((m) => m.id === "d2");
  const collected = "2026-11-23T10:00:00Z";
  const now = Date.parse("2026-11-23T11:00:00Z");
  const rows = [
    ["AAPL", "Apple", 4_123], ["MC.PA", "LVMH", 360], ["OR.PA", "L’Oréal", 245],
    ["SU.PA", "Schneider Electric", 170], ["AI.PA", "Air Liquide", 115], ["AIR.PA", "Airbus", 400],
    ...Array.from({ length: 4 }, (_, i) => [`T${i}`, `Société ${i}`, 50]),
  ];
  const caps = {
    updated_at: collected, checked_at: collected, source: "Collecte de test", failed: [],
    items: rows.map(([ticker, name, cap]) => ({ ticker, name, market_cap_usd: cap * 1e9, price_date: "2026-11-23", currency: "USD" })),
  };
  const questions = moduleQuestions(lesson, 10, caps, now);
  assert.equal(questions.length, 10);
  assert.equal(questions.filter((q) => q.type === "mcq").length, 6);
  assert.ok(questions.some((q) => q.prompt.includes("deux grandes")));
  const apple = questions.find((q) => q.prompt.includes("500 Md$"));
  assert.equal(apple.correct, 4_123);
  assert.equal(apple.source, caps.source);
  assert.equal(apple.reference_date, "2026-11-23");
  for (const value of [3_623, 4_623]) assert.equal(checkNumeric(apple, value), true);
  for (const value of [3_622, 4_624]) assert.equal(checkNumeric(apple, value), false);
  const france = questions.find((q) => q.prompt.includes("quatre valeurs françaises"));
  assert.equal(france.options[france.correct], "LVMH");
  assert.ok(!france.options.includes("Airbus"));
  const practice = moduleQuestions(lesson, 3, caps, now);
  assert.equal(practice.length, 3);
  assert.ok(practice.some((q) => q.prompt.includes("500 Md$")));
  assert.ok(practice.some((q) => q.prompt.includes("deux grandes")));

  const stale = moduleQuestions(lesson, 10, caps, Date.parse("2026-11-23T16:00:00Z"));
  assert.equal(stale.length, 10);
  assert.equal(stale.filter((q) => q.type === "mcq").length, 7);
  assert.ok(stale.every((q) => q.kind === "structural"));
});

test("le défi du jour partage une série stable de dix questions", () => {
  const date = "2026-11-22";
  const first = dailyQuestions(guestPool, date);
  assert.equal(first.length, 10);
  assert.deepEqual(first, dailyQuestions([...guestPool].reverse(), date));
  assert.notDeepEqual(first, dailyQuestions(guestPool, "2026-11-23"));
  assert.equal(guestPool.find((q) => q.id === "guest:017").correct, false);
});

test("les 22 modules disposent chacun de dix questions jouables", () => {
  assert.equal(MODULES.length, 22);
  for (const lesson of MODULES) {
    assert.ok(lesson.ready && lesson.points.length, lesson.id);
    const questions = moduleQuestions(lesson, 10);
    assert.equal(questions.length, 10, lesson.id);
    assert.equal(new Set(questions.map((q) => q.prompt)).size, 10, lesson.id);
    assert.ok(questions.every((q) => Number.isFinite(q.correct) && q.difficulty === lesson.level), lesson.id);
  }
  const passed = { d1: { passed: true, best_pct: 70, attempts: 1 } };
  assert.equal(computeStatuses({}, null).d2, "locked");
  assert.equal(computeStatuses(passed, null).d2, "open");
  assert.equal(computeStatuses({}, "avance").a1, "open");
  assert.equal(gameSeconds("calcul", 4), 30);
});

test("les observations futures ou mal datées sont écartées et le Brent/WTI se compare à date égale", () => {
  const now = Date.parse("2026-11-22T08:00:00Z");
  const oil = {
    label: "Brent", value: 92.94, unit: "$/baril", ref_date: "2026-11-21",
    source: "EIA via FRED", max_age_days: 7, frequency: "daily", retrieved_at: "2026-11-22T07:30:00Z",
  };
  assert.equal(isFresh({ ...oil, ref_date: "2026-11-23" }, now), false);
  assert.equal(isFresh({ ...oil, ref_date: "2026-11-22" }, now), true);
  const sameDate = { updated_at: null, indicators: { brent: oil, wti: { ...oil, label: "WTI", value: 89 } } };
  const otherDate = { ...sameDate, indicators: { ...sameDate.indicators, wti: { ...sameDate.indicators.wti, ref_date: "2026-11-20" } } };
  assert.ok(buildMacroQuestions(sameDate, now).some((q) => q.id.startsWith("macro:tf_brent_wti")));
  assert.ok(!buildMacroQuestions(otherDate, now).some((q) => q.id.startsWith("macro:tf_brent_wti")));
});

test("les données de marché conservent leurs dates et sortent des quiz quand la collecte échoue", () => {
  const monday = Date.parse("2026-11-23T01:00:00Z");
  const collected = "2026-11-20T23:32:00Z";
  const data = {
    updated_at: collected, checked_at: collected, failed: [], source: "Yahoo Finance",
    items: Array.from({ length: 10 }, (_, n) => ({ ticker: `T${n}`, price_date: "2026-11-20", currency: "USD" })),
  };
  assert.equal(hasFreshMarketCaps(data, monday), true);
  assert.equal(hasFreshMarketCaps({ ...data, refresh_failed: true }, monday), false);
  assert.equal(hasFreshMarketCaps(data, Date.parse("2026-11-23T05:00:00Z")), false);
  assert.equal(hasFreshMarketCaps({ ...data, items: [{ currency: "EUR", price_date: "2026-11-20" }, ...data.items] }, monday), false);
});

test("l’API et les quiz préfèrent la publication contrôlée au fichier embarqué", async (t) => {
  const now = Date.parse("2026-11-22T22:30:00Z");
  t.mock.method(Date, "now", () => now);
  const checked = "2026-11-22T22:17:00Z";
  const publication = {
    updated_at: checked, checked_at: checked, failed: [],
    indicators: {
      eurusd: { value: 1.099, unit: "", label: "EUR/USD", source: "BCE", ref_date: "2026-11-20", max_age_days: 7, retrieved_at: checked },
    },
  };
  let payload = publication;
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.match(String(url), /\/data-live\/public\/data\/macro\.json$/);
    return Response.json(payload);
  });
  const route = await marketDataRoute(new Request("https://example.invalid/api/donnees?type=macro"));
  assert.deepEqual(await route.json(), await readMacroSnapshot());
  assert.ok(buildMacroQuestions(publication, now).length);

  payload = { ...publication, failed: ["eurusd"], checked_at: "2026-11-22T22:29:00Z" };
  const interrupted = await readMacroSnapshot();
  assert.equal(isAtLeastAsRecent(interrupted, publication), true);
  assert.equal(isAtLeastAsRecent(publication, interrupted), false);
  assert.equal(interrupted.indicators.eurusd.ref_date, "2026-11-20");
  assert.equal(isVerifiedMacro(interrupted, "eurusd", now), false);
  assert.equal(buildMacroQuestions(interrupted, now).length, 0);
  assert.equal(isVerifiedMacro(publication, "eurusd", now + 4 * 3_600_000), false);

  payload = { ...publication, indicators: { eurusd: { ...publication.indicators.eurusd, ref_date: "2026-11-30" } } };
  assert.notEqual((await readMacroSnapshot()).checked_at, checked);
  const badRequest = await marketDataRoute(new Request("https://example.invalid/api/donnees?type=inconnu"));
  assert.equal(badRequest.status, 400);
});
