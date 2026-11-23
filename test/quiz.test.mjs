import assert from "node:assert/strict";
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
const { parseNumber, checkNumeric, correctLabel } = await import("../src/lib/quiz.ts");
const { mentalDifficulty, mentalQuestion, mentalSession, TOPICS } = await import("../src/lib/mental.ts");
const { answerScales, parseNumericAnswer } = await import("../src/lib/quizUnits.ts");
const { mulberry32 } = await import("../src/lib/rng.ts");
const { dailyQuestions, guestQuick } = await import("../src/lib/guest.ts");
const { MODULES, computeStatuses } = await import("../src/lib/modules.ts");
const { moduleQuestions } = await import("../src/lib/moduleQuestions.ts");
const { buildMacroQuestions } = await import("../src/lib/macroQuestions.ts");
const { isFresh, isVerifiedMacro } = await import("../src/lib/macro.ts");
const { hasFreshMarketCaps } = await import("../src/lib/marketcaps.ts");
const { readMacroSnapshot } = await import("../src/lib/dataSnapshots.ts");
const { isAtLeastAsRecent } = await import("../src/lib/dataFreshness.ts");
const { GET: marketDataRoute } = await import("../src/app/api/donnees/route.ts");
const { drawExam, EXAM_SIZE } = await import("../src/lib/exam.ts");
const { matchesKeywords, searchText } = await import("../src/lib/searchText.ts");
const { loadQuick, loadPlacement, loadScopedTraining, loadTraining, loadTrainingByHistory, loadWeakness } = await import("../src/lib/loaders.ts");
const { CURRICULUM, curriculumQuestions, isCurrentFavorite } = await import("../src/lib/curriculum/catalog.ts");
const { CHAPTERS, getChapter } = await import("../src/lib/courses.ts");
const { buildLiveQuestions } = await import("../src/lib/liveQuestions.ts");
const { CATS } = await import("../src/lib/categories.ts");
const { GROUPS, LEVELS: PROGRAM_LEVELS, canAttempt, getMilestone, hasPassed, levelOpen, milestone, milestoneSize, unitsAt } = await import("../src/lib/program.ts");
const { milestoneDraw, newMilestoneDraw, diverseDraw } = await import("../src/lib/drawQuestions.ts");
const { lessonsFor, legacyLessonHref } = await import("../src/lib/courseTree.ts");
const { buildNewsQuestions } = await import("../src/lib/news.ts");
const { buildStudyQuestions, memoryDraw, stableReferenceKey } = await import("../src/lib/studyQuestions.ts");
const { buildStudyView } = await import("../src/lib/studyReferences.ts");
const { mentalMethod, questionCourseHref } = await import("../src/lib/quizLearning.ts");
const { isMarketPriceEstimate, isObservedMarketRecall, marketScope } = await import("../src/lib/marketRecall.ts");

test("un cours, une correction et une série à revoir partagent la même observation révisée", () => {
  const now = Date.parse("2026-11-23T19:00:00Z");
  const checked = "2026-11-23T18:00:00Z";
  const gdp = { label: "PIB nominal · France", value: 3366.315927, unit: "Md$", frequency: "annual",
    ref_date: "2025-01-01", source: "Banque mondiale", retrieved_at: checked, max_age_days: 1100 };
  const sources = {
    macro: { updated_at: checked, indicators: { gdp_fra: gdp }, failed: [] },
    caps: { updated_at: null, items: [], failed: [], source: "Marché" },
    news: { updated_at: null, events: [], leaders: [], failed: [] },
    production: { updated_at: null, tables: {}, failed: [] },
  };
  const row = buildStudyView(sources, "macro/pib", now).tables[0].rows[0];
  const first = buildStudyQuestions(sources, now).find((q) => q.reference_key === "macro:gdp_fra");
  assert.equal(row.checked, checked);
  assert.equal(row.period, "2025");
  assert.equal(row.eligible, true);
  assert.match(row.exact, /3366,315927|3\s366,315927/);
  assert.equal(first.reference_href, `/cours/macro/pib/chiffres#${row.id}`);
  assert.equal(first.correct, gdp.value);
  assert.equal(first.tolerance_pct, 15);
  const memory = memoryDraw(sources, "macro/pib", now);
  assert.equal(memory.length, 5);
  assert.equal(memory.find((q) => q.id === first.id)?.correct, gdp.value);

  const revised = { ...sources, macro: { ...sources.macro, indicators: { gdp_fra: { ...gdp, value: 3390 } } } };
  const second = buildStudyQuestions(revised, now).find((q) => q.reference_key === first.reference_key);
  assert.equal(second.correct, 3390);
  assert.equal(first.correct, 3366.315927);
  assert.equal(stableReferenceKey(first.id), stableReferenceKey("macro:gdp_fra:2026-01-01"));

  const later = now + 3 * 86_400_000;
  assert.equal(buildStudyView(sources, "macro/pib", later).tables[0].rows[0].eligible, false);
  assert.equal(memoryDraw(sources, "macro/pib", later).some((q) => q.id === first.id), false);
});

test("la période mensuelle reste éligible après un contrôle récent si le mois suivant manque", () => {
  const now = Date.parse("2026-11-23T19:00:00Z");
  const stamp = "2026-11-23T18:00:00Z";
  const latest = { label: "IPC-U", value: 3.7, unit: "%", ref_date: "2026-09-01", frequency: "monthly",
    source: "BLS via FRED", max_age_days: 65, retrieved_at: stamp };
  const snapshot = { updated_at: stamp, indicators: { us_cpi_yoy: latest }, failed: [] };
  assert.equal(isVerifiedMacro(snapshot, "us_cpi_yoy", now), true);
  assert.ok(buildMacroQuestions(snapshot, now).some((q) => q.id === "macro:us_cpi_yoy:2026-09-01"));
  assert.equal(isVerifiedMacro(snapshot, "us_cpi_yoy", now + 3 * 86_400_000), false);
});

test("un identifiant de tableau commun ne mélange pas les repères de deux cours", () => {
  const now = Date.parse("2026-11-23T19:00:00Z");
  const stamp = "2026-11-23T18:00:00Z";
  const indicators = {};
  for (const [i, code] of ["fra", "deu", "ita"].entries()) {
    indicators[`gdp_${code}`] = { ref_date: "2025-01-01", label: `PIB nominal · ${code}`, value: 100 * (i + 1),
      unit: "Md$", frequency: "annual", retrieved_at: stamp, max_age_days: 1100, source: "Banque mondiale" };
  }
  for (const [i, code] of ["cac", "sp500", "nasdaq100", "dax", "ftse"].entries()) {
    indicators[`index_${code}`] = { ref_date: "2026-11-23", label: code, value: 100 * (i + 1),
      unit: "points", frequency: "daily", retrieved_at: stamp, max_age_days: 7, source: "Marché" };
  }
  const sources = {
    macro: { updated_at: stamp, indicators },
    caps: { updated_at: null, items: [], failed: [], source: "Marché" },
    news: { updated_at: null, events: [], leaders: [], failed: [] },
    production: { updated_at: null, tables: {}, failed: [] },
  };
  assert.ok(buildStudyQuestions(sources, now).some((q) => q.reference_href === "/cours/macro/pib/chiffres#observations-1"));
  const memory = memoryDraw(sources, "reperes/indices", now);
  assert.equal(memory.length, 5);
  assert.ok(memory.every((q) => q.reference_href?.startsWith("/cours/reperes/indices/chiffres#macro-index_")));
});

test("le sélecteur normalise les montants avant d’appliquer la tolérance", () => {
  const euros = { type: "numeric", options: { unit: "€" }, correct: 2_500_000, tolerance_pct: 0 };
  const millions = { ...euros, options: { unit: "M€" }, correct: 2.5 };
  const longMillions = { ...euros, options: { unit: "millions d’€" }, correct: 2.5 };
  const milliards = { ...euros, options: { unit: "Md€" }, correct: 0.0025 };
  for (const q of [euros, millions, longMillions, milliards]) {
    for (const [raw, power] of [["2 500 000", 0], ["2 500", 3], ["2,5", 6], ["0,0025", 9]]) {
      assert.equal(parseNumericAnswer(q, raw, power), q.correct);
      assert.equal(checkNumeric(q, parseNumericAnswer(q, raw, power)), true);
    }
  }
  assert.equal(parseNumericAnswer(millions, "2,5", null), 2.5);
  assert.equal(parseNumericAnswer(euros, "10 %", 0), null);
  assert.equal(parseNumericAnswer(euros, "2 5", 6), null);
  assert.equal(parseNumericAnswer(euros, "1", 12), null);
  assert.equal(parseNumericAnswer(euros, "9".repeat(400), 9), null);
  assert.equal(parseNumericAnswer(euros, "−2,5", 6), -2_500_000);
  assert.equal(parseNumericAnswer(euros, "4,56789123", 6), 4_567_891.23);
  assert.deepEqual(answerScales(millions).options.map((option) => option.label), ["€", "milliers d’€", "millions d’€", "milliards d’€"]);

  const estimate = { type: "guesstimate", options: { unit: "Md$" }, correct: 4123, tolerance_pct: 100 * 500 / 4123 };
  assert.equal(checkNumeric(estimate, parseNumericAnswer(estimate, "3 623 000", 6)), true);
  assert.equal(checkNumeric(estimate, parseNumericAnswer(estimate, "3 622 000", 6)), false);
  assert.equal(parseNumericAnswer({ ...euros, options: { unit: "milliers" } }, "1,5", 6), 1500);
  assert.equal(parseNumericAnswer({ ...euros, options: { unit: "T$" } }, "2500", 9), 2.5);
  assert.equal(answerScales({ ...euros, options: { unit: "T$" } }).referencePower, 12);
  for (const unit of ["%", "pb", "points", "×", "ans", "USD par EUR", "$/baril", "€ par baril", ""]) {
    assert.equal(answerScales({ ...euros, options: { unit } }), null, unit);
  }
  assert.equal(parseNumericAnswer({ ...euros, options: { unit: "%" } }, "4,5 %", null), 4.5);
  assert.equal(answerScales({ ...euros, type: "mcq" }), null);
});

test("le calcul mental intermédiaire reste au bon niveau et corrige des exercices courts", () => {
  const checkInterest = (q) => {
    const match = q.prompt.match(/([\d  ]+) € à (\d+) % par an en intérêts (simples|composés) pendant deux ans/);
    assert.ok(match, q.prompt);
    const principal = Number(match[1].replace(/\s/g, ""));
    const rate = Number(match[2]) / 100;
    const expected = match[3] === "simples" ? 2 * principal * rate : principal * (1 + rate) ** 2;
    assert.ok(Math.abs(q.correct - expected) < 1e-8, q.prompt);
    assert.match(q.explanation, /10 %|deux fois|Divise par 10/);
  };
  const checkVariation = (q) => {
    const amounts = q.prompt.match(/passe de ([\d  ]+) à ([\d  ]+)/);
    if (amounts) {
      const [before, after] = amounts.slice(1).map((n) => Number(n.replace(/\s/g, "")));
      assert.ok(Number.isInteger(before) && Number.isInteger(after));
      assert.ok(Math.abs(q.correct - (after - before) / before * 100) < 1e-9);
      assert.ok([5, 10, 20, 25, 50].includes(Math.abs(q.correct)));
    } else {
      const steps = [...q.prompt.matchAll(/([+-]\d+) %/g)].map((match) => Number(match[1]));
      assert.equal(steps.length, 2);
      assert.ok(Math.abs(q.correct - (steps.reduce((total, n) => total * (1 + n / 100), 1) - 1) * 100) < 1e-9);
      assert.match(q.explanation, /Pars de 100/);
    }
  };
  for (const level of [2, 3]) {
    for (const { id } of TOPICS) {
      for (const seed of [18, 73, 101]) {
        const questions = mentalSession(12, level, mulberry32(seed), id);
        assert.equal(questions.length, 12, id);
        assert.ok(questions.every((q) => q.difficulty === "intermediate"), id);
        if (id === "interets") questions.forEach(checkInterest);
        if (id === "variations") questions.forEach(checkVariation);
      }
    }
  }
  assert.doesNotMatch(mentalQuestion(2, () => 0, "variations").prompt, /puis/);
  const advancedInterest = mentalQuestion(5, () => 0, "interets");
  assert.match(advancedInterest.prompt, /deux ans/);
  assert.equal(advancedInterest.correct, 41);
  const fixed = CURRICULUM.filter((q) => q.moduleId === "i1");
  assert.ok(fixed.filter((q) => q.id.includes("interets")).every((q) => q.prompt.includes("deux ans")));
  assert.equal(fixed.find((q) => q.id.endsWith(":compose-deux-ans")).correct, 1210);
  assert.equal(fixed.find((q) => q.id.endsWith(":variation-baisse")).correct, -10);
});

test("un examen couvre les sept thèmes en donnant la priorité aux questions nouvelles", () => {
  const subjects = [
    ["macroeconomics", "PIB"], ["financial-markets", "Courbe des taux"],
    ["financial-markets", "Obligation à coupon"], ["fx", "Parité de change"],
    ["market-caps", "Action cotée"], ["financial-markets", "Option sur action"],
    ["monetary-policy", "Politique monétaire"],
  ];
  const bank = subjects.flatMap(([category_id, subject], t) => Array.from({ length: 7 }, (_, i) => ({
    id: `${t}-${i}`, category_id, prompt: `${subject} ${i}`, type: "numeric", correct: 1, explanation: "Correction",
    difficulty: i % 2 === 0 ? "intermediate" : "advanced",
  })));
  const invalid = [
    { ...bank[0], id: "duplicate" },
    { ...bank[1], id: "uncorrected", prompt: "Entrée sans correction", explanation: "" },
    { ...bank[2], id: "beginner", prompt: "Entrée débutante", difficulty: "beginner" },
    { ...bank[3], id: "expert", prompt: "Entrée experte", difficulty: "expert" },
  ];
  const one = drawExam([...bank, ...invalid], []);
  assert.equal(one.available, bank.length);
  assert.equal(one.questions.length, EXAM_SIZE);
  const previous = one.questions.map((question) => question.id);
  const two = drawExam(bank, previous);
  assert.equal(two.questions.length, EXAM_SIZE);
  assert.equal(two.questions.some((q) => previous.includes(q.id)), false);
  assert.equal(new Set(two.questions.map((q) => q.id.split("-")[0])).size, subjects.length);
  const restricted = drawExam(bank.filter((q) => q.id.startsWith("1-") ? q.id === "1-0" : true), ["1-0"]);
  assert.equal(restricted.questions.filter((q) => q.id === "1-0").length, 1);
  const missing = drawExam(bank.filter((q) => !q.id.startsWith("2-")), []);
  assert.deepEqual(missing.questions, []);
  assert.deepEqual(missing.missing, ["obligations"]);
  assert.deepEqual(drawExam(bank.filter((q) => Number(q.id.at(-1)) < 2), []).questions, []);
});

test("la recherche retrouve plusieurs mots indépendamment des accents et de la casse", () => {
  const index = searchText("Le coût du change et la mise en œuvre d’une politique monétaire");
  assert.equal(matchesKeywords(index, "  MONETAIRE coût "), true);
  assert.equal(matchesKeywords(index, "oeuvre"), true);
  assert.equal(matchesKeywords(index, "coût obligations"), false);
});

test("le filtre historique combine le thème, le niveau et l’identifiant pédagogique", async () => {
  const [one, two] = curriculumQuestions({ categories: ["fx"], levels: ["intermediate"] });
  const [otherLevel] = curriculumQuestions({ categories: ["fx"], levels: ["advanced"] });
  const [otherCategory] = curriculumQuestions({ categories: ["market-caps"], levels: ["intermediate"] });
  const db = {
    rpc(name) {
      assert.equal(name, "quiz_answer_history");
      const rows = [
        { question_key: one.id, was_correct: true }, { question_key: two.id, was_correct: false },
        { question_key: otherLevel.id, was_correct: false }, { question_key: otherCategory.id, was_correct: false },
        { question_key: "32", was_correct: false },
      ];
      return {
        order() { return this; },
        async range(start, end) { return { data: rows.slice(start, end + 1), error: null }; },
      };
    },
  };
  const correct = await loadTrainingByHistory(db, ["fx"], ["intermediate"], "correct");
  const incorrect = await loadTrainingByHistory(db, ["fx"], ["intermediate"], "incorrect");
  const unseen = await loadTrainingByHistory(db, ["fx"], ["intermediate"], "unseen");
  assert.deepEqual(correct.map((q) => q.id), [one.id]);
  assert.deepEqual(incorrect.map((q) => q.id), [two.id]);
  assert.equal(unseen.length, 10);
  assert.ok(unseen.every((q) => q.category_id === "fx" && q.difficulty === "intermediate" && ![one.id, two.id].includes(q.id)));
});

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
  assert.equal(checkNumeric(CURRICULUM.find((q) => q.id === "course:i2:market-caps:poids"), 4.7), true);

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

test("les marges gardent les poids approchés distincts des conversions exactes", () => {
  const weight = CURRICULUM.find((q) => q.id === "course:i2:market-caps:poids");
  assert.equal(checkNumeric(weight, weight.correct * 1.06), true);
  assert.equal(checkNumeric(weight, weight.correct * 1.09), false);
  const cap = CURRICULUM.find((q) => q.id === "course:d2:market-caps:cap");
  assert.equal(cap.tolerance_pct, 0);
  assert.equal(checkNumeric(cap, cap.correct + 1), false);
});

test("la banque historique de capitalisations démarre à l’intermédiaire", () => {
  const collected = "2026-11-23T10:00:00Z";
  const now = Date.parse("2026-11-23T11:00:00Z");
  const rows = [
    ["AAPL", "Apple", 4_123], ["MC.PA", "LVMH", 360], ["OR.PA", "L’Oréal", 245],
    ["SU.PA", "Schneider Electric", 170], ["AI.PA", "Air Liquide", 115], ["AIR.PA", "Airbus", 400], ["SAF.PA", "Safran", 110],
    ...Array.from({ length: 4 }, (_, i) => [`T${i}`, `Société ${i}`, 50]),
  ];
  const caps = {
    updated_at: collected, checked_at: collected, source: "Collecte de test", failed: [],
    items: rows.map(([ticker, name, cap]) => ({
      ticker, name, market_cap_usd: cap * 1e9, price_date: "2026-11-23", currency: "USD",
      country: ticker.endsWith(".PA") ? "France" : "États-Unis", region: ticker.endsWith(".PA") ? "Europe" : "Amérique du Nord",
    })),
  };
  assert.equal(hasFreshMarketCaps(caps, now), true);
  const live = buildLiveQuestions(caps, now);
  assert.ok(live.every((q) => q.kind === "conjunctural" && q.difficulty !== "beginner" && q.reference_date));
  assert.ok(milestoneDraw(getMilestone("d2"), live).every((q) => q.kind === "structural"));
  const apple = live.find((q) => q.id.startsWith("live:AAPL:"));
  assert.equal(apple.correct, 4_123);
  assert.equal(apple.source, caps.source);
  assert.equal(apple.reference_date, "2026-11-23");
  for (const value of [3_623, 4_623]) assert.equal(checkNumeric(apple, value), true);
  for (const value of [3_622, 4_624]) assert.equal(checkNumeric(apple, value), false);
  const france = live.find((q) => q.id.startsWith("live:fr:top-three:"));
  assert.equal(france.options[france.correct], "LVMH, L’Oréal, Schneider Electric");
  assert.ok(france.options.every((option) => !option.includes("Airbus")));
  assert.equal(hasFreshMarketCaps(caps, Date.parse("2026-11-25T16:00:00Z")), false);
});

test("le défi du jour partage une série stable de dix questions", () => {
  const date = "2026-11-22";
  const first = dailyQuestions(CURRICULUM, date);
  assert.equal(first.length, 10);
  assert.deepEqual(first, dailyQuestions([...CURRICULUM].reverse(), date));
  assert.notDeepEqual(first, dailyQuestions(CURRICULUM, "2026-11-23"));
  assert.deepEqual(PROGRAM_LEVELS.map(({ id }) => first.filter((q) => q.difficulty === id).length), [4, 4, 2]);
});

test("les 22 étapes historiques conservent une fiche et leurs règles de lecture", () => {
  assert.equal(MODULES.length, 22);
  for (const lesson of MODULES) {
    assert.ok(lesson.ready && lesson.points.length, lesson.id);
    const questions = moduleQuestions(lesson, 10);
    assert.equal(questions.length, 10, lesson.id);
    assert.equal(new Set(questions.map((q) => q.prompt)).size, 10, lesson.id);
    assert.ok(questions.every((q) => Number.isFinite(q.correct) && q.difficulty === (lesson.level === "expert" ? "advanced" : lesson.level)), lesson.id);
  }
  const passed = { d1: { passed: true, best_pct: 70, attempts: 1 } };
  assert.equal(computeStatuses({}, null).d2, "locked");
  assert.equal(computeStatuses(passed, null).d3, "open");
  assert.equal(computeStatuses(passed, null).d2, "locked");
  assert.equal(computeStatuses({ ...passed, d3: passed.d1 }, null).d2, "open");
  assert.equal(computeStatuses({}, "avance").a1, "open");
});

test("la banque pédagogique couvre la grille et relie chaque question à un module", () => {
  const keys = new Set();
  const prompts = new Set();
  for (const question of CURRICULUM) {
    const group = GROUPS.find((item) => item.no === question.groupNo);
    assert.ok(group?.units.some((unit) => unit.slug === question.unitSlug), question.id);
    assert.ok(PROGRAM_LEVELS.some((level) => level.id === question.difficulty), question.id);
    assert.ok(question.family && question.competency, question.id);
    assert.ok(question.id.startsWith("course:") && question.id.length <= 64 && !keys.has(question.id), question.id);
    assert.ok(!prompts.has(searchText(question.prompt)), question.id);
    assert.ok(question.explanation.trim(), question.id);
    assert.ok(question.kind === "structural" && question.reference_date === null, question.id);
    if (question.type === "numeric") {
      assert.ok(Number.isFinite(question.correct) && question.tolerance_pct >= 0, question.id);
    } else if (question.type === "true_false") {
      assert.equal(typeof question.correct, "boolean", question.id);
    } else {
      assert.ok(question.options[question.correct] && new Set(question.options).size === question.options.length, question.id);
    }
    keys.add(question.id);
    prompts.add(searchText(question.prompt));
  }
  for (const [category] of CATS) {
    for (const { id: level } of PROGRAM_LEVELS) {
      const pool = curriculumQuestions({ categories: [category], levels: [level] });
      const specialized = ["central-banks", "fx", "commodities"].includes(category);
      assert.ok(pool.length >= (specialized && level !== "beginner" ? 15 : 8), category + " · " + level);
    }
  }
  const authored = CURRICULUM.filter((q) => q.origin === "editorial");
  assert.ok(authored.length >= 1_200);
  for (const group of GROUPS) {
    for (const { id } of PROGRAM_LEVELS) {
      assert.ok(authored.filter((q) => q.groupNo === group.no && q.difficulty === id).length >= 50, `${group.no} · ${id}`);
    }
  }
  for (const lesson of MODULES) {
    for (const slug of (lesson.chapters ?? [lesson.chapter])) assert.ok(getChapter(slug), lesson.id);
  }
  assert.equal(new Set(CHAPTERS.map((c) => c.slug)).size, CHAPTERS.length);
  assert.ok(CHAPTERS.every((c) => !("minutes" in c)));

  const numeric = [
    ["course:d1:mental-math:division", 125],
    ["course:i6:fx:cross", 165],
    ["course:a2:central-banks:taylor", 5],
    ["course:e4:fx:carry-net", -1.3],
    ["course:e5:commodities:brent-wti-pnl", -1000],
    ["course:e5:commodities:or-argent", 70],
    ["course:e5:market-caps:ev-tresorerie", 7],
    ["course:e5:macro-guesstimates:segments", 600],
  ];
  for (const [id, correct] of numeric) assert.equal(CURRICULUM.find((q) => q.id === id)?.correct, correct);
});

test("les favoris rendent les questions retirées indisponibles et gardent les questions publiées", () => {
  assert.equal(isCurrentFavorite(CURRICULUM[0]), true);
  assert.equal(isCurrentFavorite({ ...CURRICULUM[0], id: "guest:016" }), false);
  assert.equal(isCurrentFavorite({ ...CURRICULUM[0], id: "module:d4:2" }), false);
  assert.equal(isCurrentFavorite(mentalQuestion(1, () => 0, "pourcentages")), true);
  assert.equal(isCurrentFavorite({
    ...CURRICULUM[0], id: "macro:price:2026-11-23", kind: "conjunctural", reference_date: "2026-11-23",
  }), false);
});

test("les modes jouent avec la même banque et respectent leurs niveaux et formats", async () => {
  const bank = new Set(CURRICULUM.map((q) => q.id));
  const noLive = async () => [];
  const live = [{ ...CURRICULUM[0], difficulty: "beginner", id: "retired:unverified" }];
  const quick = await loadQuick(false, async () => live);
  const mixed = await loadQuick(true, noLive);
  const guest = await guestQuick();
  for (const [draw, size] of [[quick, 10], [mixed, 15], [guest, 5]]) {
    assert.equal(draw.length, size);
    assert.ok(draw.every((q) => bank.has(q.id)));
  }
  assert.ok(quick.slice(0, 6).every((q) => q.difficulty === "beginner"));
  const training = await loadTraining(["fx"], ["advanced"], noLive);
  assert.equal(training.length, 10);
  assert.ok(training.every((q) => q.difficulty === "advanced" && q.category_id === "fx" && bank.has(q.id)));
  assert.equal((await loadTraining(["fx"], ["expert"], noLive)).length, 0);
  const beginners = await loadTraining(["fx", "commodities"], ["beginner"], async () => { throw new Error("Aucune donnée courante requise"); });
  assert.ok(beginners.every((q) => q.difficulty === "beginner" && bank.has(q.id)));
  assert.equal(loadPlacement().length, 12);
  const exam = drawExam(CURRICULUM, []);
  assert.equal(exam.questions.length, EXAM_SIZE);
  const next = drawExam(CURRICULUM, exam.questions.map((q) => q.id));
  assert.ok(next.questions.every((q) => !exam.questions.includes(q)));
});

test("les révisions retrouvent une question du Parcours par son identifiant stable", async () => {
  const reviewed = CURRICULUM.find((q) => q.id === "course:i6:fx:cross");
  const db = {
    from(table) {
      return {
        select() { return this; },
        like() { return this; },
        lte() { return this; },
        order() { return this; },
        eq() { return table === "category_stats" ? { data: [{ category_id: "fx", difficulty: "intermediate", answered: 4, correct: 1 }] } : this; },
        limit() { return { data: [{ question_id: reviewed.id }, { question_id: "retired:123" }] }; },
      };
    },
  };
  const { questions, note } = await loadWeakness(db, "fixture");
  assert.equal(questions.length, 10);
  assert.ok(questions.some((q) => q.id === reviewed.id));
  assert.ok(questions.every((q) => q.category_id === "fx" && q.difficulty === "intermediate"));
  assert.match(note, /1 question/);
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

test("les six modules ont des pages, des tirages complets et des synthèses verrouillées au bon moment", () => {
  const success = { passed: true, best_pct: 80, attempts: 1 };
  const progress = { d1: success, e2: success };
  const seen = new Set();
  assert.equal(GROUPS.length, 6);
  assert.ok(hasPassed(getMilestone("p:b:06:pourcentages"), progress));
  assert.ok(hasPassed(getMilestone("p:a:05:obligations"), progress));
  assert.ok(!canAttempt(getMilestone("p:a:05:obligations"), progress));
  assert.ok(CHAPTERS.every((chapter) => legacyLessonHref(chapter.slug)));
  for (const { id: level } of PROGRAM_LEVELS) {
    assert.ok(levelOpen(level, progress));
    for (const group of GROUPS) {
      const synth = milestone(group, level, null);
      assert.ok(!canAttempt(synth, progress));
      for (const unit of unitsAt(group, level)) {
        assert.ok(lessonsFor(group, unit).length >= 2);
        const stage = milestone(group, level, unit);
        assert.ok(canAttempt(stage, progress));
        const draw = milestoneDraw(stage);
        assert.equal(draw.length, 5, stage.id);
        assert.ok(draw.every((q) => q.difficulty === level && q.groupNo === group.no && q.unitSlug === unit.slug));
        for (const q of draw) seen.add(q.id);
        progress[stage.id] = success;
      }
      assert.ok(canAttempt(synth, progress));
      const draw = milestoneDraw(synth, [], seen);
      assert.equal(draw.length, milestoneSize(synth), synth.id);
      assert.ok(draw.length >= 12 && draw.length <= 15, synth.id);
      assert.ok(new Set(draw.map((q) => q.unitSlug)).size >= 2);
      if (group.no === "06" && level !== "advanced") assert.ok(!levelOpen(level === "beginner" ? "intermediate" : "advanced", progress));
      progress[synth.id] = success;
    }
  }
  assert.equal(Object.keys(progress).filter((id) => id.endsWith(":synthese")).length, 18);
});

test("tous les sous-modules sont accessibles aux trois niveaux en entraînement libre", async () => {
  for (const group of GROUPS) for (const unit of group.units) for (const { id } of PROGRAM_LEVELS) {
    const draw = await loadScopedTraining(null, group.slug, [unit.slug], [id], "all", async () => []);
    assert.ok(draw.length > 0, `${group.slug}/${unit.slug}/${id}`);
    assert.ok(draw.every((q) => q.unitSlug === unit.slug && q.groupNo === group.no && q.difficulty === id));
  }
  const draw = await loadScopedTraining(null, "reperes", ["devises", "indices"], ["advanced"], "all", async () => []);
  assert.ok(draw.every((q) => ["devises", "indices"].includes(q.unitSlug)));
});

test("le PIB débutant renouvelle le tirage et génère des données d’exercice si nécessaire", () => {
  const item = getMilestone("p:b:01:pib");
  const history = [];
  for (let i = 0; i < 3; i++) {
    const questions = newMilestoneDraw(item, [], history);
    assert.equal(questions.length, 5);
    assert.ok(questions.every((q) => q.difficulty === "beginner"));
    if (i) assert.notDeepEqual(questions.map((q) => q.id), history[0].map((q) => q.id));
    for (const q of questions.filter((entry) => entry.type === "mcq")) {
      const original = CURRICULUM.find((entry) => entry.id === q.id);
      assert.equal(correctLabel(q), correctLabel(original));
    }
    history.unshift(questions);
  }
  const old = curriculumQuestions({ levels: ["beginner"] }).filter((q) => q.groupNo === "01" && q.unitSlug === "pib");
  const generated = newMilestoneDraw(item, [], [old]);
  assert.ok(generated.every((q) => q.id.startsWith("gen:pib:beginner:") && mentalMethod(q).length >= 2));
});

test("une estimation de LVMH renvoie à l’entreprise et peut tomber en révision et en entraînement", async () => {
  const checked = "2026-11-23T18:00:00Z";
  const now = Date.parse("2026-11-23T19:00:00Z");
  const sources = {
    macro: { updated_at: checked, indicators: {} },
    caps: { updated_at: checked, failed: [], source: "Marché", items: [{
      ticker: "MC.PA", name: "LVMH", country: "France", region: "Europe", currency: "EUR",
      market_cap_usd: 208e9, price_date: "2026-11-23", fx_date: "2026-11-23", retrieved_at: checked,
    }] },
    news: { updated_at: null, events: [], leaders: [], failed: [] },
    production: { updated_at: null, tables: {}, failed: [] },
  };
  const live = buildStudyQuestions(sources, now);
  const expected = "/cours/reperes/capitalisations/chiffres#cap-MC.PA";
  assert.equal(questionCourseHref(live[0]), expected);
  assert.equal(live[0].reference_href, expected);
  assert.ok(memoryDraw(sources, "reperes/capitalisations", now).some((q) => q.reference_href === expected));
  const draw = await loadScopedTraining(null, "reperes", ["capitalisations"], ["intermediate"], "all", async () => live);
  assert.ok(draw.some((q) => q.reference_href === expected));
  assert.equal(mentalMethod(live[0]), undefined);
  assert.match(mentalMethod({ ...live[0], reference_date: null, type: "numeric", prompt: "Un prix passe de 80 à 100. Quelle variation en % ?",
    options: { unit: "%" }, correct: 25, explanation: "Compare l’écart au prix de départ." }).join(" "), /un quart.*25 %/);
});

test("les repères chiffrés dominent les tirages de marché aux trois niveaux", async () => {
  const [macro, caps, news, production] = await Promise.all(["macro", "market-caps", "actualite", "production"]
    .map(async (name) => (await import(`../public/data/${name}.json`, { with: { type: "json" } })).default));
  const now = Date.parse("2026-11-23T20:00:00Z");
  const sources = { macro, caps, news, production };
  const live = buildStudyQuestions(sources, now);
  for (const { id } of PROGRAM_LEVELS) {
    const example = live.find((q) => q.difficulty === id && /live:MC\.PA(?:~[^:]+)?:/.test(q.id));
    assert.ok(example && isMarketPriceEstimate(example), id);
    assert.equal(example.reference_href, "/cours/reperes/capitalisations/chiffres#cap-MC.PA");
    for (const unit of ["capitalisations", "indices", "devises", "matieres", "producteurs"]) {
      const draw = await loadScopedTraining(null, "reperes", [unit], [id], "all", async () => live);
      assert.equal(draw.length, 10, unit);
      assert.ok(draw.filter(isObservedMarketRecall).length >= 7, `${unit}/${id}`);
      assert.ok(draw.filter(isMarketPriceEstimate).length >= 6, `${unit}/${id}`);
      if (unit === "indices") assert.ok(draw.some((q) => q.family === "indices:composition-indice"), id);
    }
  }
  for (const profile of ["general", "culture", "technique"]) {
    const exam = drawExam([...curriculumQuestions(), ...live], [], profile).questions;
    const market = exam.filter(marketScope);
    assert.equal(exam.length, 20);
    assert.ok(market.length > 0);
    assert.ok(market.filter(isMarketPriceEstimate).length > market.length / 2, profile);
    assert.ok(exam.every((q) => q.difficulty !== "beginner"));
  }
  const old = buildStudyQuestions(sources, now + 72 * 3_600_000);
  assert.ok(old.every((q) => !isMarketPriceEstimate(q)));
  assert.ok(!live.some((q) => q.id.startsWith("production:") && q.id.includes("~") && !q.id.endsWith(q.reference_date.slice(0, 4))));
});

test("les estimations générées réduisent la marge selon le niveau et restent renouvelables", () => {
  for (const [level, tolerance] of [[1, 15], [2, 10], [4, 8]]) {
    const first = mentalSession(12, level, mulberry32(17), "estimations");
    const next = mentalSession(12, level, mulberry32(59), "estimations");
    assert.equal(first.length, 12);
    assert.equal(new Set(first.map((q) => q.id)).size, 12);
    assert.ok(first.every((q) => q.type === "guesstimate" && q.tolerance_pct === tolerance && q.difficulty === mentalDifficulty(level)));
    assert.ok(next.some((q) => !first.some((r) => r.id === q.id)));
  }
});

test("un tirage privilégie les compétences distinctes et les questions peu vues", () => {
  const items = Array.from({ length: 18 }, (_, i) => ({ id: String(i), prompt: `Question ${i}`, family: `famille${i < 12 ? i % 6 : 0}`, competency: `compétence${i % 6}`, category_id: "fx" }));
  const draw = diverseDraw(items, 10, new Set(["0", "1", "2", "3", "4", "5"]));
  assert.ok(new Set(draw.slice(0, 6).map((q) => q.competency)).size >= 6);
  assert.ok(draw.slice(0, 6).every((q) => Number(q.id) >= 6));
  assert.ok(items.every((q) => draw.filter((selected) => selected.family === q.family).length <= 2));
});

test("un jour férié, la dernière observation datée reste admissible après vérification", () => {
  const time = Date.parse("2026-12-25T10:00:00Z");
  const observed = { updated_at: "2026-12-25T06:11:00Z", failed: [], indicators: {
    eurusd: { label: "EUR/USD", value: 1.1, unit: "", ref_date: "2026-12-24", source: "BCE", retrieved_at: "2026-12-25T06:11:00Z", max_age_days: 7 },
  } };
  assert.ok(isVerifiedMacro(observed, "eurusd", time));
  assert.equal(buildMacroQuestions(observed, time)[0].reference_date, "2026-12-24");
  observed.indicators.eurusd.ref_date = "2026-12-17";
  assert.equal(isVerifiedMacro(observed, "eurusd", time), false);
  assert.deepEqual(buildMacroQuestions(observed, time), []);
});

test("l’actualité utilise les faits, les dates et les postes vérifiés", () => {
  const stamp = "2026-11-23T19:00:00Z";
  const date = stamp.slice(0, 10);
  const url = "https://example.org/communique";
  const bundled = {
    updated_at: stamp, failed: [],
    leaders: ["Nom A", "Nom B", "Nom C"].map((name, i) => ({ id: `p${i}`, name, office: `Fonction ${i}`,
      date, source: "Publication officielle", url, retrieved_at: stamp })),
    events: [{ id: "trade", title: "Accord commercial", topic: "Commerce et coopération internationale",
      context: "L’institution annonce un accord provisoire.", date, source: "Publication officielle", url, retrieved_at: stamp }],
  };
  const draw = buildNewsQuestions(bundled, Date.parse("2026-11-24T10:00:00Z"));
  assert.equal(draw.filter((q) => q.id.includes(":leader:")).length, 3);
  assert.ok(draw.some((q) => q.difficulty === "advanced" && q.id.includes(":stage:")));
  assert.ok(draw.every((q) => q.difficulty !== "beginner" && q.source_url.startsWith("https://")));
  assert.deepEqual(buildNewsQuestions(bundled, Date.parse("2026-11-27T10:00:00Z")), []);
});

test("les données de marché conservent leurs dates après un passage le week-end et une panne", () => {
  const monday = Date.parse("2026-11-23T01:00:00Z");
  const collected = "2026-11-22T07:11:00Z";
  const data = {
    updated_at: collected, checked_at: collected, failed: [], source: "Yahoo Finance",
    items: Array.from({ length: 10 }, (_, n) => ({ ticker: `T${n}`, price_date: "2026-11-20", currency: "USD" })),
  };
  assert.equal(hasFreshMarketCaps(data, monday), true);
  assert.equal(hasFreshMarketCaps({ ...data, refresh_failed: true }, monday), true);
  assert.equal(hasFreshMarketCaps(data, Date.parse("2026-11-24T08:00:00Z")), false);
  assert.equal(hasFreshMarketCaps({ ...data, items: [{ currency: "EUR", price_date: "2026-11-20" }] }, monday), false);
});

test("l’API et les quiz préfèrent la publication contrôlée au fichier embarqué", async (t) => {
  const { default: bundled } = await import("../public/data/macro.json", { with: { type: "json" } });
  const now = Date.parse(bundled.checked_at ?? bundled.updated_at) + 3_600_000;
  t.mock.method(Date, "now", () => now);
  const checked = new Date(now - 60_000).toISOString();
  const day = checked.slice(0, 10);
  const publication = {
    updated_at: checked, checked_at: checked, failed: [],
    indicators: {
      eurusd: { value: 1.099, unit: "", label: "EUR/USD", source: "BCE", ref_date: day, max_age_days: 7, retrieved_at: checked },
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

  payload = { ...publication, failed: ["eurusd"], checked_at: new Date(now - 1_000).toISOString() };
  const interrupted = await readMacroSnapshot();
  assert.equal(isAtLeastAsRecent(interrupted, publication), true);
  assert.equal(isAtLeastAsRecent(publication, interrupted), false);
  assert.equal(interrupted.indicators.eurusd.ref_date, day);
  assert.equal(isVerifiedMacro(interrupted, "eurusd", now), true);
  assert.deepEqual(buildMacroQuestions(interrupted, now), buildMacroQuestions(publication, now));
  assert.equal(isVerifiedMacro(publication, "eurusd", now + 49 * 3_600_000), false);

  payload = { ...publication, indicators: { eurusd: { ...publication.indicators.eurusd, ref_date: new Date(now + 2 * 86_400_000).toISOString().slice(0, 10) } } };
  assert.notEqual((await readMacroSnapshot()).checked_at, checked);
  const badRequest = await marketDataRoute(new Request("https://example.invalid/api/donnees?type=inconnu"));
  assert.equal(badRequest.status, 400);
});
