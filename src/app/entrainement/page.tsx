"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import { GROUPS, unitCode } from "@/lib/program";
import { trainingHistoryScope } from "@/lib/trainingHistory";
import { HISTORY_LABELS, parseHistory } from "@/lib/quizSession";

const LEVELS: [string, string][] = [
  ["", "Tous niveaux"],
  ["beginner", "Débutant"],
  ["intermediate", "Intermédiaire"],
  ["advanced", "Avancé"],
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
  const [stats, setStats] = useState<{ question_id: string; seen: number; lapses: number }[]>([]);
  const [level, setLevel] = useState("");
  const [history, setHistory] = useState<keyof typeof HISTORY_LABELS>("all");
  const [selected, setSelected] = useState("");
  const [units, setUnits] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setLogged(!!data.session);
        if (!data.session) return;
        const reviews = [];
        for (let offset = 0; active; offset += 500) {
          const res = await supabase.from("question_reviews").select("question_id,seen,lapses").order("question_id").range(offset, offset + 499);
          if (res.error || !res.data) return;
          reviews.push(...res.data);
          if (res.data.length < 500) break;
        }
        if (active) setStats(reviews);
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

  function trainingHref(group?: string, selectedUnits: string[] = []) {
    const params = new URLSearchParams({ mode: "training" });
    if (group) params.set("module", group);
    if (selectedUnits.length) params.set("sous", selectedUnits.join(","));
    if (level) params.set("niveau", level);
    if (history !== "all") params.set("historique", history);
    return `/quiz?${params}`;
  }

  const scopedStats = stats.map((row) => ({ ...row, scope: trainingHistoryScope(row.question_id) }));
  function acc(group: string, selectedUnits: string[] = []): string {
    const rows = scopedStats.filter(({ scope }) => scope?.groupNo === group && (!level || scope.difficulty === level) &&
      (!selectedUnits.length || selectedUnits.includes(scope.unitSlug)));
    const a = rows.reduce((x, r) => x + r.seen, 0);
    const c = rows.reduce((x, r) => x + Math.max(0, r.seen - r.lapses), 0);
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
          <Card locked={lock} href="/calcul-mental" title="Calcul mental infini" text="Pourcentages, variations, intérêts et devises. Exercices générés à chacun des trois niveaux." />
          <Card locked={lock} href="/test-niveau" title="Test de niveau" text="12 questions pour te placer dans le parcours." />
          <Card locked={lock} href="/examen-blanc" title="Examen blanc" tag="≤ 45 s" text="20 questions intermédiaires et avancées. Correction en fin d’examen." />
        </div>

        <h2 className="mt-8 font-mono text-xs text-accent">PAR MODULE</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {LEVELS.map(([v, label]) => (
            <button key={v} onClick={() => setLevel(v)} disabled={lock} aria-pressed={level === v} className={`border px-3 py-1.5 ${level === v ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"} disabled:opacity-50`}>
              {label}
            </button>
          ))}
        </div>
        {!lock && (
          <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
            <label className="text-muted">
              Historique de réponse
              <select value={history} onChange={(event) => setHistory(parseHistory(event.target.value))} className="mt-1 block max-w-full border border-line bg-panel px-3 py-2 text-fg">
                {Object.entries(HISTORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <Link href={trainingHref()} className="border border-line px-3 py-2 hover:border-accent">S’entraîner sur tous les thèmes</Link>
          </div>
        )}
        <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
          {GROUPS.map((group) => (
            <section key={group.no} className="min-w-0 bg-ink p-4">
              <h3 className="font-semibold"><span className="mr-2 font-mono text-xs text-accent">{group.no}</span>{group.title}</h3>
              <p className="mt-1 font-mono text-xs text-muted">{lock ? "Compte requis" : `Réussite · réponses · ${acc(group.no)}`}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link href={lock ? "/inscription" : trainingHref(group.slug)} className="border border-line px-3 py-2 hover:border-accent">Tout le module</Link>
                {!lock && <button type="button" aria-expanded={selected === group.slug} onClick={() => {
                  setSelected(selected === group.slug ? "" : group.slug);
                  setUnits([]);
                }} className="border border-line px-3 py-2 hover:border-accent">Choisir les sous-modules</button>}
              </div>
              {selected === group.slug && !lock && (
                <fieldset className="mt-4 space-y-2 text-sm">
                  <legend className="mb-2 font-semibold">Sous-modules</legend>
                  {group.units.map((unit) => (
                    <label key={unit.slug} className="flex items-start gap-2">
                      <input className="mt-1 accent-[#c6ff3d]" type="checkbox" checked={units.includes(unit.slug)}
                        onChange={(event) => setUnits((previous) => event.target.checked ? [...previous, unit.slug] : previous.filter((slug) => slug !== unit.slug))} />
                      {unitCode(group, unit)} · {unit.title}
                    </label>
                  ))}
                  {!!units.length && <>
                    <p className="font-mono text-xs text-muted">Réussite · réponses · {acc(group.no, units)}</p>
                    <Link href={trainingHref(group.slug, units)} className="inline-block bg-accent px-3 py-2 font-semibold text-ink">Lancer la sélection</Link>
                  </>}
                </fieldset>
              )}
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
