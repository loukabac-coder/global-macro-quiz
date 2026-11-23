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
const { mentalQuestion } = await import("../src/lib/mental.ts");
const { dailyQuestions, guestQuick } = await import("../src/lib/guest.ts");
const { LEVELS, MODULES, computeStatuses } = await import("../src/lib/modules.ts");
const { moduleQuestions } = await import("../src/lib/moduleQuestions.ts");
const { gameSeconds } = await import("../src/lib/quizSession.ts");
const { buildMacroQuestions } = await import("../src/lib/macroQuestions.ts");
const { isFresh, isVerifiedMacro } = await import("../src/lib/macro.ts");
const { hasFreshMarketCaps } = await import("../src/lib/marketcaps.ts");
const { readMacroSnapshot } = await import("../src/lib/dataSnapshots.ts");
const { isAtLeastAsRecent } = await import("../src/lib/dataFreshness.ts");
const { GET: marketDataRoute } = await import("../src/app/api/donnees/route.ts");
const { drawExam, EXAM_SIZE } = await import("../src/lib/exam.ts");
const { matchesKeywords, searchText } = await import("../src/lib/searchText.ts");
const { loadQuick, loadGame, loadPlacement, loadTraining, loadTrainingByHistory, loadWeakness } = await import("../src/lib/loaders.ts");
const { CURRICULUM, curriculumQuestions, isCurrentFavorite } = await import("../src/lib/curriculum/catalog.ts");
const { CHAPTERS, getChapter } = await import("../src/lib/courses.ts");
const { buildLiveQuestions } = await import("../src/lib/liveQuestions.ts");
const { mentalDifficulty } = await import("../src/lib/mental.ts");
const { CATS } = await import("../src/lib/categories.ts");

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

test("les estimations de capitalisation datées démarrent à l’intermédiaire", () => {
  const beginner = MODULES.find((m) => m.id === "d2");
  const intermediate = MODULES.find((m) => m.id === "i2");
  const collected = "2026-11-23T10:00:00Z";
  const now = Date.parse("2026-11-23T11:00:00Z");
  const rows = [
    ["AAPL", "Apple", 4_123], ["MC.PA", "LVMH", 360], ["OR.PA", "L’Oréal", 245],
    ["SU.PA", "Schneider Electric", 170], ["AI.PA", "Air Liquide", 115], ["AIR.PA", "Airbus", 400],
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
  const live = buildLiveQuestions(caps);
  assert.ok(live.every((q) => q.kind === "conjunctural" && q.difficulty !== "beginner" && q.reference_date));
  const questions = moduleQuestions(beginner, 10, live);
  assert.ok(questions.every((q) => q.kind === "structural"));
  assert.ok(questions.some((q) => q.prompt.includes("valeurs françaises") || q.prompt.includes("sociétés françaises")));
  const dated = moduleQuestions(intermediate, 10, live.filter((q) => q.prompt.includes("500 Md$") || q.prompt.includes("quatre valeurs françaises")));
  assert.equal(dated.length, 10);
  assert.equal(questions.length, 10);
  const apple = dated.find((q) => q.prompt.includes("500 Md$"));
  assert.equal(apple.correct, 4_123);
  assert.equal(apple.source, caps.source);
  assert.equal(apple.reference_date, "2026-11-23");
  for (const value of [3_623, 4_623]) assert.equal(checkNumeric(apple, value), true);
  for (const value of [3_622, 4_624]) assert.equal(checkNumeric(apple, value), false);
  const france = dated.find((q) => q.prompt.includes("quatre valeurs françaises"));
  assert.equal(france.options[france.correct], "LVMH");
  assert.ok(!france.options.includes("Airbus"));
  assert.equal(hasFreshMarketCaps(caps, Date.parse("2026-11-23T16:00:00Z")), false);
});

test("le défi du jour partage une série stable de dix questions", () => {
  const date = "2026-11-22";
  const first = dailyQuestions(CURRICULUM, date);
  assert.equal(first.length, 10);
  assert.deepEqual(first, dailyQuestions([...CURRICULUM].reverse(), date));
  assert.notDeepEqual(first, dailyQuestions(CURRICULUM, "2026-11-23"));
  assert.deepEqual(LEVELS.map(({ id }) => first.filter((q) => q.difficulty === id).length), [4, 3, 2, 1]);
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
  assert.equal(computeStatuses(passed, null).d3, "open");
  assert.equal(computeStatuses(passed, null).d2, "locked");
  assert.equal(computeStatuses({ ...passed, d3: passed.d1 }, null).d2, "open");
  assert.equal(computeStatuses({}, "avance").a1, "open");
  assert.equal(gameSeconds("calcul", 4), 30);
});

test("la banque pédagogique couvre la grille et relie chaque question à un module", () => {
  const keys = new Set();
  const prompts = new Set();
  for (const question of CURRICULUM) {
    const lesson = MODULES.find((item) => item.id === question.moduleId);
    assert.ok(lesson?.categories.includes(question.category_id), question.id);
    assert.equal(question.difficulty, lesson.level, question.id);
    assert.ok(question.id.startsWith("course:") && question.id.length <= 64 && !keys.has(question.id), question.id);
    assert.ok(!prompts.has(searchText(question.prompt)), question.id);
    assert.ok(question.explanation.trim(), question.id);
    assert.ok(question.kind === "structural" && question.reference_date === null, question.id);
    if (question.type === "numeric") {
      assert.ok(Number.isFinite(question.correct) && question.tolerance_pct >= 0, question.id);
    } else {
      assert.ok(question.options[question.correct] && new Set(question.options).size === question.options.length, question.id);
    }
    keys.add(question.id);
    prompts.add(searchText(question.prompt));
  }
  for (const [category] of CATS) {
    for (const { id: level } of LEVELS) {
      const pool = curriculumQuestions({ categories: [category], levels: [level] });
      const specialized = ["central-banks", "fx", "commodities"].includes(category);
      assert.ok(pool.length >= (specialized && level !== "beginner" ? 15 : 8), category + " · " + level);
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
  const training = await loadTraining(["fx"], ["expert"], noLive);
  assert.equal(training.length, 10);
  assert.ok(training.every((q) => q.difficulty === "expert" && q.category_id === "fx" && bank.has(q.id)));
  const beginners = await loadTraining(["fx", "commodities"], ["beginner"], async () => { throw new Error("Aucune donnée courante requise"); });
  assert.ok(beginners.every((q) => q.difficulty === "beginner" && bank.has(q.id)));
  assert.equal(loadPlacement().length, 12);
  for (const game of ["calcul", "ordres", "culture"]) {
    for (const level of [1, 2, 3, 4, 5]) {
      const draw = await loadGame(game, level, noLive);
      assert.equal(draw.length, 10, game);
      assert.ok(draw.every((q) => bank.has(q.id) && q.difficulty === mentalDifficulty(level)), game);
      assert.ok(draw.every((q) => game === "culture" ? q.type === "mcq" : q.type === "numeric"), game);
    }
  }
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
