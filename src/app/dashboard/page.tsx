"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import { BADGES } from "@/lib/badges";
import { levelName, levelProgress } from "@/lib/progress";
import { STEPS, currentStep, stepProgress, type StatRow } from "@/lib/path";
import { CHAPTERS } from "@/lib/courses";
import { todayParis } from "@/lib/rng";

type Profile = {
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
  placement_level: string | null;
  last_daily_date: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [due, setDue] = useState(0);
  const [today, setToday] = useState("");
  const [setupMissing, setSetupMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) {
          router.replace("/connexion");
          return;
        }
        const iso = new Date().toISOString();
        const [p, st, bd, dueRes] = await Promise.all([
          supabase.from("profiles").select("display_name, xp, level, streak_days, placement_level, last_daily_date").eq("id", user.id).maybeSingle(),
          supabase.from("category_stats").select("category_id, difficulty, answered, correct"),
          supabase.from("user_badges").select("code"),
          supabase.from("question_reviews").select("question_id", { count: "exact", head: true }).lte("due_at", iso),
        ]);
        if (!active) return;
        if (p.error) {
          // colonnes ajoutées par le script SQL du Lot 1 : on retombe sur le profil de base
          const base = await supabase.from("profiles").select("display_name, xp, level, streak_days").eq("id", user.id).maybeSingle();
          if (!active) return;
          if (base.error) setError("Impossible de charger ton profil : " + base.error.message);
          else setProfile({ ...(base.data as Profile), placement_level: null, last_daily_date: null });
          setSetupMissing(true);
        } else setProfile(p.data as Profile | null);
        if (st.error) setSetupMissing(true);
        else setStats((st.data ?? []) as StatRow[]);
        setBadges(((bd.data ?? []) as { code: string }[]).map((b) => b.code));
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
  }, [router]);

  const total = stats.reduce((s, r) => s + r.answered, 0);
  const good = stats.reduce((s, r) => s + r.correct, 0);
  const rate = total ? Math.round((good / total) * 100) : 0;
  const lp = profile ? levelProgress(profile.xp ?? 0) : null;
  const placement = profile?.placement_level ?? null;
  const step = currentStep(stats, placement);
  const dailyDone = !!profile && profile.last_daily_date === today && today !== "";

  const cta = !profile
    ? null
    : !placement
      ? { href: "/test-niveau", label: "Faire le test de niveau", sub: "12 questions, 2 minutes : on te place dans le parcours." }
      : { href: step.play, label: `Continuer : étape ${step.id}, ${step.title}`, sub: step.goal };

  return (
    <AppShell>
      <main className="py-8 sm:py-10">
        {error && <div role="alert" className="border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">{error}</div>}
        {!profile && !error && <p className="text-sm text-muted">Chargement…</p>}

        {setupMissing && profile && (
          <div role="status" className="mb-6 border-l-2 border-warn bg-panel px-4 py-3 text-sm leading-relaxed">
            Ta progression (XP, série, parcours) n’est pas encore activée : exécute le fichier <span className="font-mono">lot-1-progression.sql</span> dans Supabase (SQL Editor).
          </div>
        )}

        {profile && lp && cta && (
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
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full bg-line">
                <div className="bar-fill h-full bg-accent" style={{ width: `${lp.pct}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-xs text-muted">{lp.into} / {lp.span} XP vers le niveau {lp.level + 1}</p>

              <Link href={cta.href} className="mt-6 block bg-accent px-5 py-4 text-ink hover:brightness-110">
                <span className="block text-base font-semibold">{cta.label} →</span>
                <span className="mt-0.5 block text-sm opacity-80">{cta.sub}</span>
              </Link>
            </section>

            <section className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link href="/quiz?mode=daily" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">DAILY CHALLENGE</p>
                <p className="mt-1 font-semibold">{dailyDone ? "Fait aujourd’hui ✓" : "À faire : +25 XP"}</p>
              </Link>
              <Link href="/quiz?mode=weakness" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">À REVOIR</p>
                <p className="mt-1 font-semibold">{due > 0 ? `${due} question${due > 1 ? "s" : ""} à revoir` : "Rien à revoir pour l’instant"}</p>
              </Link>
              <Link href="/jeux" className="border border-line p-4 hover:border-accent">
                <p className="font-mono text-xs text-muted">FINANCE GAMES</p>
                <p className="mt-1 font-semibold">Séries chronométrées</p>
              </Link>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold">Ton parcours</h2>
              <p className="mt-1 text-sm text-muted">Six étapes, des bases au niveau entretien. Une étape est validée quand tu atteins le nombre de réponses et le taux de réussite demandés.</p>
              <ol className="mt-4 space-y-3">
                {STEPS.map((s) => {
                  const pr = stepProgress(s, stats);
                  const isCurrent = s.id === step.id;
                  return (
                    <li key={s.id} className={`border p-4 sm:p-5 ${isCurrent ? "border-accent bg-panel" : "border-line"}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold">
                          <span className="mr-2 font-mono text-accent">{String(s.id).padStart(2, "0")}</span>
                          {s.title}
                        </h3>
                        <span className={`font-mono text-xs ${pr.done ? "text-accent" : "text-muted"}`}>
                          {pr.done ? "VALIDÉE ✓" : isCurrent ? "EN COURS" : ""}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{s.goal}</p>
                      <div className="mt-3 h-1 w-full bg-line">
                        <div className={`bar-fill h-full ${pr.done ? "bg-accent" : "bg-warn"}`} style={{ width: `${pr.volumePct}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {pr.answered}/{s.needed} réponses · réussite {pr.answered ? `${pr.acc} %` : "—"} (objectif {s.accuracy} %)
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        {s.chapters.map((slug) => {
                          const c = CHAPTERS.find((x) => x.slug === slug);
                          return c ? (
                            <Link key={slug} href={`/cours/${slug}`} className="border border-line px-3 py-1.5 text-muted hover:border-muted hover:text-fg">
                              Lire : {c.title}
                            </Link>
                          ) : null;
                        })}
                        <Link href={s.play} className="border border-accent px-3 py-1.5 text-accent hover:bg-panel">
                          {s.playLabel}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
              {[
                ["Réponses", String(total)],
                ["Réussite", total ? `${rate} %` : "—"],
                ["Badges", `${badges.length}/${Object.keys(BADGES).length}`],
              ].map(([l, v]) => (
                <div key={l} className="bg-ink p-5">
                  <div className="text-sm text-muted">{l}</div>
                  <div className="mt-2 font-mono text-3xl">{v}</div>
                </div>
              ))}
            </section>

            <section className="mt-6">
              <h2 className="text-lg font-semibold">Badges</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(BADGES).map(([code, b]) => {
                  const on = badges.includes(code);
                  return (
                    <li key={code} className={`border px-3 py-2.5 text-sm ${on ? "border-accent" : "border-line text-muted opacity-60"}`}>
                      <span className="font-semibold">{on ? "✓ " : ""}{b.label}</span>
                      <span className="block text-xs text-muted">{b.text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
