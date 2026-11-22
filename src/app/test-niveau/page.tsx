"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import QuizRunner, { type Result } from "@/components/QuizRunner";
import { getSupabase } from "@/lib/supabase";
import { loadPlacement, RANK } from "@/lib/loaders";
import { STEPS, startStepFromPlacement } from "@/lib/path";

function levelOf(results: Result[]): "debutant" | "intermediaire" | "avance" {
  let got = 0;
  let max = 0;
  for (const r of results) {
    const w = RANK[r.q.difficulty] ?? 1;
    max += w;
    if (r.ok) got += w;
  }
  const pct = max ? (got / max) * 100 : 0;
  return pct < 40 ? "debutant" : pct < 70 ? "intermediaire" : "avance";
}

const LABEL = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
const TEXT = {
  debutant: "Tu pars des bases : calcul mental et culture marchés. Le parcours commence à l’étape 1.",
  intermediaire: "Tu as de bonnes bases. Tu peux passer les premières étapes et commencer par la macro et les banques centrales (étape 3).",
  avance: "Tu maîtrises déjà beaucoup. Tu peux viser directement le niveau entretien (étape 5) et les Finance Games.",
};

function PlacementResult({ results }: { results: Result[] }) {
  const level = levelOf(results);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    getSupabase().rpc("set_placement", { p_level: level }).then(() => {}, () => {});
  }, [level]);
  const step = STEPS[startStepFromPlacement(level) - 1];
  return (
    <div className="fade-in mt-6 border border-accent bg-panel p-5">
      <p className="font-mono text-xs text-accent">ton niveau de départ</p>
      <p className="mt-1 text-2xl font-semibold">{LABEL[level]}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{TEXT[level]}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
          Voir mon parcours
        </Link>
        <Link href={step.play} className="border border-line px-5 py-3 text-sm hover:border-muted">
          Commencer : {step.title}
        </Link>
      </div>
    </div>
  );
}

export default function TestNiveau() {
  return (
    <QuizRunner
      title="Test de niveau · 12 questions"
      mode="quick"
      replayLabel="Refaire le test"
      load={({ supabase }) => loadPlacement(supabase)}
      renderEnd={(results) => <PlacementResult results={results} />}
    />
  );
}
