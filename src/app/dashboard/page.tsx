"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Profile = {
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select("display_name, xp, level, streak_days")
          .eq("id", user.id)
          .maybeSingle();
        if (!active) return;
        if (pErr) setError("Impossible de charger ton profil : " + pErr.message);
        else setProfile(p as Profile | null);
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

  const stats: [string, string][] = profile
    ? [
        ["Niveau", String(profile.level)],
        ["XP", String(profile.xp)],
        ["Série", `${profile.streak_days} j`],
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
          <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
            {stats.map(([label, value]) => (
              <div key={label} className="bg-ink p-5">
                <div className="text-sm text-muted">{label}</div>
                <div className="mt-2 font-mono text-3xl">{value}</div>
              </div>
            ))}
          </div>
        )}

        {email && (
          <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
            Ton compte est créé et connecté. Les quiz, la progression par catégorie et l’historique
            s’afficheront ici dès qu’ils seront prêts.
          </p>
        )}
      </main>
    </div>
  );
}
