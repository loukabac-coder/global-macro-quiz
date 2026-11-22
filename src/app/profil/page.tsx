"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import { BADGES } from "@/lib/badges";
import { levelName, levelProgress, type StatRow } from "@/lib/progress";
import { CAT_NAME } from "@/lib/categories";

type Profile = { display_name: string | null; xp: number; streak_days: number };
type Session = { id: string; mode: string; finished_at: string; score: number; total: number };
const MODES: Record<string, string> = {
  quick: "Quiz rapide ou test de niveau", training: "Entraînement ou module", challenge: "Finance Games",
  daily: "Défi du jour", mixed: "Quiz mixte", weakness: "Révision",
};
const sessionDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default function Profil() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [history, setHistory] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) {
          router.replace("/connexion?retour=%2Fprofil");
          return;
        }
        const [p, st, bd, sessions] = await Promise.all([
          supabase.from("profiles").select("display_name, xp, streak_days").eq("id", user.id).maybeSingle(),
          supabase.from("category_stats").select("category_id, difficulty, answered, correct").eq("user_id", user.id),
          supabase.from("user_badges").select("code").eq("user_id", user.id),
          supabase.from("quiz_sessions").select("id, mode, finished_at, score, total").eq("user_id", user.id).order("finished_at", { ascending: false }).limit(15),
        ]);
        if (!active) return;
        setEmail(user.email ?? null);
        if (p.error) setError("Impossible de charger ton profil.");
        else setProfile((p.data as Profile | null) ?? { display_name: null, xp: 0, streak_days: 0 });
        if (st.error || bd.error || sessions.error) setError("Une partie de la progression n’a pas pu être chargée.");
        setStats((st.data ?? []) as StatRow[]);
        setBadges(((bd.data ?? []) as { code: string }[]).map((b) => b.code));
        setHistory((sessions.data ?? []) as Session[]);
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

  const byCat = Object.keys(CAT_NAME)
    .map((id) => {
      const rows = stats.filter((s) => s.category_id === id);
      const a = rows.reduce((x, r) => x + r.answered, 0);
      const c = rows.reduce((x, r) => x + r.correct, 0);
      return { id, a, pct: a ? Math.round((c / a) * 100) : null };
    })
    .filter((r) => r.a > 0);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  return (
    <AppShell width="max-w-4xl">
      <main className="py-8 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
        {email && <p className="mt-2 font-mono text-sm text-muted">{email}</p>}
        {error && <div role="alert" className="mt-6 border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">{error}</div>}
        {!profile && !error && <p className="mt-6 text-sm text-muted">Chargement…</p>}

        {profile && lp && (
          <div className="fade-in">
            <section className="mt-6 border border-line bg-panel p-5 sm:p-6">
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
            </section>

            <section className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-3">
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

            {byCat.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">Réussite par catégorie</h2>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {byCat.map((r) => (
                    <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 text-sm">
                      <span>{CAT_NAME[r.id]}</span>
                      <span className="font-mono text-xs text-muted">{r.pct} % · {r.a} réponse{r.a > 1 ? "s" : ""}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-8">
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

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Parties récentes</h2>
              {history.length === 0 && !error && <p className="mt-2 text-sm text-muted">Aucune partie enregistrée.</p>}
              {history.length > 0 && (
                <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
                  {history.map((run) => (
                    <li key={run.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p>{MODES[run.mode] ?? run.mode}</p>
                        <time dateTime={run.finished_at} className="text-xs text-muted">{sessionDate.format(new Date(run.finished_at))}</time>
                      </div>
                      <span className="font-mono text-accent">{run.score}/{run.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <button onClick={signOut} className="mt-10 border border-line px-4 py-2.5 text-sm text-muted hover:border-muted hover:text-fg">
              Se déconnecter
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
