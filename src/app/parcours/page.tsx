"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { levelName, levelProgress } from "@/lib/progress";
import { todayParis } from "@/lib/rng";
import { PASS_THRESHOLD } from "@/lib/config";
import {
  GUEST_MODULE,
  LEVELS,
  MODULES,
  computeStatuses,
  nextOpenModule,
  previousModule,
  modulePosition,
  type Module,
  type Progress,
  type Status,
} from "@/lib/modules";

type Profile = {
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
  placement_level: string | null;
  last_daily_date: string | null;
};

function Dot({ status, n }: { status: Status | "guest-open"; n: string }) {
  const base = "flex size-11 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold";
  if (status === "validated" || status === "placed") return <span className={`${base} bg-accent text-ink`}>✓</span>;
  if (status === "open" || status === "guest-open") return <span className={`${base} border-[3px] border-accent text-accent`}>{n}</span>;
  return <span className={`${base} bg-line text-muted`}>{n}</span>;
}

export default function Parcours() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [due, setDue] = useState(0);
  const [today, setToday] = useState("");
  const [setupMissing, setSetupMissing] = useState(false);
  const [modulesMissing, setModulesMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supabaseConfigured()) {
          if (active) setGuest(true);
          return;
        }
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) {
          if (active) setGuest(true);
          return;
        }
        const iso = new Date().toISOString();
        const [p, mp, dueRes] = await Promise.all([
          supabase.from("profiles").select("display_name, xp, level, streak_days, placement_level, last_daily_date").eq("id", user.id).maybeSingle(),
          supabase.from("module_progress").select("module_id, passed, best_pct, attempts").eq("user_id", user.id),
          supabase.from("question_reviews").select("question_id", { count: "exact", head: true }).eq("user_id", user.id).lte("due_at", iso),
        ]);
        if (!active) return;
        if (p.error) {
          const base = await supabase.from("profiles").select("display_name, xp, level, streak_days").eq("id", user.id).maybeSingle();
          if (!active) return;
          if (base.error) setError("Impossible de charger ton profil : " + base.error.message);
          else setProfile({ ...(base.data as Profile), placement_level: null, last_daily_date: null });
          setSetupMissing(true);
        } else setProfile(p.data as Profile | null);
        if (mp.error) setModulesMissing(true);
        else {
          const pr: Progress = {};
          for (const r of (mp.data ?? []) as { module_id: string; passed: boolean; best_pct: number; attempts: number }[]) {
            pr[r.module_id] = { passed: r.passed, best_pct: r.best_pct, attempts: r.attempts };
          }
          setProgress(pr);
        }
        setDue(dueRes.count ?? 0);
        setToday(todayParis());
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Erreur inconnue.");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const placement = profile?.placement_level ?? null;
  const statuses = computeStatuses(progress, guest ? null : placement);
  const next = nextOpenModule(statuses);
  const lp = profile ? levelProgress(profile.xp ?? 0) : null;
  const dailyDone = !!profile && profile.last_daily_date === today && today !== "";
  const validatedCount = MODULES.filter((m) => statuses[m.id] === "validated" || statuses[m.id] === "placed").length;
  const readyCount = MODULES.filter((m) => m.ready).length;

  function renderRow(m: Module) {
    const st = statuses[m.id];
    const prog = progress[m.id];
    const isGuestOpen = guest && m.id === GUEST_MODULE && m.ready;
    const isGuestLocked = guest && !isGuestOpen && m.ready;
    const n = String(modulePosition(m));

    let tag = "";
    let tagClass = "text-muted";
    if (guest) {
      tag = isGuestOpen ? "Sans compte" : m.ready ? "Compte requis" : "En préparation";
      if (isGuestOpen) tagClass = "text-accent";
    } else if (st === "validated") {
      tag = `VALIDÉ · ${prog?.best_pct ?? ""} %`;
      tagClass = "text-accent";
    } else if (st === "placed") {
      tag = "VALIDÉ · test de niveau";
      tagClass = "text-accent";
    } else if (st === "open") {
      tag = prog ? `EN COURS · meilleur ${prog.best_pct} %` : "À FAIRE";
      tagClass = "text-warn";
    } else if (st === "soon") tag = "En préparation";
    else tag = "Verrouillé";

    const clickable = guest ? isGuestOpen || isGuestLocked : st === "open" || st === "validated" || st === "placed";
    const href = guest && !isGuestOpen ? "/inscription" : `/module?id=${m.id}`;
    const body = (
      <div className={`flex items-center gap-4 rounded-2xl px-3 py-3 ${st === "open" || isGuestOpen ? "bg-panel ring-2 ring-accent" : ""} ${!clickable ? "opacity-55" : ""}`}>
        <Dot status={isGuestOpen ? "guest-open" : guest ? "locked" : st} n={n} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{m.title}</p>
          <p className="truncate text-sm text-muted">
            {!guest && st === "locked" ? `Valide d’abord « ${previousModule(m.id, statuses)?.title} »` : m.goal}
          </p>
        </div>
        <span className={`hidden shrink-0 font-mono text-xs sm:block ${tagClass}`}>{tag}</span>
      </div>
    );
    return <li key={m.id}>{clickable ? <Link href={href} className="block">{body}</Link> : body}</li>;
  }

  return (
    <AppShell>
      <main className="py-8 sm:py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Parcours</h1>
        {error && <div role="alert" className="border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">{error}</div>}
        {!profile && !error && !guest && <p className="text-sm text-muted">Chargement…</p>}

        {guest && (
          <div className="fade-in">
            <p className="max-w-xl text-muted">
              4 niveaux, 22 modules à valider dans l’ordre : un cours court, un mini-check, puis un quiz noté ({PASS_THRESHOLD} % pour valider).
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={`/module?id=${GUEST_MODULE}`} className="bg-accent px-6 py-4 text-center text-sm font-semibold text-ink hover:brightness-110">
                Essayer le module 1 sans compte →
              </Link>
              <Link href="/invite" className="border border-line px-5 py-4 text-center text-sm hover:border-muted">Quiz rapide : 5 questions</Link>
              <Link href="/examen-blanc" className="border border-line px-5 py-4 text-center text-sm hover:border-muted">Examen blanc</Link>
              <Link href="/inscription" className="border border-line px-5 py-4 text-center text-sm hover:border-muted">Créer un compte</Link>
            </div>
          </div>
        )}

        {setupMissing && profile && (
          <div role="status" className="mb-6 border-l-2 border-warn bg-panel px-4 py-3 text-sm leading-relaxed">
            Ta progression (XP, série) n’est pas encore activée : exécute le fichier <span className="font-mono">lot-1-progression.sql</span> dans Supabase (SQL Editor).
          </div>
        )}
        {modulesMissing && profile && (
          <div role="status" className="mb-6 border-l-2 border-warn bg-panel px-4 py-3 text-sm leading-relaxed">
            Les modules ne sont pas encore activés : exécute le fichier <span className="font-mono">lot-4-modules.sql</span> dans Supabase (SQL Editor).
          </div>
        )}

        {profile && lp && (
          <div className="fade-in">
            <section className="border border-line bg-panel p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted">NIVEAU {lp.level}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{levelName(lp.level)}</p>
                </div>
                <div className="flex gap-6 font-mono text-sm">
                  <div><span className="text-2xl">{profile.streak_days}</span> <span className="text-muted">j de série</span></div>
                  <div><span className="text-2xl">{profile.xp}</span> <span className="text-muted">XP</span></div>
                  <div><span className="text-2xl">{validatedCount}/{MODULES.length}</span> <span className="text-muted">modules</span></div>
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-line">
                <div className="bar-fill h-full bg-accent" style={{ width: `${lp.pct}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-xs text-muted">{lp.into} / {lp.span} XP vers le niveau {lp.level + 1}</p>

              {next ? (
                <Link href={`/module?id=${next.id}`} className="mt-6 block bg-accent px-5 py-4 text-ink hover:brightness-110">
                  <span className="block text-base font-semibold">Continuer : {next.title} →</span>
                  <span className="mt-0.5 block text-sm opacity-80">
                    {LEVELS.find((l) => l.id === next.level)?.name} · module {modulePosition(next)} · {next.goal}
                  </span>
                </Link>
              ) : (
                <p className="mt-6 border-l-2 border-accent bg-ink px-4 py-3 text-sm">
                  {validatedCount >= readyCount ? "Tous les modules disponibles sont validés. De nouveaux modules arrivent bientôt." : "Aucun module à continuer pour le moment."}
                </p>
              )}
            </section>

            {!placement && validatedCount === 0 && (
              <Link href="/test-niveau" className="mt-4 block border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">TU CONNAIS DÉJÀ LES BASES ?</p>
                <p className="mt-1 font-semibold">Test de niveau : 8 questions, sauter les modules que tu maîtrises →</p>
              </Link>
            )}

            <section className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link href="/quiz?mode=daily" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">DAILY CHALLENGE</p>
                <p className="mt-1 font-semibold">{dailyDone ? "Fait aujourd’hui ✓" : "À faire : +25 XP"}</p>
              </Link>
              <Link href="/quiz?mode=weakness" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">À REVOIR</p>
                <p className="mt-1 font-semibold">{due > 0 ? `${due} question${due > 1 ? "s" : ""} à revoir` : "Rien à revoir pour l’instant"}</p>
              </Link>
              <Link href="/entrainement" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">ENTRAÎNEMENT LIBRE</p>
                <p className="mt-1 font-semibold">Quiz, jeux chronométrés, cours</p>
              </Link>
              <Link href="/examen-blanc" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">20 QUESTIONS · 45 S PAR QUESTION</p>
                <p className="mt-1 font-semibold">Examen blanc</p>
              </Link>
              <Link href="/favoris" className="border border-line p-4 hover:border-accent">
                <p className="mt-1 font-semibold">Mes questions favorites</p>
              </Link>
            </section>
          </div>
        )}

        {(profile || guest) && (
          <div className="mt-10 space-y-10">
            {LEVELS.map((l, li) => {
              const mods = MODULES.filter((m) => m.level === l.id);
              const done = mods.filter((m) => statuses[m.id] === "validated" || statuses[m.id] === "placed").length;
              return (
                <section key={l.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                    <h2 className="text-xl font-semibold">
                      <span className="mr-2 font-mono text-sm text-accent">NIVEAU {li + 1}</span>
                      {l.name}
                    </h2>
                    <span className="font-mono text-xs text-muted">{guest ? `${mods.length} modules` : `${done}/${mods.length} validés`}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{l.tagline}</p>
                  <ol className="mt-3 space-y-1">
                    {mods.map((m) => renderRow(m))}
                  </ol>
                </section>
              );
            })}
          </div>
        )}

        {profile && (
          <p className="mt-10 text-sm text-muted">
            Tes statistiques et tes badges sont dans ton <Link href="/profil" className="text-fg underline underline-offset-4 hover:text-accent">Profil</Link>.
          </p>
        )}
      </main>
    </AppShell>
  );
}
