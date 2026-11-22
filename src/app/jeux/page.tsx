"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuizRunner from "@/components/QuizRunner";
import { useSearch } from "@/lib/useSearch";
import { balanced, fetchLive, fetchQuestions, SIZE } from "@/lib/loaders";
import { mentalQuestion, mentalSession } from "@/lib/mental";
import { shuffle, type Question } from "@/lib/quiz";

const GAMES = [
  { id: "calcul", name: "Calcul éclair", time: "20 s par question", text: "10 calculs de tête, de plus en plus durs. Points selon la vitesse." },
  { id: "ordres", name: "Ordres de grandeur", time: "30 s par question", text: "PIB, capitalisations, ratios : donne le bon ordre de grandeur." },
  { id: "culture", name: "Culture marchés", time: "15 s par question", text: "QCM et vrai/faux rapides sur la macro, les banques centrales, le change, les actions." },
] as const;

const CULTURE_CATS = ["financial-markets", "central-banks", "fx", "commodities", "market-caps", "monetary-policy", "macroeconomics"];

export default function Jeux() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const game = params.get("mode");
  const lvParam = params.get("niveau");
  const level = lvParam && /^[1-5]$/.test(lvParam) ? Number(lvParam) : 2;
  const [lv, setLv] = useState<number | null>(null);
  const chosen = lv ?? level;

  if (game === "calcul" || game === "ordres" || game === "culture") {
    const info = GAMES.find((g) => g.id === game)!;
    const T = game === "calcul" ? (level >= 4 ? 30 : 20) : game === "ordres" ? 30 : 15;
    return (
      <QuizRunner
        key={search}
        title={`Finance Games · ${info.name}`}
        mode="challenge"
        timePerQuestion={T}
        backHref="/jeux"
        backLabel="Finance Games"
        replayLabel="Nouvelle série"
        load={async ({ supabase }) => {
          if (game === "calcul") return mentalSession(SIZE, level, Math.random, null, 2);
          if (game === "ordres") {
            const [db, live] = await Promise.all([
              fetchQuestions(supabase, { types: ["numeric", "guesstimate"] }),
              fetchLive(),
            ]);
            const liveNum = live.filter((q) => q.type === "numeric");
            const picked: Question[] = [...shuffle(db).slice(0, 4), ...shuffle(liveNum).slice(0, 3)];
            const need = SIZE - picked.length;
            for (let i = 0; i < need; i++) picked.push(mentalQuestion(2 + (i % 3), Math.random, "ordres"));
            return shuffle(picked);
          }
          const [db, live] = await Promise.all([
            fetchQuestions(supabase, { categories: CULTURE_CATS, types: ["mcq", "true_false"] }),
            fetchLive(),
          ]);
          const liveQ = live.filter((q) => q.type !== "numeric");
          const picked = [...balanced(db, SIZE - Math.min(2, liveQ.length)), ...shuffle(liveQ).slice(0, 2)];
          return shuffle(picked).slice(0, SIZE);
        }}
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

        <h2 className="mt-8 text-sm font-semibold">Difficulté du calcul éclair</h2>
        <div className="mt-3 flex gap-2 text-sm">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setLv(n)} className={`size-11 border font-mono ${chosen === n ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}>
              {n}
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
                <span className="font-mono text-xs text-warn">{g.time}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">Astuce : clavier — 1 à 4 pour choisir une réponse, Entrée pour valider.</p>
      </main>
    </AppShell>
  );
}
