"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import type { StatRow } from "@/lib/path";

const CATS: [string, string][] = [
  ["mental-math", "Calcul mental"],
  ["market-caps", "Capitalisations"],
  ["financial-markets", "Marchés financiers"],
  ["central-banks", "Banques centrales"],
  ["monetary-policy", "Politique monétaire"],
  ["macroeconomics", "Macroéconomie"],
  ["fx", "Change"],
  ["commodities", "Matières premières"],
  ["macro-guesstimates", "Ordres de grandeur"],
];

const LEVELS: [string, string][] = [
  ["", "Tous niveaux"],
  ["beginner", "Débutant"],
  ["intermediate", "Intermédiaire"],
  ["advanced", "Avancé"],
  ["expert", "Expert"],
];

function Card({ href, title, text, tag }: { href: string; title: string; text: string; tag?: string }) {
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

export default function Jouer() {
  const router = useRouter();
  const [stats, setStats] = useState<StatRow[]>([]);
  const [level, setLevel] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/connexion");
        return;
      }
      const res = await supabase.from("category_stats").select("category_id, difficulty, answered, correct");
      if (active && res.data) setStats(res.data as StatRow[]);
    }
    run();
    return () => {
      active = false;
    };
  }, [router]);

  function acc(cat: string): string {
    const rows = stats.filter((s) => s.category_id === cat);
    const a = rows.reduce((x, r) => x + r.answered, 0);
    const c = rows.reduce((x, r) => x + r.correct, 0);
    return a ? `${Math.round((c / a) * 100)} % · ${a}` : "—";
  }

  return (
    <AppShell>
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Jouer</h1>
        <p className="mt-2 text-muted">Un mode pour chaque besoin. Chaque bonne réponse rapporte des XP.</p>

        <h2 className="mt-8 font-mono text-xs text-accent">AUJOURD’HUI</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card href="/quiz?mode=daily" title="Daily Challenge" tag="+25 XP" text="Les mêmes 10 questions pour tout le monde, une fois par jour." />
          <Card href="/quiz?mode=weakness" title="Weakness Training" text="Les questions que tu rates reviennent (répétition espacée) et tes catégories faibles." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">FINANCE GAMES · CHRONOMÉTRÉ</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card href="/jeux?mode=calcul" title="Calcul éclair" tag="20 s" text="Calcul mental sous pression." />
          <Card href="/jeux?mode=ordres" title="Ordres de grandeur" tag="30 s" text="PIB, capitalisations, ratios." />
          <Card href="/jeux?mode=culture" title="Culture marchés" tag="15 s" text="QCM et vrai/faux rapides." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">SE TESTER</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Card href="/quiz" title="Quick Quiz" text="10 questions au hasard." />
          <Card href="/quiz?mode=mixed" title="Mixed" text="15 questions, toutes catégories mélangées." />
          <Card href="/test-niveau" title="Test de niveau" text="12 questions pour te placer dans le parcours." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">CALCUL MENTAL · INFINI</h2>
        <div className="mt-3">
          <Card href="/calcul-mental" title="Module calcul mental" text="Pourcentages, variations, intérêts composés, devises, bps, règle de 72, multiplications rapides. Générées automatiquement, niveaux 1 à 5." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">TRAINING PAR CATÉGORIE</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {LEVELS.map(([v, label]) => (
            <button key={v} onClick={() => setLevel(v)} className={`border px-3 py-1.5 ${level === v ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
          {CATS.map(([id, name]) => (
            <Link key={id} href={`/quiz?categorie=${id}${level ? `&niveau=${level}` : ""}`} className="bg-ink p-4 hover:bg-panel">
              <div className="font-semibold">{name}</div>
              <div className="mt-1 font-mono text-xs text-muted">réussite · réponses : {acc(id)}</div>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
