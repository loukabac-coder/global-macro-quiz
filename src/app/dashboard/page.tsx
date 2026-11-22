"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Profile = {
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
};

type Counts = { total: number; good: number };

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [counts, setCounts] = useState<Counts>({ total: 0, good: 0 });
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
        if (!active) return;
        setEmail(user.email ?? null);
        const [p, all, good] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, xp, level, streak_days")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.from("attempts").select("id", { count: "exact", head: true }),
          supabase.from("attempts").select("id", { count: "exact", head: true }).eq("is_correct", true),
        ]);
        if (!active) return;
        if (p.error) setError("Impossible de charger ton profil : " + p.error.message);
        else setProfile(p.data as Profile | null);
        setCounts({ total: all.count ?? 0, good: good.count ?? 0 });
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Erreur inconnue.");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  const rate = counts.total > 0 ? `${Math.round((counts.good / counts.total) * 100)} %` : "–";
  const stats: [string, string][] = profile
    ? [
        ["Niveau", String(profile.level)],
        ["XP", String(profile.xp)],
        ["Série", `${profile.streak_days} j`],
        ["Réponses", String(counts.total)],
        ["Réussite", rate],
      ]
    : [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </span>
          <button onClick={signOut} className="border border-line px-3 py-1.5 text-sm hover:border-muted">
            Se déconnecter
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Ton tableau de bord</h1>
        {email && <p className="mt-2 font-mono text-sm text-muted">{email}</p>}

        {error && (
          <div role="alert" className="mt-8 border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">
            {error}
          </div>
        )}
        {!email && !error && <p className="mt-8 text-sm text-muted">Chargement…</p>}

        {profile && (
          <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5">
            {stats.map(([label, value]) => (
              <div key={label} className="bg-ink p-5">
                <div className="text-sm text-muted">{label}</div>
                <div className="mt-2 font-mono text-3xl">{value}</div>
              </div>
            ))}
          </div>
        )}

        {email && (
          <div className="mt-10 border border-line bg-panel p-6">
            <h2 className="text-lg font-semibold">Quick Quiz</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Dix questions tirées au hasard dans toutes les catégories, avec correction détaillée à
              chaque réponse.
            </p>
            <Link
              href="/quiz"
              className="mt-5 inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110"
            >
              Lancer un Quick Quiz
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
