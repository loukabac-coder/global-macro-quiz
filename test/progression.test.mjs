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
    for (const name of ["lot-1-progression", "lot-4-modules", "lot-4-modules"]) {
      await db.exec(readFileSync(new URL(`../sql/${name}.sql`, import.meta.url), "utf8"));
    }
    const row = (await db.query(`
      select has_function_privilege('authenticated', 'public.issue_quiz_run(uuid,text,text,jsonb,integer,text,integer,date)', 'execute') as issue,
      has_table_privilege('authenticated', 'quiz_sessions', 'insert') as write_history,
      has_function_privilege('authenticated', 'public.set_placement(text)', 'execute') as set_level
    `)).rows[0];
    assert.deepEqual(row, { issue: false, write_history: false, set_level: false });
    const base = { type: "numeric", category_id: "mental-math", difficulty: "intermediate", correct: -100, tolerance_pct: 5 };
    const guestPool = JSON.parse(readFileSync(new URL("../public/data/guest-questions.json", import.meta.url), "utf8"));
    const weight = guestPool.find((q) => q.id === "guest:003");
    const exactConversion = guestPool.find((q) => q.id === "guest:004");
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
  } finally {
    await db.close();
  }
});
