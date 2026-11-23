-- Global Macro Quiz. Appliquer après le Lot 4.
begin;

alter table quiz_private.quiz_runs
  drop constraint if exists quiz_runs_kind_check,
  drop constraint if exists quiz_runs_questions_check,
  drop constraint if exists quiz_runs_time_limit_check,
  drop constraint if exists quiz_runs_exam_format;
alter table quiz_private.quiz_runs
  add constraint quiz_runs_kind_check check (kind in ('standard', 'placement', 'module', 'exam')),
  add constraint quiz_runs_exam_format check (
    jsonb_typeof(questions) = 'array' and (
      (kind = 'exam' and mode = 'training' and jsonb_array_length(questions) = 20 and time_limit = 45)
      or (kind <> 'exam' and jsonb_array_length(questions) between 1 and 15 and time_limit in (0, 15, 20, 30))
    )
  );

-- Même correction et même enregistrement pour les modes classiques.
-- L'examen n'accorde pas la seconde de transmission et masque chaque correction.
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
    if run.kind = 'exam' then return jsonb_build_object('submitted', true); end if;
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
  timed_out := run.time_limit > 0 and (p_answer is null or p_answer = 'null'::jsonb
    or case when run.kind = 'exam' then elapsed >= run.time_limit else elapsed > run.time_limit + 1 end);
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

  if run.kind = 'exam' and timed_out then elapsed := run.time_limit; end if;
  feedback := jsonb_build_object(
    'answer', case when timed_out then null else p_answer end, 'ok', correct,
    'seconds', round(elapsed, 1), 'points', points, 'timedOut', timed_out
  );
  update quiz_private.quiz_runs
    set answers = answers || jsonb_build_array(feedback), question_started_at = null
    where id = run.id;
  if run.kind = 'exam' then return jsonb_build_object('submitted', true); end if;
  return feedback || jsonb_build_object('question', question);
end;
$$;

-- Réutilise la transaction de progression du Lot 4, y compris sur une nouvelle tentative réseau.
do $migration$
begin
  if to_regprocedure('quiz_private.finish_verified_quiz(uuid)') is null then
    alter function public.finish_quiz_run(uuid) set schema quiz_private;
    alter function quiz_private.finish_quiz_run(uuid) rename to finish_verified_quiz;
  end if;
end;
$migration$;
revoke all on function quiz_private.finish_verified_quiz(uuid) from public, anon, authenticated;

create or replace function public.finish_quiz_run(p_run uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs := quiz_private.lock_run(p_run);
  summary jsonb := quiz_private.finish_verified_quiz(p_run);
  corrections jsonb;
begin
  if run.kind <> 'exam' then return summary; end if;
  select jsonb_agg(answer || jsonb_build_object('question', run.questions -> (position::int - 1)) order by position)
    into corrections
    from jsonb_array_elements(run.answers) with ordinality as a(answer, position);
  return summary || jsonb_build_object('corrections', corrections);
end;
$$;

create or replace function public.recent_exam_question_ids()
returns jsonb
language sql stable security definer
set search_path = pg_catalog
as $$
  select coalesce(jsonb_agg(q->>'id'), '[]'::jsonb)
  from (
    select questions from quiz_private.quiz_runs
    where user_id = auth.uid() and kind = 'exam'
    order by issued_at desc, id desc limit 1
  ) last_exam
  cross join lateral jsonb_array_elements(last_exam.questions) q;
$$;

create or replace function public.start_exam_question(p_run uuid, p_index integer)
returns numeric
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs := quiz_private.lock_run(p_run);
begin
  if run.kind <> 'exam' then raise exception 'exam required'; end if;
  perform public.start_quiz_question(p_run, p_index);
  return extract(epoch from (clock_timestamp() - (
    select question_started_at from quiz_private.quiz_runs where id = p_run
  )));
end;
$$;

create or replace function public.resume_quiz_run(p_run uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  run quiz_private.quiz_runs;
  visible jsonb;
  feedback jsonb;
begin
  select * into run from quiz_private.quiz_runs
    where id = p_run and user_id = auth.uid() and kind <> 'exam'
      and issued_at >= clock_timestamp() - interval '4 hours';
  if not found then return null; end if;

  select jsonb_agg(q || '{"correct":null,"explanation":"","wrong_explanations":null}'::jsonb order by position)
    into visible from jsonb_array_elements(run.questions) with ordinality as v(q, position);
  select coalesce(jsonb_agg(a || jsonb_build_object('question', run.questions -> (position::int - 1)) order by position), '[]'::jsonb)
    into feedback from jsonb_array_elements(run.answers) with ordinality as f(a, position);
  return jsonb_build_object(
    'questions', visible, 'feedback', feedback, 'timeLimit', run.time_limit, 'summary', run.result,
    'issuedSeconds', extract(epoch from clock_timestamp() - run.issued_at),
    'questionSeconds', extract(epoch from clock_timestamp() - run.question_started_at)
  );
end;
$$;

-- Une ligne par question dans l’historique, avec reprise des anciennes parties sans fiche de révision.
create or replace function public.quiz_answer_history()
returns table(question_key text, was_correct boolean)
language sql stable security invoker
set search_path = pg_catalog
as $$
  select r.question_id, r.box > 0
  from public.question_reviews r
  where r.user_id = auth.uid() and r.seen > 0
  union all
  select legacy.question_key, legacy.is_correct from (
    select distinct on (a.question_id) a.question_id::text as question_key, a.is_correct
    from public.attempts a
    join public.quiz_sessions s on s.id = a.session_id and s.user_id = a.user_id
    where a.user_id = auth.uid() and a.question_id is not null
      and not exists (
        select 1 from public.question_reviews r
        where r.user_id = a.user_id and r.question_id = a.question_id::text and r.seen > 0
      )
    order by a.question_id, s.finished_at desc nulls last, s.id desc
  ) legacy
  order by 1;
$$;

revoke all on function public.record_quiz_answer(uuid, integer, jsonb),
  public.finish_quiz_run(uuid), public.recent_exam_question_ids(), public.resume_quiz_run(uuid),
  public.start_exam_question(uuid, integer), public.quiz_answer_history() from public, anon;
grant execute on function public.record_quiz_answer(uuid, integer, jsonb),
  public.finish_quiz_run(uuid), public.recent_exam_question_ids(), public.resume_quiz_run(uuid),
  public.start_exam_question(uuid, integer), public.quiz_answer_history() to authenticated;

create table if not exists public.question_favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_key text not null check (length(question_key) between 1 and 400),
  question jsonb not null check (jsonb_typeof(question) = 'object' and octet_length(question::text) <= 32000),
  created_at timestamptz not null default now(),
  primary key (user_id, question_key)
);

create table if not exists public.question_reports (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_key text not null check (length(question_key) between 1 and 400),
  question_id text not null check (length(question_id) between 1 and 300),
  prompt text not null check (length(prompt) between 1 and 4000),
  reason text not null check (reason in ('incorrect', 'ambiguous', 'other')),
  detail text not null default '' check (length(detail) <= 1000),
  created_at timestamptz not null default now(),
  primary key (user_id, question_key)
);

alter table public.question_favorites enable row level security;
alter table public.question_reports enable row level security;
revoke all on public.question_favorites, public.question_reports from public, anon, authenticated;
grant select, insert, delete on public.question_favorites to authenticated;
grant insert on public.question_reports to authenticated;
drop policy if exists favorites_owner on public.question_favorites;
drop policy if exists reports_insert_own on public.question_reports;
create policy favorites_owner on public.question_favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_insert_own on public.question_reports for insert to authenticated
  with check (user_id = auth.uid());

commit;
