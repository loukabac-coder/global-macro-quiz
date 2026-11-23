"use client";

import Link from "next/link";
import QuizRunner from "@/components/QuizRunner";
import type { Placement } from "@/lib/quizSession";

const LABEL = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
const TEXT = {
  debutant: "Commence par les cours et les quiz Débutant.",
  intermediaire: "Tu peux t’entraîner librement en Intermédiaire. Valide les synthèses Débutant pour continuer le parcours.",
  avance: "Tu peux t’entraîner librement en Avancé. Dans le parcours, tes synthèses ouvrent chaque niveau.",
};

function PlacementResult({ level }: { level: Placement }) {
  return (
    <div className="fade-in mt-6 border border-accent bg-panel p-5">
      <p className="font-mono text-xs text-accent">niveau conseillé pour l’entraînement</p>
      <p className="mt-1 text-2xl font-semibold">{LABEL[level]}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{TEXT[level]}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parcours" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
          Voir mon parcours
        </Link>
      </div>
    </div>
  );
}

export default function TestNiveau() {
  return (
    <QuizRunner
      title="Test de niveau · 12 questions"
      activity={{ type: "placement" }}
      replayLabel="Refaire le test"
      renderEnd={(_, summary) => summary?.placement && <PlacementResult level={summary.placement} />}
    />
  );
}
