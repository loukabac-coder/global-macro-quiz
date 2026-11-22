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
const { parseNumber, checkNumeric } = await import("../src/lib/quiz.ts");
const { dailyQuestions } = await import("../src/lib/guest.ts");
const { MODULES, computeStatuses } = await import("../src/lib/modules.ts");
const { moduleQuestions } = await import("../src/lib/moduleQuestions.ts");
const { gameSeconds } = await import("../src/lib/quizSession.ts");
const { buildMacroQuestions } = await import("../src/lib/macroQuestions.ts");
const { isFresh } = await import("../src/lib/macro.ts");
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
    source: "EIA via FRED", max_age_days: 7, frequency: "daily",
  };
  assert.equal(isFresh({ ...oil, ref_date: "2026-11-23" }, now), false);
  assert.equal(isFresh({ ...oil, ref_date: "2026-11-22" }, now), true);
  const sameDate = { updated_at: null, indicators: { brent: oil, wti: { ...oil, label: "WTI", value: 89 } } };
  const otherDate = { ...sameDate, indicators: { ...sameDate.indicators, wti: { ...sameDate.indicators.wti, ref_date: "2026-11-20" } } };
  assert.ok(buildMacroQuestions(sameDate, now).some((q) => q.id.startsWith("macro:tf_brent_wti")));
  assert.ok(!buildMacroQuestions(otherDate, now).some((q) => q.id.startsWith("macro:tf_brent_wti")));
});
