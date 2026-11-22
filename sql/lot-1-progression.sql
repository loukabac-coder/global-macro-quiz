-- =====================================================================
-- GLOBAL MACRO QUIZ : Lot 1, progression (XP, niveaux, série, répétition espacée, badges)
-- À coller UNE FOIS dans Supabase > SQL Editor > Run. Peut être relancé sans risque.
-- =====================================================================

-- 1) Colonnes supplémentaires sur le profil
alter table public.profiles add column if not exists last_active_date date;
alter table public.profiles add column if not exists last_daily_date date;
alter table public.profiles add column if not exists placement_level text;

-- 2) Répétition espacée : une ligne par utilisateur et par question
create table if not exists public.question_reviews (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  question_id text        not null,
  box         int         not null default 0,
  due_at      timestamptz not null default now(),
  lapses      int         not null default 0,
  seen        int         not null default 0,
  last_seen   timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 3) Statistiques par catégorie et par niveau
create table if not exists public.category_stats (
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  difficulty  text not null,
  answered    int  not null default 0,
  correct     int  not null default 0,
  primary key (user_id, category_id, difficulty)
);

-- 4) Badges débloqués
create table if not exists public.user_badges (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  code        text        not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- 5) Sécurité : chaque utilisateur ne voit que ses lignes, et ne peut RIEN écrire directement
alter table public.question_reviews enable row level security;
alter table public.category_stats   enable row level security;
alter table public.user_badges      enable row level security;

drop policy if exists "reviews_select_own" on public.question_reviews;
drop policy if exists "stats_select_own"   on public.category_stats;
drop policy if exists "badges_select_own"  on public.user_badges;
create policy "reviews_select_own" on public.question_reviews for select to authenticated using (user_id = auth.uid());
create policy "stats_select_own"   on public.category_stats   for select to authenticated using (user_id = auth.uid());
create policy "badges_select_own"  on public.user_badges      for select to authenticated using (user_id = auth.uid());

grant select on public.question_reviews to authenticated;
grant select on public.category_stats   to authenticated;
grant select on public.user_badges      to authenticated;

-- 6) Fonction qui enregistre une session : calcule les XP, la série, le niveau, la répétition espacée et les badges
create or replace function public.submit_session(p_mode text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid        uuid := auth.uid();
  today      date := (now() at time zone 'Europe/Paris')::date;
  prof       public.profiles%rowtype;
  a          jsonb;
  n          int := 0;
  total_n    int := 0;
  correct_n  int := 0;
  xp_gain    int := 0;
  one_xp     int;
  base_xp    int;
  diff       text;
  cat        text;
  qid        text;
  ok         boolean;
  secs       numeric;
  cur_box    int;
  new_box    int;
  intervals  int[] := array[0,1,2,4,7,15,30,60];
  new_streak int;
  new_xp     int;
  new_level  int;
  first_today boolean;
  rc         int;
  unlocked   text[] := '{}';
  tot_ans    int;
  mental_ok  int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then raise exception 'invalid answers'; end if;

  select * into prof from public.profiles where id = uid for update;
  if not found then raise exception 'profile missing'; end if;

  for a in select * from jsonb_array_elements(p_answers) loop
    n := n + 1;
    exit when n > 40;

    ok   := coalesce((a->>'ok')::boolean, false);
    secs := coalesce((a->>'seconds')::numeric, 30);
    diff := coalesce(a->>'difficulty', 'beginner');
    if diff not in ('beginner','intermediate','advanced','expert') then diff := 'beginner'; end if;
    cat  := coalesce(a->>'category', 'divers');
    if cat !~ '^[a-z0-9-]{1,40}$' then cat := 'divers'; end if;
    qid  := a->>'qid';

    base_xp := case diff when 'beginner' then 4 when 'intermediate' then 7 when 'advanced' then 11 else 16 end;
    if ok then
      one_xp := base_xp;
      if p_mode = 'challenge' and secs <= 6 then one_xp := one_xp + 2; end if;
      correct_n := correct_n + 1;
    else
      one_xp := 1;
    end if;
    xp_gain := xp_gain + one_xp;
    total_n := total_n + 1;

    -- statistiques par catégorie / niveau
    insert into public.category_stats(user_id, category_id, difficulty, answered, correct)
    values (uid, cat, diff, 1, case when ok then 1 else 0 end)
    on conflict (user_id, category_id, difficulty)
    do update set answered = public.category_stats.answered + 1,
                  correct  = public.category_stats.correct + case when ok then 1 else 0 end;

    -- répétition espacée (questions de la base uniquement)
    if qid is not null and qid <> '' and qid !~ '^(gen|live|macro):' and length(qid) <= 64 then
      select box into cur_box from public.question_reviews where user_id = uid and question_id = qid;
      if not found then cur_box := 0; end if;
      if ok then
        new_box := least(cur_box + 1, 7);
        insert into public.question_reviews(user_id, question_id, box, due_at, lapses, seen, last_seen)
        values (uid, qid, new_box, now() + (intervals[new_box + 1]::text || ' days')::interval, 0, 1, now())
        on conflict (user_id, question_id)
        do update set box = new_box,
                      due_at = now() + (intervals[new_box + 1]::text || ' days')::interval,
                      seen = public.question_reviews.seen + 1,
                      last_seen = now();
      else
        insert into public.question_reviews(user_id, question_id, box, due_at, lapses, seen, last_seen)
        values (uid, qid, 0, now(), 1, 1, now())
        on conflict (user_id, question_id)
        do update set box = 0, due_at = now(),
                      lapses = public.question_reviews.lapses + 1,
                      seen = public.question_reviews.seen + 1,
                      last_seen = now();
      end if;
    end if;
  end loop;

  if total_n = 0 then raise exception 'no answers'; end if;
  xp_gain := least(xp_gain, 160);

  -- série de jours
  first_today := prof.last_active_date is distinct from today;
  if prof.last_active_date = today then
    new_streak := greatest(prof.streak_days, 1);
  elsif prof.last_active_date = today - 1 then
    new_streak := coalesce(prof.streak_days, 0) + 1;
  else
    new_streak := 1;
  end if;

  -- bonus : première session du jour, et Daily Challenge (une fois par jour)
  if first_today then xp_gain := xp_gain + 10; end if;
  if p_mode = 'daily' and prof.last_daily_date is distinct from today then
    xp_gain := xp_gain + 25;
    prof.last_daily_date := today;
  end if;

  new_xp    := coalesce(prof.xp, 0) + xp_gain;
  new_level := floor(sqrt(new_xp / 60.0))::int + 1;

  update public.profiles
     set xp = new_xp, level = new_level, streak_days = new_streak,
         last_active_date = today, last_daily_date = prof.last_daily_date
   where id = uid;

  -- badges
  select coalesce(sum(answered), 0) into tot_ans from public.category_stats where user_id = uid;
  select coalesce(sum(correct), 0) into mental_ok from public.category_stats where user_id = uid and category_id = 'mental-math';

  insert into public.user_badges(user_id, code) values (uid, 'first_session') on conflict do nothing;
  get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'first_session'); end if;

  if new_streak >= 3 then
    insert into public.user_badges(user_id, code) values (uid, 'streak_3') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'streak_3'); end if;
  end if;
  if new_streak >= 7 then
    insert into public.user_badges(user_id, code) values (uid, 'streak_7') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'streak_7'); end if;
  end if;
  if new_streak >= 30 then
    insert into public.user_badges(user_id, code) values (uid, 'streak_30') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'streak_30'); end if;
  end if;
  if tot_ans >= 100 then
    insert into public.user_badges(user_id, code) values (uid, 'answers_100') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'answers_100'); end if;
  end if;
  if tot_ans >= 500 then
    insert into public.user_badges(user_id, code) values (uid, 'answers_500') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'answers_500'); end if;
  end if;
  if total_n >= 10 and correct_n = total_n then
    insert into public.user_badges(user_id, code) values (uid, 'perfect_10') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'perfect_10'); end if;
  end if;
  if mental_ok >= 50 then
    insert into public.user_badges(user_id, code) values (uid, 'mental_50') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'mental_50'); end if;
  end if;
  if new_level >= 5 then
    insert into public.user_badges(user_id, code) values (uid, 'level_5') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'level_5'); end if;
  end if;
  if p_mode = 'daily' then
    insert into public.user_badges(user_id, code) values (uid, 'daily_done') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'daily_done'); end if;
  end if;
  if p_mode = 'challenge' and correct_n >= 8 and total_n >= 10 then
    insert into public.user_badges(user_id, code) values (uid, 'games_8') on conflict do nothing;
    get diagnostics rc = row_count; if rc > 0 then unlocked := array_append(unlocked, 'games_8'); end if;
  end if;

  return jsonb_build_object(
    'xp_gained', xp_gain, 'xp', new_xp, 'level', new_level,
    'streak', new_streak, 'first_today', first_today, 'unlocked', to_jsonb(unlocked)
  );
end;
$$;

-- 7) Enregistre le niveau du test de départ
create or replace function public.set_placement(p_level text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_level not in ('debutant','intermediaire','avance') then raise exception 'invalid level'; end if;
  update public.profiles set placement_level = p_level where id = auth.uid();
end;
$$;

revoke all on function public.submit_session(text, jsonb) from public, anon;
revoke all on function public.set_placement(text) from public, anon;
grant execute on function public.submit_session(text, jsonb) to authenticated;
grant execute on function public.set_placement(text) to authenticated;

-- Vérification : doit afficher 2 lignes
select proname from pg_proc where proname in ('submit_session','set_placement');
