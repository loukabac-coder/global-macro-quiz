import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const first = "10000000-0000-4000-8000-000000000001";
const second = "10000000-0000-4000-8000-000000000002";
const initialSchema = `
  create role authenticated;
  create role anon;
  create role service_role;
  create schema auth;
  grant usage on schema auth to authenticated, anon;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table profiles (
    id uuid primary key references auth.users, xp integer default 0,
    level integer default 1, streak_days integer default 0, display_name text
  );
  create type quiz_mode as enum ('quick', 'training', 'challenge', 'daily', 'mixed', 'weakness');
  create table questions(id bigint primary key);
  create table quiz_sessions (
    id bigint generated always as identity primary key, user_id uuid references auth.users,
    mode quiz_mode, finished_at timestamptz, score integer, total integer, seconds_spent integer
  );
  create table attempts (
    user_id uuid references auth.users, session_id bigint references quiz_sessions, question_id bigint references questions,
    is_correct boolean, answer jsonb, seconds_spent integer
  );
  insert into auth.users values ('${first}'), ('${second}');
  insert into profiles(id) values ('${second}');
  insert into questions values (1), (2);
`;

async function session(db, user, mode, kind, questions, timer = 0, module = null) {
  await db.exec("reset role; set role service_role;");
  const res = await db.query("select issue_quiz_run($1,$2,$3,$4,$5,$6,$7,null) as id", [
    user, mode, kind, JSON.stringify(questions), timer, module, module ? 70 : null,
  ]);
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  return res.rows[0].id;
}

async function answer(db, id, index, value) {
  await db.query("select start_quiz_question($1,$2)", [id, index]);
  const { rows } = await db.query("select record_quiz_answer($1,$2,$3) as feedback", [id, index, JSON.stringify(value)]);
  return rows[0].feedback;
}

test("migration en mémoire, correction, historique et modules", async () => {
  const db = new PGlite();
  try {
    await db.exec(initialSchema);
    for (const name of ["lot-1-progression", "lot-4-modules", "lot-4-modules", "lot-5-examen-et-questions", "lot-5-examen-et-questions", "lot-6-recommencer-quiz", "lot-6-recommencer-quiz", "lot-7-parcours", "lot-7-parcours"]) {
      await db.exec(readFileSync(new URL(`../sql/${name}.sql`, import.meta.url), "utf8"));
    }
    const row = (await db.query(`
      select has_function_privilege('authenticated', 'public.issue_quiz_run(uuid,text,text,jsonb,integer,text,integer,date)', 'execute') as issue,
      has_table_privilege('authenticated', 'quiz_sessions', 'insert') as write_history,
      has_function_privilege('authenticated', 'public.set_placement(text)', 'execute') as set_level
    `)).rows[0];
    assert.deepEqual(row, { issue: false, write_history: false, set_level: false });
    const base = { type: "numeric", category_id: "mental-math", difficulty: "intermediate", correct: -100, tolerance_pct: 5 };
    const weight = { ...base, id: "course:i2:market-caps:poids", difficulty: "intermediate", category_id: "market-caps", correct: 5, tolerance_pct: 8 };
    const exactConversion = { ...base, id: "course:d1:mental-math:pb", difficulty: "beginner", correct: 1.5, tolerance_pct: 0 };
    const questions = Array.from({ length: 10 }, (_, i) => ({ ...base, id: i === 0 ? "1" : i === 1 ? "2" : `module:d1:${i}` }));
    questions[0] = { ...weight, id: "1" };
    const estimate = { ...base, correct: 4_123, tolerance_pct: 100 * 500 / 4_123 };
    questions[2] = { ...estimate, id: "module:d1:2" };
    questions[7] = weight;
    questions[8] = exactConversion;
    questions[9] = { ...estimate, id: "module:d1:9" };
    const id = await session(db, first, "training", "module", questions, 0, "d1");
    const answers = [4.7, -105, 4_623, -105, -105, -105, -105, 4.59, 1.49, 4_624];
    for (let i = 0; i < answers.length; i++) assert.equal((await answer(db, id, i, answers[i])).ok, i < 7);
    const finalized = (await db.query("select finish_quiz_run($1) as result", [id])).rows[0].result;
    assert.equal(finalized.score, 7);
    assert.equal(finalized.total, 10);
    assert.equal(finalized.module_passed, true);
    assert.deepEqual((await db.query("select finish_quiz_run($1) as result", [id])).rows[0].result, finalized);
    assert.equal((await db.query("select count(*)::int as n from quiz_sessions")).rows[0].n, 1);
    assert.equal((await db.query("select count(*)::int as n from attempts")).rows[0].n, 2);
    assert.deepEqual((await db.query("select question_key, was_correct from quiz_answer_history() where question_key like 'course:%'")).rows, [
      { question_key: "course:d1:mental-math:pb", was_correct: false },
      { question_key: "course:i2:market-caps:poids", was_correct: false },
    ]);
    assert.deepEqual((await db.query("select passed,best_pct,attempts from module_progress")).rows[0], { passed: true, best_pct: 70, attempts: 1 });

    const placementId = await session(db, first, "quick", "placement", [
      { ...base, id: "guest:tf", type: "true_false", correct: false },
      { ...base, id: "guest:mcq", type: "mcq", options: ["A", "B"], correct: 1 },
    ]);
    assert.equal((await answer(db, placementId, 0, false)).ok, true);
    assert.equal((await answer(db, placementId, 1, 1)).ok, true);
    assert.equal((await db.query("select finish_quiz_run($1)->>'placement' as level", [placementId])).rows[0].level, "avance");

    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [second]);
    assert.equal((await db.query("select count(*)::int as n from quiz_sessions")).rows[0].n, 0);
    assert.equal((await db.query("select count(*)::int as n from module_progress")).rows[0].n, 0);
    assert.equal((await db.query("select count(*)::int as n from profiles")).rows[0].n, 1);

    await assert.rejects(session(db, first, "training", "module", questions, 0, "p:b:01:pib"), /quiz_runs_module_format/);
    for (const [stage, size, correctCount, passed] of [
      ["p:b:01:pib", 5, 3, false], ["p:b:01:pib", 5, 4, true],
      ["p:b:01:synthese", 8, 5, false], ["p:b:01:synthese", 8, 6, true],
    ]) {
      const draw = Array.from({ length: size }, (_, i) => ({ ...base, correct: 100, id: `course:test:${stage}:${i}` }));
      const run = await session(db, first, "training", "module", draw, 0, stage);
      for (let i = 0; i < size; i++) await answer(db, run, i, i < correctCount ? 100 : 42);
      const { rows } = await db.query("select finish_quiz_run($1)->>'module_passed' as passed", [run]);
      assert.equal(rows[0].passed, String(passed));
    }
    assert.deepEqual((await db.query("select module_id, best_pct, attempts from module_progress order by module_id")).rows, [
      { module_id: "d1", best_pct: 70, attempts: 1 },
      { module_id: "p:b:01:pib", best_pct: 80, attempts: 2 },
      { module_id: "p:b:01:synthese", best_pct: 75, attempts: 2 },
    ]);
  } finally {
    await db.close();
  }
});

test("examen à délai strict, corrections différées, reprise et données personnelles", async () => {
  const db = new PGlite();
  try {
    await db.exec(initialSchema);
    for (const name of ["lot-1-progression", "lot-4-modules", "lot-5-examen-et-questions", "lot-6-recommencer-quiz"]) {
      await db.exec(readFileSync(new URL(`../sql/${name}.sql`, import.meta.url), "utf8"));
    }
    const bank = Array.from({ length: 20 }, (_, index) => ({
      id: String(index + 1), category_id: "financial-markets", difficulty: "intermediate",
      prompt: `Fixture ${index + 1}`, type: "numeric", correct: -100, tolerance_pct: 5,
      explanation: "Correction de test",
    }));
    await assert.rejects(session(db, first, "training", "exam", bank.slice(0, 19), 45), /quiz_runs_exam_format/);
    await assert.rejects(session(db, first, "training", "exam", bank, 30), /quiz_runs_exam_format/);
    const exam = await session(db, first, "training", "exam", bank, 45);
    assert.equal((await db.query("select resume_quiz_run($1) as run", [exam])).rows[0].run, null);
    await assert.rejects(db.query("select restart_quiz_run($1)", [exam]), /restart unavailable/);
    await assert.rejects(db.query("select finish_quiz_run($1)", [exam]), /incomplete/);
    await assert.rejects(db.query("select start_exam_question($1,1)", [exam]), /unexpected question/);
    await db.query("select start_exam_question($1,0)", [exam]);
    const { rows: started } = await db.query("select start_exam_question($1,0) elapsed", [exam]);
    assert.ok(Number(started[0].elapsed) >= 0);
    assert.deepEqual(await answer(db, exam, 0, -105), { submitted: true });
    const retry = await db.query("select record_quiz_answer($1,0,'0'::jsonb) result", [exam]);
    assert.deepEqual(retry.rows[0].result, { submitted: true });
    await db.query("select start_exam_question($1,1)", [exam]);
    await db.exec("reset role");
    await db.query("update quiz_private.quiz_runs set question_started_at = clock_timestamp() - interval '45.1 seconds' where id=$1", [exam]);
    await db.exec("set role authenticated");
    assert.deepEqual(await answer(db, exam, 1, -100), { submitted: true });
    for (let i = 2; i < 20; i++) assert.deepEqual(await answer(db, exam, i, i === 2 ? null : -100), { submitted: true });
    const finalized = (await db.query("select finish_quiz_run($1) as result", [exam])).rows[0].result;
    assert.equal(finalized.score, 18);
    assert.equal(finalized.total, 20);
    assert.equal(finalized.corrections.length, 20);
    assert.equal(finalized.corrections[0].answer, -105);
    assert.equal(finalized.corrections[0].question.correct, -100);
    for (const timeout of [1, 2]) {
      assert.equal(finalized.corrections[timeout].ok, false);
      assert.equal(finalized.corrections[timeout].answer, null);
      assert.equal(finalized.corrections[timeout].seconds, 45);
    }
    assert.deepEqual((await db.query("select finish_quiz_run($1) as result", [exam])).rows[0].result, finalized);
    assert.deepEqual((await db.query("select recent_exam_question_ids() ids")).rows[0].ids, bank.map((q) => q.id));
    assert.equal((await db.query("select count(*)::int n from quiz_sessions")).rows[0].n, 1);

    const classic = await session(db, first, "training", "standard", bank.slice(0, 3), 20);
    await answer(db, classic, 0, -105);
    let resume = (await db.query("select resume_quiz_run($1) run", [classic])).rows[0].run;
    assert.equal(resume.feedback[0].question.correct, -100);
    assert.equal(resume.questionSeconds, null);
    assert.equal(resume.questions[1].correct, null);
    await db.query("select start_quiz_question($1,1)", [classic]);
    resume = (await db.query("select resume_quiz_run($1) run", [classic])).rows[0].run;
    assert.ok(resume.questionSeconds >= 0 && resume.questionSeconds < 20);
    assert.deepEqual((await db.query("select * from quiz_answer_history()")).rows.slice(0, 2), [
      { question_key: "1", was_correct: true }, { question_key: "10", was_correct: true },
    ]);
    await db.query("insert into question_favorites(question_key,question) values ('1:favorite',$1)", [JSON.stringify(bank[0])]);
    await db.exec("insert into question_reports (question_key,question_id,prompt,reason) values ('1:favorite','1','Fixture','ambiguous')");
    await assert.rejects(db.query("select * from question_reports"), /permission denied/);

    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [second]);
    assert.equal((await db.query("select resume_quiz_run($1) run", [classic])).rows[0].run, null);
    assert.deepEqual((await db.query("select recent_exam_question_ids() ids")).rows[0].ids, []);
    assert.deepEqual((await db.query("select * from quiz_answer_history()")).rows, []);
    assert.deepEqual((await db.query("select * from question_favorites")).rows, []);
    await assert.rejects(db.query("insert into question_favorites(user_id,question_key,question) values ($1,'1:other','{}')", [first]), /row-level security/);
    await assert.rejects(db.query("insert into question_reports(user_id,question_key,question_id,prompt,reason) values ($1,'1:other','1','Fixture','ambiguous')", [first]), /row-level security/);

    await db.exec("reset role");
    await db.query(`
      with older as (
        insert into quiz_sessions(user_id,mode,finished_at,score,total,seconds_spent)
        values ($1,'quick',now()-interval '2 days',0,1,10) returning id
      ), newer as (
        insert into quiz_sessions(user_id,mode,finished_at,score,total,seconds_spent)
        values ($1,'quick',now()-interval '1 day',1,1,5) returning id
      )
      insert into attempts(user_id,session_id,question_id,is_correct)
      select $1,id,2,false from older union all select $1,id,2,true from newer
    `, [second]);
    await db.exec("set role authenticated");
    assert.deepEqual((await db.query("select * from quiz_answer_history()")).rows, [{ question_key: "2", was_correct: true }]);
  } finally {
    await db.close();
  }
});

test("le redémarrage connecté recrée le même quiz sans enregistrer la tentative abandonnée", async () => {
  const db = new PGlite();
  try {
    await db.exec(initialSchema);
    for (const name of ["lot-1-progression", "lot-4-modules", "lot-5-examen-et-questions", "lot-6-recommencer-quiz"]) {
      await db.exec(readFileSync(new URL(`../sql/${name}.sql`, import.meta.url), "utf8"));
    }
    const bank = [
      { id: "1", prompt: "Premier montant", type: "numeric", options: { unit: "M€" }, correct: 4.75,
        tolerance_pct: 5, category_id: "market-caps", difficulty: "intermediate", explanation: "Corrigé" },
      { id: "2", prompt: "Deuxième question", type: "mcq", options: ["A", "B"], correct: 1,
        category_id: "macroeconomics", difficulty: "intermediate", explanation: "Corrigé" },
    ];
    const original = await session(db, first, "challenge", "standard", bank, 20);
    assert.equal((await answer(db, original, 0, 0)).ok, false);
    await db.query("select start_quiz_question($1,1)", [original]);
    await db.exec("reset role");
    await db.query("update quiz_private.quiz_runs set question_started_at = clock_timestamp() - interval '18 seconds' where id=$1", [original]);
    await db.exec("set role authenticated");
    const restart = async (id) => (await db.query("select restart_quiz_run($1) as run", [id])).rows[0].run;
    const replacement = await restart(original);
    assert.notEqual(replacement.id, original);
    assert.deepEqual(replacement.questions.map((q) => q.id), bank.map((q) => q.id));
    assert.ok(replacement.questions.every((q) => q.correct === null && q.explanation === ""));
    assert.equal(replacement.feedback.length, 0);
    assert.equal(replacement.timeLimit, 20);
    assert.ok(replacement.questionSeconds >= 0 && replacement.questionSeconds < 5);
    assert.ok(replacement.issuedSeconds >= 0 && replacement.issuedSeconds < 5);
    assert.equal((await restart(original)).id, replacement.id);
    await assert.rejects(answer(db, original, 1, 1), /session unavailable/);
    await assert.rejects(db.query("select finish_quiz_run($1)", [original]), /session unavailable/);
    assert.deepEqual((await db.query("select (select count(*)::int from quiz_sessions) sessions, xp from profiles")).rows[0], { sessions: 0, xp: 0 });

    assert.equal((await answer(db, replacement.id, 0, 4.525)).ok, true);
    const latest = await restart(replacement.id);
    const resumed = (await db.query("select resume_quiz_run($1) as run", [original])).rows[0].run;
    assert.equal(resumed.id, latest.id);
    assert.equal(resumed.feedback.length, 0);
    assert.equal((await answer(db, latest.id, 0, 4.75)).ok, true);
    assert.equal((await answer(db, latest.id, 1, 1)).ok, true);
    const final = (await db.query("select finish_quiz_run($1) as result", [latest.id])).rows[0].result;
    assert.equal(final.score, 2);
    assert.equal((await db.query("select count(*)::int n from quiz_sessions")).rows[0].n, 1);
    await assert.rejects(restart(latest.id), /restart unavailable/);

    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [second]);
    await assert.rejects(restart(original), /restart unavailable/);
    assert.equal((await db.query("select resume_quiz_run($1) as run", [original])).rows[0].run, null);
    await db.exec("reset role; set role anon");
    await assert.rejects(restart(original), /permission denied/);
  } finally {
    await db.close();
  }
});
