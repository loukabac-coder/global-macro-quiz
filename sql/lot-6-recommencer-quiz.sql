-- Appliquer après le Lot 5.
begin;

alter table quiz_private.quiz_runs add column if not exists restarted_as uuid;

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
  if not found or run.restarted_as is not null then raise exception 'quiz session unavailable'; end if;
  if run.result is null and run.issued_at < clock_timestamp() - interval '4 hours' then
    raise exception 'quiz session expired';
  end if;
  return run;
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
  resumed_id uuid := p_run;
begin
  -- Le navigateur peut encore détenir le premier identifiant après une coupure réseau.
  loop
    select * into run from quiz_private.quiz_runs
      where id = resumed_id and user_id = auth.uid() and kind <> 'exam';
    if not found then return null; end if;
    exit when run.restarted_as is null;
    resumed_id := run.restarted_as;
  end loop;
  if run.issued_at < clock_timestamp() - interval '4 hours' then return null; end if;

  select jsonb_agg(q || '{"correct":null,"explanation":"","wrong_explanations":null}'::jsonb order by position)
    into visible from jsonb_array_elements(run.questions) with ordinality as v(q, position);
  select coalesce(jsonb_agg(a || jsonb_build_object('question', run.questions -> (position::int - 1)) order by position), '[]'::jsonb)
    into feedback from jsonb_array_elements(run.answers) with ordinality as f(a, position);
  return jsonb_build_object(
    'id', run.id, 'questions', visible, 'feedback', feedback, 'timeLimit', run.time_limit, 'summary', run.result,
    'issuedSeconds', extract(epoch from clock_timestamp() - run.issued_at),
    'questionSeconds', extract(epoch from clock_timestamp() - run.question_started_at)
  );
end;
$$;

create or replace function public.restart_quiz_run(p_run uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  uid uuid := auth.uid();
  run quiz_private.quiz_runs;
  replacement uuid;
begin
  if uid is null then raise exception 'authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text), 621);
  select * into run from quiz_private.quiz_runs where id = p_run and user_id = uid for update;
  if not found or run.kind = 'exam' or run.result is not null then raise exception 'quiz restart unavailable'; end if;

  if run.restarted_as is null then
    if run.issued_at < clock_timestamp() - interval '4 hours' then raise exception 'quiz session expired'; end if;
    replacement := public.issue_quiz_run(
      uid, run.mode, run.kind, run.questions, run.time_limit, run.module_id, run.pass_threshold, run.daily_date
    );
    perform public.start_quiz_question(replacement, 0);
    update quiz_private.quiz_runs set restarted_as = replacement where id = p_run;
  end if;

  return public.resume_quiz_run(p_run);
end;
$$;

revoke all on function public.restart_quiz_run(uuid) from public, anon;
grant execute on function public.restart_quiz_run(uuid) to authenticated;

commit;
