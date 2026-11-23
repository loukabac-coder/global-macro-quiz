"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuizRunner from "@/components/QuizRunner";
import { EXAM_SECONDS, EXAM_SIZE } from "@/lib/exam";

export default function ExamenBlanc() {
  const [started, setStarted] = useState(false);
  if (started) {
    return <QuizRunner title="Examen blanc" activity={{ type: "exam" }} replayLabel="Nouveau tirage" />;
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Examen blanc</h1>
        <p className="mt-3 text-muted">{EXAM_SIZE} questions de niveau intermédiaire et avancé. Tu as {EXAM_SECONDS} secondes par question.</p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Macroéconomie, taux, obligations, change, actions, dérivés et politique monétaire.</li>
          <li>Une seule réponse par question. Après validation ou à la fin du temps, tu passes automatiquement à la suivante.</li>
          <li>Une question sans réponse vaut zéro. Le score et les corrections s’affichent à la fin.</li>
          <li>Quitter la page met fin à ta tentative.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setStarted(true)} className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">Démarrer l’examen</button>
          <Link href="/parcours" className="border border-line px-5 py-3 text-sm hover:border-muted">Mon parcours</Link>
        </div>
      </main>
    </AppShell>
  );
}
