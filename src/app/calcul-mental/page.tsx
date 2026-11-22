"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import QuizRunner from "@/components/QuizRunner";
import { useSearch } from "@/lib/useSearch";
import { TOPICS, mentalSession, type Topic } from "@/lib/mental";

const LEVELS = [
  ["1", "Niveau 1", "10 %, 50 %, ×5, ×11, bps simples"],
  ["2", "Niveau 2", "15 %, variations, règle de 72, devises"],
  ["3", "Niveau 3", "Carrés, taux composés, spreads"],
  ["4", "Niveau 4", "Produits à deux chiffres, duration, DV01"],
  ["5", "Niveau 5", "Fractions de %, composition, ratios complexes"],
];

export default function CalculMental() {
  const search = useSearch();
  const fromUrl = new URLSearchParams(search).get("niveau");
  const [level, setLevel] = useState<number | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [timed, setTimed] = useState(false);
  const [started, setStarted] = useState(0);

  const lv = level ?? (fromUrl && /^[1-5]$/.test(fromUrl) ? Number(fromUrl) : 2);

  if (started > 0) {
    return (
      <QuizRunner
        key={started}
        title={`Calcul mental · niveau ${lv}${topic ? " · " + TOPICS.find((t) => t.id === topic)?.label : ""}`}
        mode="training"
        timePerQuestion={timed ? (lv >= 4 ? 30 : 20) : undefined}
        backHref="/calcul-mental"
        backLabel="Réglages"
        replayLabel="Série suivante"
        load={async () => mentalSession(12, lv, Math.random, topic)}
      />
    );
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <p className="font-mono text-xs text-accent">calcul mental · questions infinies</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Calcul mental</h1>
        <p className="mt-3 max-w-xl text-muted">
          Des séries de 12 questions générées à la volée, qui deviennent plus dures au fil de la série. Après chaque réponse, tu vois la méthode rapide.
          Le cours de référence est <Link href="/cours/calcul-mental" className="text-fg underline underline-offset-4">ici</Link>.
        </p>

        <h2 className="mt-8 text-sm font-semibold">Niveau de départ</h2>
        <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-5">
          {LEVELS.map(([v, name, text]) => (
            <button
              key={v}
              onClick={() => setLevel(Number(v))}
              className={`p-3 text-left ${lv === Number(v) ? "bg-panel outline outline-1 -outline-offset-1 outline-accent" : "bg-ink hover:bg-panel"}`}
            >
              <div className="font-mono text-sm">{name}</div>
              <div className="mt-1 text-xs leading-snug text-muted">{text}</div>
            </button>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold">Thème</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button onClick={() => setTopic(null)} className={`border px-3 py-2 ${topic === null ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}>
            Tous
          </button>
          {TOPICS.map((t) => (
            <button key={t.id} onClick={() => setTopic(t.id)} className={`border px-3 py-2 ${topic === t.id ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <label className="mt-8 flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="size-4 accent-[#2fbf71]" />
          <span>Mode chronométré ({lv >= 4 ? 30 : 20} secondes par question)</span>
        </label>

        <button onClick={() => setStarted((n) => n + 1)} className="mt-8 w-full bg-accent px-6 py-4 text-sm font-semibold text-ink hover:brightness-110 sm:w-auto">
          Lancer la série
        </button>
      </main>
    </AppShell>
  );
}
