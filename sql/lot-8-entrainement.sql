-- Appliquer après le Lot 7. Les anciennes synthèses restent lisibles pendant une reprise.
begin;

alter table quiz_private.quiz_runs drop constraint if exists quiz_runs_module_format;
alter table quiz_private.quiz_runs add constraint quiz_runs_module_format check (
  kind <> 'module' or (
    module_id is not null and pass_threshold is not null and pass_threshold between 1 and 100
    and case when module_id like 'p:%:synthese'
      then jsonb_array_length(questions) = 8 or jsonb_array_length(questions) between 12 and 15
      when module_id like 'p:%' then jsonb_array_length(questions) between 1 and 15
      else jsonb_array_length(questions) = 10 end
  )
);

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
  seconds_limit integer;
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
  seconds_limit := case when run.kind = 'exam'
    then greatest(1, least(45, coalesce((question->>'limit_seconds')::integer, run.time_limit))) else 0 end;
  timed_out := seconds_limit > 0
    and (p_answer is null or p_answer = 'null'::jsonb or elapsed >= seconds_limit);
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
  if correct and seconds_limit > 0 then
    points := round(50 + 50 * greatest(0, 1 - elapsed / seconds_limit));
  end if;

  if run.kind = 'exam' and timed_out then elapsed := seconds_limit; end if;
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


create or replace function public.recent_module_draws(p_module text)
returns jsonb
language sql stable security definer
set search_path = pg_catalog
as $$
  select coalesce(jsonb_agg(
    (select jsonb_agg(jsonb_build_object('id', q->>'id', 'options', q->'options', 'false_first', q->'false_first') order by n)
      from jsonb_array_elements(draw.questions) with ordinality as v(q,n))
    order by draw.issued_at desc, draw.id desc), '[]'::jsonb)
  from (
    select id, issued_at, questions from quiz_private.quiz_runs
    where user_id = auth.uid() and kind = 'module' and module_id = p_module
    order by issued_at desc, id desc limit 4
  ) draw;
$$;

create or replace function public.recent_exam_question_ids()
returns jsonb
language sql stable security definer
set search_path = pg_catalog
as $$
  select coalesce(jsonb_agg(distinct q->>'id'), '[]'::jsonb)
  from (
    select questions from quiz_private.quiz_runs
    where user_id = auth.uid() and kind = 'exam'
    order by issued_at desc, id desc limit 3
  ) recent
  cross join lateral jsonb_array_elements(recent.questions) q;
$$;

create or replace function public.issue_module_restart(
  p_user uuid, p_original uuid, p_module text, p_questions jsonb
) returns uuid
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  prior quiz_private.quiz_runs;
  replacement uuid;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text), 621);
  select * into prior from quiz_private.quiz_runs
    where id = p_original and user_id = p_user and kind = 'module' and module_id = p_module
      and result is null and issued_at >= clock_timestamp() - interval '4 hours'
    for update;
  if not found then raise exception 'module restart unavailable'; end if;
  if prior.restarted_as is not null then return prior.restarted_as; end if;
  replacement := public.issue_quiz_run(p_user, prior.mode, 'module', p_questions, 0, prior.module_id, prior.pass_threshold, null);
  update quiz_private.quiz_runs set restarted_as = replacement where id = p_original;
  return replacement;
end;
$$;

create table if not exists quiz_private.daily_quiz_questions (
  day date primary key,
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) = 10)
);
alter table quiz_private.daily_quiz_questions enable row level security;

create or replace function public.daily_quiz_snapshot(p_day date, p_questions jsonb)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  chosen jsonb;
begin
  if p_questions is not null then
    if p_day <> (clock_timestamp() at time zone 'Europe/Paris')::date then
      raise exception 'daily challenge date has changed';
    end if;
    insert into quiz_private.daily_quiz_questions(day, questions)
      values (p_day, p_questions)
      on conflict (day) do nothing;
  end if;
  select questions into chosen from quiz_private.daily_quiz_questions where day = p_day;
  return chosen;
end;
$$;

revoke all on function public.recent_module_draws(text) from public, anon;
grant execute on function public.recent_module_draws(text) to authenticated;
revoke all on function public.issue_module_restart(uuid, uuid, text, jsonb), public.daily_quiz_snapshot(date, jsonb) from public, anon, authenticated;
grant execute on function public.issue_module_restart(uuid, uuid, text, jsonb), public.daily_quiz_snapshot(date, jsonb) to service_role;

commit;
