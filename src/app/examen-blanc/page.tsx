"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuizRunner from "@/components/QuizRunner";
import { EXAM_SECONDS, EXAM_SIZE } from "@/lib/exam";
import { EXAM_PROFILES, type ExamProfile } from "@/lib/quizSession";

export default function ExamenBlanc() {
  const [profile, setProfile] = useState<ExamProfile | null>(null);
  if (profile) {
    return <QuizRunner title={`Examen blanc · ${EXAM_PROFILES[profile]}`} activity={{ type: "exam", profile }}
      backLabel="Formats d’examen" backHref="/examen-blanc" onBack={() => setProfile(null)} replayLabel="Nouveau tirage" />;
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Examen blanc</h1>
        <p className="mt-3 text-muted">{EXAM_SIZE} questions intermédiaires et avancées. Le délai dépend de la question et va jusqu’à {EXAM_SECONDS} secondes.</p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Macroéconomie, taux, obligations, change, actions, dérivés et politique monétaire.</li>
          <li>Une seule réponse par question. Après validation ou à la fin du temps, tu passes automatiquement à la suivante.</li>
          <li>Une question sans réponse vaut zéro. Le score et les corrections s’affichent à la fin.</li>
          <li>Quitter la page met fin à ta tentative.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          {(Object.keys(EXAM_PROFILES) as ExamProfile[]).map((id) => (
            <button type="button" key={id} onClick={() => setProfile(id)} className="border border-line bg-panel px-5 py-3 text-sm font-semibold hover:border-accent">
              {EXAM_PROFILES[id]}
            </button>
          ))}
          <Link href="/parcours" className="border border-line px-5 py-3 text-sm hover:border-muted">Mon parcours</Link>
        </div>
      </main>
    </AppShell>
  );
}
