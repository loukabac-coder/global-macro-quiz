"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuizRunner from "@/components/QuizRunner";
import { useSearch } from "@/lib/useSearch";
import { gameSeconds } from "@/lib/quizSession";
import { mentalDifficulty } from "@/lib/mental";
import { DIFFICULTY_FR } from "@/lib/quiz";

const GAMES = [
  { id: "calcul", name: "Calcul éclair", text: "10 calculs de tête du niveau choisi. Points selon la vitesse." },
  { id: "ordres", name: "Ordres de grandeur", text: "PIB, capitalisations, ratios : donne le bon ordre de grandeur." },
  { id: "culture", name: "Culture marchés", text: "QCM et vrai/faux rapides sur la macro, les banques centrales, le change, les actions." },
] as const;

export default function Jeux() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement des jeux…</p>}><JeuxContent /></Suspense>;
}

function JeuxContent() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const game = params.get("mode");
  const lvParam = params.get("niveau");
  const level = lvParam === "1" ? 1 : lvParam === "4" || lvParam === "5" ? 4 : 2;
  const [lv, setLv] = useState<number | null>(null);
  const chosen = lv ?? level;

  if (game === "calcul" || game === "ordres" || game === "culture") {
    const info = GAMES.find((g) => g.id === game)!;
    return (
      <QuizRunner
        key={search}
        title={`Finance Games · ${info.name}`}
        activity={{ type: "game", game, level }}
        backHref="/jeux"
        backLabel="Finance Games"
        replayLabel="Nouvelle série"
      />
    );
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <p className="font-mono text-xs text-accent">finance games · séries chronométrées</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finance Games</h1>
        <p className="mt-3 max-w-xl text-muted">
          Des séries de 10 questions rapides, comme à l’oral en entretien. Le temps est limité, les points dépendent de ta vitesse, et ton temps moyen de réponse est affiché à la fin.
        </p>

        <h2 className="mt-8 text-sm font-semibold">Difficulté des jeux</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {[1, 2, 4].map((n) => (
            <button key={n} onClick={() => setLv(n)} aria-pressed={chosen === n} className={`min-h-11 border px-3 ${chosen === n ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}>
              {DIFFICULTY_FR[mentalDifficulty(n)]}
            </button>
          ))}
        </div>

        <ul className="mt-8 space-y-3">
          {GAMES.map((g) => (
            <li key={g.id}>
              <Link
                href={`/jeux?mode=${g.id}&niveau=${chosen}`}
                className="grid gap-1 border border-line bg-panel p-5 transition-colors hover:border-accent sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <span>
                  <span className="font-semibold">{g.name}</span>
                  <span className="mt-1 block text-sm text-muted">{g.text}</span>
                </span>
                <span className="font-mono text-xs text-warn">{gameSeconds(g.id, chosen)} s par question</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">Astuce : clavier — 1 à 4 pour choisir une réponse, Entrée pour valider.</p>
      </main>
    </AppShell>
  );
}
