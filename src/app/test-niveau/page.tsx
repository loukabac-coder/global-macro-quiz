"use client";

import Link from "next/link";
import QuizRunner from "@/components/QuizRunner";
import { computeStatuses, nextOpenModule } from "@/lib/modules";
import type { Placement } from "@/lib/quizSession";

const LABEL = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
const TEXT = {
  debutant: "Tu pars des bases : le parcours commence au niveau Débutant, module 1.",
  intermediaire: "Tu as de bonnes bases : les modules Débutant sont validés d’office. Tu commences au niveau Intermédiaire.",
  avance: "Tu maîtrises déjà beaucoup : les niveaux Débutant et Intermédiaire sont validés d’office. Tu commences au niveau Avancé.",
};

function PlacementResult({ level }: { level: Placement }) {
  const start = nextOpenModule(computeStatuses({}, level));
  return (
    <div className="fade-in mt-6 border border-accent bg-panel p-5">
      <p className="font-mono text-xs text-accent">ton niveau de départ</p>
      <p className="mt-1 text-2xl font-semibold">{LABEL[level]}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{TEXT[level]}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/parcours" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
          Voir mon parcours
        </Link>
        {start && (
          <Link href={`/module?id=${start.id}`} className="border border-line px-5 py-3 text-sm hover:border-muted">
            Commencer : {start.title}
          </Link>
        )}
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
