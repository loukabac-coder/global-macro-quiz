-- Après les lots 1, 4, 5 et 6. Conservation des identifiants de progression historiques.
begin;
do $migration$
declare c record;
begin
  for c in select conname from pg_constraint
    where conrelid = 'quiz_private.quiz_runs'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%module_id IS NOT NULL%'
  loop
    execute format('alter table quiz_private.quiz_runs drop constraint %I', c.conname);
  end loop;
end;
$migration$;

alter table quiz_private.quiz_runs add constraint quiz_runs_module_format check (
  kind <> 'module' or (
    module_id is not null and pass_threshold is not null and pass_threshold between 1 and 100 and
    jsonb_array_length(questions) = case
      when module_id like 'p:%:synthese' then 8
      when module_id like 'p:%' then 5
      else 10
    end
  )
);

alter table quiz_private.quiz_runs drop constraint if exists quiz_runs_exam_format;
alter table quiz_private.quiz_runs add constraint quiz_runs_exam_format check (
  (kind = 'exam' and mode = 'training' and jsonb_array_length(questions) = 20 and time_limit = 45)
  or (kind <> 'exam' and jsonb_array_length(questions) between 1 and 15 and (
    time_limit in (0, 15, 20, 30) or (kind = 'standard' and mode = 'training' and time_limit in (45, 60, 75))
  ))
);
commit;
