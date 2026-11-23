-- À exécuter dans Supabase → SQL Editor. Les résultats servent à l’audit de la banque historique.
begin read only;

select category_id, difficulty,
       count(*) as questions,
       count(*) filter (where kind::text = 'conjunctural') as questions_datees
from public.questions
group by category_id, difficulty
order by category_id, difficulty;

select lower(regexp_replace(trim(prompt), '\s+', ' ', 'g')) as enonce,
       array_agg(id::text order by id::text) as identifiants
from public.questions
where prompt is not null
group by 1
having count(*) > 1
order by 1;

select id, category_id, difficulty, kind, reference_date, prompt
from public.questions
where (kind::text = 'conjunctural' and (difficulty::text = 'beginner' or reference_date is null))
   or (difficulty::text = 'beginner' and prompt ~* 'du jour|actuellement|cette semaine|aujourd.hui|derni[èe]re cotation')
order by category_id, id;

commit;
