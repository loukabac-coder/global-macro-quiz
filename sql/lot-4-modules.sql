-- À appliquer une fois le Lot 1 installé. Transaction unique, rejouable.
begin;

create schema if not exists quiz_private;
revoke all on schema quiz_private from public, anon, authenticated;

-- Réutilise les règles XP, séries, révisions et badges existantes derrière une RPC privée.
do $$
declare
  legacy regprocedure;
begin
  if to_regprocedure('quiz_private.apply_quiz_progress(text,jsonb)') is null then
    alter function public.submit_session(text, jsonb) set schema quiz_private;
    alter function quiz_private.submit_session(text, jsonb) rename to apply_quiz_progress;
  end if;
  for legacy in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('submit_session', 'submit_module_quiz')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', legacy);
  end loop;
end;
$$;
alter function quiz_private.apply_quiz_progress(text, jsonb) set search_path = pg_catalog, public;
revoke all on function quiz_private.apply_quiz_progress(text, jsonb) from public, anon, authenticated;
revoke all on function public.set_placement(text) from public, anon, authenticated;

create table if not exists public.module_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  passed boolean not null,
  best_pct integer not null check (best_pct between 0 and 100),
  attempts integer not null check (attempts > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table public.module_progress enable row level security;
revoke all on public.module_progress from public, anon, authenticated;
grant select on public.module_progress to authenticated;
drop policy if exists module_progress_select on public.module_progress;
drop policy if exists module_progress_owner on public.module_progress;
create policy module_progress_select on public.module_progress for select to authenticated using (user_id = auth.uid());
create policy module_progress_owner on public.module_progress as restrictive for select to authenticated using (user_id = auth.uid());

-- Le navigateur peut lire son historique et son profil. Les écritures passent par les RPC.
alter table public.quiz_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.profiles enable row level security;
revoke all on public.quiz_sessions, public.attempts, public.profiles from public, anon, authenticated;
grant select on public.quiz_sessions, public.attempts, public.profiles to authenticated;
drop policy if exists quiz_sessions_read on public.quiz_sessions;
drop policy if exists quiz_sessions_owner on public.quiz_sessions;
create policy quiz_sessions_read on public.quiz_sessions for select to authenticated using (user_id = auth.uid());
create policy quiz_sessions_owner on public.quiz_sessions as restrictive for select to authenticated using (user_id = auth.uid());
drop policy if exists attempts_read on public.attempts;
drop policy if exists attempts_owner on public.attempts;
create policy attempts_read on public.attempts for select to authenticated using (user_id = auth.uid());
create policy attempts_owner on public.attempts as restrictive for select to authenticated using (user_id = auth.uid());
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_owner on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_owner on public.profiles as restrictive for select to authenticated using (id = auth.uid());
revoke all on public.question_reviews, public.category_stats, public.user_badges from public, anon, authenticated;
grant select on public.question_reviews, public.category_stats, public.user_badges to authenticated;
drop policy if exists reviews_owner on public.question_reviews;
drop policy if exists stats_owner on public.category_stats;
drop policy if exists badges_owner on public.user_badges;
create policy reviews_owner on public.question_reviews as restrictive for select to authenticated using (user_id = auth.uid());
create policy stats_owner on public.category_stats as restrictive for select to authenticated using (user_id = auth.uid());
create policy badges_owner on public.user_badges as restrictive for select to authenticated using (user_id = auth.uid());

create table if not exists quiz_private.quiz_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('quick', 'training', 'challenge', 'daily', 'mixed', 'weakness')),
  kind text not null check (kind in ('standard', 'placement', 'module')),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 15),
  time_limit integer not null check (time_limit in (0, 15, 20, 30)),
  module_id text,
  pass_threshold integer,
  daily_date date,
  issued_at timestamptz not null default clock_timestamp(),
  question_started_at timestamptz,
  answers jsonb not null default '[]'::jsonb,
  result jsonb,
  check (kind <> 'module' or (module_id is not null and pass_threshold between 1 and 100 and jsonb_array_length(questions) = 10)),
  check (mode <> 'daily' or daily_date is not null)
);
alter table quiz_private.quiz_runs enable row level security;
create index if not exists quiz_runs_user_time on quiz_private.quiz_runs(user_id, issued_at);

create or replace function public.issue_quiz_run(
  p_user uuid, p_mode text, p_kind text, p_questions jsonb, p_time_limit integer,
  p_module text, p_pass_threshold integer, p_daily_date date
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text), 621);
  delete from quiz_private.quiz_runs
    where user_id = p_user and issued_at < clock_timestamp() - interval '7 days';
  if (select count(*) from quiz_private.quiz_runs
      where user_id = p_user and issued_at > clock_timestamp() - interval '1 minute') >= 12 then
    raise exception 'quiz issuance limit' using errcode = '54000';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    insert into public.profiles(id, display_name, xp, level, streak_days)
    select id, coalesce(nullif(raw_user_meta_data->>'display_name', ''), 'Apprenant'), 0, 1, 0
      from auth.users where id = p_user
    on conflict (id) do nothing;
  end if;
  insert into quiz_private.quiz_runs(user_id, mode, kind, questions, time_limit, module_id, pass_threshold, daily_date)
  values (p_user, p_mode, p_kind, p_questions, p_time_limit, p_module, p_pass_threshold, p_daily_date)
  returning id into run_id;
  return run_id;
end;
$$;

create or replace function quiz_private.lock_run(p_run uuid)
returns quiz_private.quiz_runs
language plpgsql
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into run from quiz_private.quiz_runs where id = p_run and user_id = auth.uid() for update;
  if not found then raise exception 'quiz session unavailable'; end if;
  if run.result is null and run.issued_at < clock_timestamp() - interval '4 hours' then
    raise exception 'quiz session expired';
  end if;
  return run;
end;
$$;

create or replace function public.start_quiz_question(p_run uuid, p_index integer)
returns void
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs := quiz_private.lock_run(p_run);
begin
  if p_index is null or p_index <> jsonb_array_length(run.answers) or p_index >= jsonb_array_length(run.questions) then
    raise exception 'unexpected question';
  end if;
  if run.question_started_at is null then
    update quiz_private.quiz_runs set question_started_at = clock_timestamp() where id = run.id;
  end if;
end;
$$;

create or replace function public.record_quiz_answer(p_run uuid, p_index integer, p_answer jsonb)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs := quiz_private.lock_run(p_run);
  question jsonb := run.questions -> p_index;
  cnt integer := jsonb_array_length(run.answers);
  feedback jsonb;
  value numeric;
  target numeric;
  elapsed numeric;
  correct boolean := false;
  timed_out boolean;
  points integer := 0;
begin
  if p_index is null or p_index < 0 or question is null then raise exception 'unexpected question'; end if;
  if p_index < cnt then
    return (run.answers -> p_index) || jsonb_build_object('question', question);
  end if;
  if p_index <> cnt or run.question_started_at is null then raise exception 'question has not started'; end if;

  if p_answer is not null and p_answer <> 'null'::jsonb then
    if question->>'type' = 'true_false' then
      if jsonb_typeof(p_answer) <> 'boolean' then raise exception 'invalid answer'; end if;
    else
      if jsonb_typeof(p_answer) <> 'number' then raise exception 'invalid answer'; end if;
      value := (p_answer #>> '{}')::numeric;
      if question->>'type' = 'mcq' and (value <> trunc(value) or value < 0 or value >= jsonb_array_length(question->'options')) then
        raise exception 'invalid answer';
      end if;
    end if;
  end if;
  elapsed := greatest(0, extract(epoch from clock_timestamp() - run.question_started_at));
  -- Marge pour la transmission de la réponse. Elle ne rapporte aucun point de vitesse.
  timed_out := run.time_limit > 0 and (elapsed > run.time_limit + 1 or p_answer is null or p_answer = 'null'::jsonb);
  if not timed_out then
    if jsonb_typeof(p_answer) = 'boolean' and question->>'type' = 'true_false' then
      correct := p_answer = question->'correct';
    elsif jsonb_typeof(p_answer) = 'number' and question->>'type' in ('mcq', 'numeric', 'guesstimate') then
      target := (question->>'correct')::numeric;
      if question->>'type' = 'mcq' then
        correct := value = target;
      else
        correct := abs(value - target) <= abs(target) * (coalesce((question->>'tolerance_pct')::numeric, 0) / 100) + 0.000000001;
      end if;
    end if;
  end if;
  if correct and run.time_limit > 0 then
    points := round(50 + 50 * greatest(0, 1 - elapsed / run.time_limit));
  end if;

  feedback := jsonb_build_object(
    'answer', case when timed_out then null else p_answer end, 'ok', correct,
    'seconds', round(elapsed, 1), 'points', points, 'timedOut', timed_out
  );
  update quiz_private.quiz_runs
    set answers = answers || jsonb_build_array(feedback), question_started_at = null
    where id = run.id;
  return feedback || jsonb_build_object('question', question);
end;
$$;

create or replace function public.finish_quiz_run(p_run uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs := quiz_private.lock_run(p_run);
  history_id public.quiz_sessions.id%type;
  stored_mode public.quiz_sessions.mode%type;
  stored_question public.attempts.question_id%type;
  q jsonb;
  a jsonb;
  progression jsonb := '[]'::jsonb;
  summary jsonb;
  qid text;
  answer_label text;
  score integer := 0;
  total integer := jsonb_array_length(run.questions);
  weight integer;
  earned integer := 0;
  available integer := 0;
  pct integer;
  passed boolean;
  placement text;
begin
  if run.result is not null then return run.result; end if;
  if jsonb_array_length(run.answers) <> total then raise exception 'quiz session incomplete'; end if;

  select (jsonb_populate_record(null::public.quiz_sessions, jsonb_build_object('mode', run.mode))).mode into stored_mode;
  for i in 0 .. total - 1 loop
    q := run.questions -> i;
    a := run.answers -> i;
    if (a->>'ok')::boolean then score := score + 1; end if;
  end loop;
  insert into public.quiz_sessions (user_id, mode, finished_at, score, total, seconds_spent)
  values (run.user_id, stored_mode, clock_timestamp(), score, total,
          greatest(0, floor(extract(epoch from clock_timestamp() - run.issued_at)))::integer)
  returning id into history_id;

  for i in 0 .. total - 1 loop
    q := run.questions -> i;
    a := run.answers -> i;
    qid := q->>'id';
    if qid ~ '^(gen|live|macro|guest|module):' then qid := null; end if;
    weight := case q->>'difficulty' when 'intermediate' then 2 when 'advanced' then 3 when 'expert' then 4 else 1 end;
    available := available + weight;
    if (a->>'ok')::boolean then earned := earned + weight; end if;

    progression := progression || jsonb_build_array(jsonb_build_object(
      'qid', qid, 'ok', a->'ok', 'seconds', a->'seconds', 'difficulty', q->'difficulty', 'category', q->'category_id'
    ));

    if qid is not null and exists (select 1 from public.questions where id::text = qid) then
      select (jsonb_populate_record(null::public.attempts, jsonb_build_object('question_id', qid))).question_id into stored_question;
      answer_label := case
        when (a->>'timedOut')::boolean then 'Temps écoulé'
        when a->>'answer' is null then 'Pas de réponse'
        when q->>'type' = 'mcq' then q->'options'->>(a->>'answer')::integer
        when q->>'type' = 'true_false' then case when a->>'answer' = 'true' then 'Vrai' else 'Faux' end
        else a->>'answer'
      end;
      insert into public.attempts(user_id, session_id, question_id, is_correct, answer, seconds_spent)
      values (run.user_id, history_id, stored_question, (a->>'ok')::boolean,
              jsonb_build_object('given', answer_label, 'value', a->'answer'), round((a->>'seconds')::numeric)::integer);
    end if;
  end loop;

  summary := quiz_private.apply_quiz_progress(
    case when run.mode = 'daily' and run.daily_date <> (now() at time zone 'Europe/Paris')::date then 'quick' else run.mode end,
    progression
  );
  if run.kind = 'placement' then
    placement := case when 100 * earned < 40 * available then 'debutant'
      when 100 * earned < 70 * available then 'intermediaire' else 'avance' end;
    update public.profiles set placement_level = placement where id = run.user_id;
    summary := summary || jsonb_build_object('placement', placement);
  elsif run.kind = 'module' then
    pct := round(100.0 * score / total);
    passed := 100 * score >= run.pass_threshold * total;
    insert into public.module_progress(user_id, module_id, passed, best_pct, attempts)
    values (run.user_id, run.module_id, passed, pct, 1)
    on conflict (user_id, module_id) do update
      set passed = module_progress.passed or excluded.passed,
          best_pct = greatest(module_progress.best_pct, excluded.best_pct),
          attempts = module_progress.attempts + 1,
          updated_at = now();
    summary := summary || jsonb_build_object('module_passed', passed);
  end if;
  summary := summary || jsonb_build_object('score', score, 'total', total);
  update quiz_private.quiz_runs set result = summary where id = run.id;
  return summary;
end;
$$;

revoke all on function public.issue_quiz_run(uuid, text, text, jsonb, integer, text, integer, date) from public, anon, authenticated;
grant execute on function public.issue_quiz_run(uuid, text, text, jsonb, integer, text, integer, date) to service_role;
revoke all on function public.start_quiz_question(uuid, integer) from public, anon;
revoke all on function public.record_quiz_answer(uuid, integer, jsonb) from public, anon;
revoke all on function public.finish_quiz_run(uuid) from public, anon;
grant execute on function public.start_quiz_question(uuid, integer) to authenticated;
grant execute on function public.record_quiz_answer(uuid, integer, jsonb) to authenticated;
grant execute on function public.finish_quiz_run(uuid) to authenticated;

commit;
