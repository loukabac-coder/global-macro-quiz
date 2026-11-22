"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import { CATS } from "@/lib/categories";
import type { StatRow } from "@/lib/progress";

const LEVELS: [string, string][] = [
  ["", "Tous niveaux"],
  ["beginner", "Débutant"],
  ["intermediate", "Intermédiaire"],
  ["advanced", "Avancé"],
  ["expert", "Expert"],
];

function Card({ href, title, text, tag, locked }: { href: string; title: string; text: string; tag?: string; locked?: boolean }) {
  if (locked) {
    return (
      <Link href="/inscription" className="block border border-line p-4 opacity-70 transition-colors hover:border-muted">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-muted">{title}</span>
          <span className="font-mono text-xs text-muted">Compte requis</span>
        </div>
        <p className="mt-1.5 text-sm leading-snug text-muted">{text}</p>
      </Link>
    );
  }
  return (
    <Link href={href} className="block border border-line bg-panel p-4 transition-colors hover:border-accent">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{title}</span>
        {tag && <span className="font-mono text-xs text-warn">{tag}</span>}
      </div>
      <p className="mt-1.5 text-sm leading-snug text-muted">{text}</p>
    </Link>
  );
}

export default function Entrainement() {
  const [logged, setLogged] = useState<boolean | null>(null);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [level, setLevel] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setLogged(!!data.session);
        if (!data.session) return;
        const res = await supabase.from("category_stats").select("category_id, difficulty, answered, correct");
        if (active && res.data) setStats(res.data as StatRow[]);
      } catch {
        if (active) setLogged(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  const lock = logged === false;

  function acc(cat: string): string {
    const rows = stats.filter((s) => s.category_id === cat);
    const a = rows.reduce((x, r) => x + r.answered, 0);
    const c = rows.reduce((x, r) => x + r.correct, 0);
    return a ? `${Math.round((c / a) * 100)} % · ${a}` : "—";
  }

  return (
    <AppShell>
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Entraînement libre</h1>
        <p className="mt-2 max-w-xl text-muted">
          {lock ? "Les modes d’entraînement du site." : "Tous les modes, sans verrou."} Choisis selon ton temps et ton envie. Pour avancer pas à pas, passe plutôt par le <Link href="/parcours" className="text-fg underline underline-offset-4 hover:text-accent">Parcours</Link>.
        </p>
        {lock && (
          <p className="mt-4 border-l-2 border-warn bg-panel px-3 py-2.5 text-sm text-muted">
            Sans compte, tu peux faire le quiz rapide et le défi du jour. <Link href="/inscription" className="text-fg underline underline-offset-4 hover:text-accent">Crée un compte</Link> pour tout débloquer.
          </p>
        )}

        <h2 className="mt-8 font-mono text-xs text-accent">EN 2 MINUTES</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card href={lock ? "/invite" : "/quiz"} title="Quick Quiz" text={lock ? "5 questions pour te faire une idée, sans compte." : "10 questions au hasard, avec la correction détaillée."} />
          <Card href="/quiz?mode=daily" title="Daily Challenge" tag="+25 XP" text="Les mêmes 10 questions pour tout le monde, une fois par jour." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">POUR PROGRESSER</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card locked={lock} href="/quiz?mode=weakness" title="Weakness Training" text="Les questions que tu rates reviennent au bon moment (répétition espacée), avec tes catégories faibles." />
          <Card locked={lock} href="/quiz?mode=mixed" title="Mixed" text="15 questions, toutes catégories mélangées." />
          <Card locked={lock} href="/calcul-mental" title="Calcul mental infini" text="Pourcentages, variations, intérêts composés, devises, bps, règle de 72. Générés à la volée, niveaux 1 à 5." />
          <Card locked={lock} href="/test-niveau" title="Test de niveau" text="12 questions pour te placer dans le parcours." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">CHRONOMÉTRÉ · FINANCE GAMES</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card locked={lock} href="/jeux?mode=calcul" title="Calcul éclair" tag="20–30 s" text="Calcul mental sous pression." />
          <Card locked={lock} href="/jeux?mode=ordres" title="Ordres de grandeur" tag="30 s" text="PIB, capitalisations, ratios." />
          <Card locked={lock} href="/jeux?mode=culture" title="Culture marchés" tag="15 s" text="QCM et vrai/faux rapides." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">PAR CATÉGORIE</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {LEVELS.map(([v, label]) => (
            <button key={v} onClick={() => setLevel(v)} disabled={lock} className={`border px-3 py-1.5 ${level === v ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"} disabled:opacity-50`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
          {CATS.map(([id, name]) =>
            lock ? (
              <Link key={id} href="/inscription" className="bg-ink p-4 opacity-70 hover:bg-panel">
                <div className="font-semibold text-muted">{name}</div>
                <div className="mt-1 font-mono text-xs text-muted">Compte requis</div>
              </Link>
            ) : (
              <Link key={id} href={`/quiz?categorie=${id}${level ? `&niveau=${level}` : ""}`} className="bg-ink p-4 hover:bg-panel">
                <div className="font-semibold">{name}</div>
                <div className="mt-1 font-mono text-xs text-muted">réussite · réponses : {acc(id)}</div>
              </Link>
            ),
          )}
        </div>
      </main>
    </AppShell>
  );
}
