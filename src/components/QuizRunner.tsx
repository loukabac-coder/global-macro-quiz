"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  DIFFICULTY_FR,
  LETTERS,
  checkNumeric,
  correctLabel,
  fmt,
  isNumeric,
  mcqOptions,
  parseNumber,
  shuffle,
  unitOf,
  wrongNote,
  type Question,
} from "@/lib/quiz";
import { BADGES } from "@/lib/badges";
import { levelFromXp, levelName } from "@/lib/progress";

export type Result = { q: Question; ok: boolean; given: string; seconds: number; points: number };
export type Mode = "quick" | "training" | "challenge" | "daily" | "mixed" | "weakness";
type Phase = "loading" | "empty" | "error" | "playing" | "done";
type Item = { q: Question; order: number[] };
type Summary = { xp_gained: number; xp: number; level: number; streak: number; unlocked: string[] };

export type RunnerProps = {
  title: string;
  kicker?: string;
  mode: Mode;
  timePerQuestion?: number;
  load: (ctx: { supabase: SupabaseClient; userId: string }) => Promise<Question[] | { questions: Question[]; note: string }>;
  renderEnd?: (results: Result[]) => React.ReactNode;
  backHref?: string;
  backLabel?: string;
  replayLabel?: string;
};

function nowMs(): number {
  return Date.now();
}

function clock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const isStored = (id: string) => !/^(gen|live|macro):/.test(id);

export default function QuizRunner(props: RunnerProps) {
  const { title, kicker, mode, timePerQuestion, renderEnd, backHref = "/dashboard", backLabel = "Quitter", replayLabel = "Rejouer" } = props;
  const router = useRouter();
  const T = timePerQuestion ?? 0;

  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<number | boolean | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [startAt, setStartAt] = useState(0);
  const [qStart, setQStart] = useState(0);
  const [now, setNow] = useState(0);
  const [total, setTotal] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [save, setSave] = useState<"saving" | "saved" | "error" | "nosql" | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const loadRef = useRef(props.load);
  const submitRef = useRef<(timedOut: boolean) => void>(() => {});

  useEffect(() => {
    loadRef.current = props.load;
  });

  // Chargement des questions
  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const supabase = getSupabase();
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) {
          router.replace("/connexion");
          return;
        }
        const [res, cRes] = await Promise.all([
          loadRef.current({ supabase, userId: s.session.user.id }),
          supabase.from("categories").select("id, name"),
        ]);
        if (!active) return;
        const questions = Array.isArray(res) ? res : res.questions;
        setNote(Array.isArray(res) ? null : res.note || null);
        if (questions.length === 0) {
          setPhase("empty");
          return;
        }
        const map: Record<string, string> = {};
        for (const c of (cRes.data ?? []) as { id: string; name: string }[]) map[c.id] = c.name;
        setCats(map);
        setItems(questions.map((q) => ({ q, order: shuffle(mcqOptions(q).map((_, i) => i)) })));
        setIdx(0);
        setChoice(null);
        setText("");
        setChecked(false);
        setResults([]);
        setFormError(null);
        setSave(null);
        setSummary(null);
        const t = nowMs();
        setStartAt(t);
        setQStart(t);
        setNow(t);
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        setMessage(e instanceof Error ? e.message : "Erreur inconnue.");
        setPhase("error");
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [router, runId]);

  // Horloge (et fin de temps automatique pour les séries chronométrées)
  useEffect(() => {
    if (phase !== "playing" || checked) return;
    const id = setInterval(() => {
      const t = nowMs();
      setNow(t);
      if (T > 0 && t - qStart >= T * 1000) {
        clearInterval(id);
        submitRef.current(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, checked, T, qStart, idx]);

  function replay() {
    setPhase("loading");
    setRunId((n) => n + 1);
  }

  function submit(timedOut: boolean) {
    if (checked || phase !== "playing") return;
    const { q } = items[idx];
    let ok = false;
    let given = "";
    if (q.type === "mcq") {
      if (choice === null && !timedOut) return;
      ok = choice !== null && choice === Number(q.correct);
      given = choice === null ? "Pas de réponse" : (mcqOptions(q)[choice as number] ?? "");
    } else if (q.type === "true_false") {
      if (choice === null && !timedOut) return;
      ok = choice !== null && choice === q.correct;
      given = choice === null ? "Pas de réponse" : choice ? "Vrai" : "Faux";
    } else {
      const v = parseNumber(text);
      if (v === null) {
        if (!timedOut) {
          setFormError("Entre un nombre, par exemple 12 ou 4,75.");
          return;
        }
        given = "Pas de réponse";
      } else {
        ok = checkNumeric(q, v);
        given = fmt(v);
      }
    }
    setFormError(null);
    const t = nowMs();
    const seconds = Math.round((t - qStart) / 100) / 10;
    const speed = T > 0 ? Math.max(0, 1 - seconds / T) : 0;
    const points = T > 0 && ok ? Math.round(50 + 50 * speed) : 0;
    setResults((r) => [...r, { q, ok, given: timedOut && given === "Pas de réponse" ? "Temps écoulé" : given, seconds, points }]);
    setChecked(true);
  }

  async function persist(final: Result[], seconds: number) {
    setSave("saving");
    const supabase = getSupabase();
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) {
      setSave("error");
      return;
    }
    // 1) historique (tables existantes)
    try {
      const score = final.filter((r) => r.ok).length;
      const { data: s, error: e1 } = await supabase
        .from("quiz_sessions")
        .insert({ user_id: user.id, mode, finished_at: new Date().toISOString(), score, total: final.length, seconds_spent: seconds })
        .select("id")
        .single();
      if (!e1 && s) {
        const stored = final.filter((r) => isStored(String(r.q.id)));
        if (stored.length) {
          await supabase.from("attempts").insert(
            stored.map((r) => ({
              user_id: user.id,
              session_id: s.id,
              question_id: r.q.id,
              is_correct: r.ok,
              answer: { given: r.given },
              seconds_spent: Math.round(r.seconds),
            })),
          );
        }
      }
    } catch {
      /* l'historique est secondaire : on continue pour les XP */
    }
    // 2) XP, série, répétition espacée, badges (calculés côté serveur)
    try {
      const answers = final.map((r) => ({
        qid: isStored(String(r.q.id)) ? String(r.q.id) : null,
        ok: r.ok,
        seconds: r.seconds,
        difficulty: r.q.difficulty,
        category: r.q.category_id,
      }));
      const { data, error } = await supabase.rpc("submit_session", { p_mode: mode, p_answers: answers });
      if (error) {
        setSave(/submit_session|function|schema cache/i.test(error.message) ? "nosql" : "error");
        return;
      }
      setSummary(data as Summary);
      setSave("saved");
    } catch {
      setSave("error");
    }
  }

  function next() {
    if (!checked) return;
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      setChoice(null);
      setText("");
      setChecked(false);
      setFormError(null);
      const t = nowMs();
      setQStart(t);
      setNow(t);
    } else {
      const t = Math.floor((nowMs() - startAt) / 1000);
      setTotal(t);
      setPhase("done");
      void persist(results, t);
    }
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  function handleKey(e: KeyboardEvent) {
    if (phase !== "playing" || !items[idx]) return;
    const it = items[idx];
    const typing = e.target instanceof HTMLInputElement;
    const ready = isNumeric(it.q) ? text.trim() !== "" : choice !== null;
    if (e.key === "Enter") {
      e.preventDefault();
      if (checked) next();
      else if (ready) submit(false);
      return;
    }
    if (checked || typing) return;
    const k = e.key.toLowerCase();
    if (it.q.type === "mcq") {
      const pos = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (pos >= 0 && pos < it.order.length) setChoice(it.order[pos]);
    } else if (it.q.type === "true_false") {
      if (k === "v" || k === "1") setChoice(true);
      if (k === "f" || k === "2") setChoice(false);
    }
  }

  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = handleKey;
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-5">
          <Link href="/dashboard" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <Link href={backHref} className="text-sm text-muted hover:text-fg">
            {backLabel}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
    </div>
  );

  if (phase === "loading") return shell(<p className="text-sm text-muted">Chargement…</p>);
  if (phase === "empty")
    return shell(
      <div className="space-y-4">
        <p className="text-sm text-muted">Aucune question disponible pour ce choix pour le moment.</p>
        <Link href="/jouer" className="inline-block border border-line px-5 py-3 text-sm hover:border-muted">
          Choisir un autre mode
        </Link>
      </div>,
    );
  if (phase === "error")
    return shell(
      <div role="alert" className="border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">
        Impossible de charger le quiz : {message}
      </div>,
    );

  if (phase === "done") {
    const score = results.filter((r) => r.ok).length;
    const pct = Math.round((score / results.length) * 100);
    const points = results.reduce((s, r) => s + r.points, 0);
    const avg = results.reduce((s, r) => s + r.seconds, 0) / results.length;
    const stats: [string, string][] = [
      ["Score", `${score}/${results.length}`],
      ["Réussite", `${pct} %`],
      T > 0 ? ["Points", String(points)] : ["Durée", clock(total)],
      ["Temps moyen", `${avg.toFixed(1).replace(".", ",")} s`],
    ];
    const leveledUp = summary && levelFromXp(summary.xp - summary.xp_gained) < summary.level;
    return shell(
      <div className="fade-in">
        <p className="font-mono text-xs text-muted">{title}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Résultats</h1>
        <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="bg-ink p-4 sm:p-5">
              <div className="text-sm text-muted">{label}</div>
              <div className="mt-2 font-mono text-2xl sm:text-3xl">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 border border-line bg-panel px-4 py-3 text-sm">
          {save === "saving" && <span className="text-muted">Enregistrement de ta progression…</span>}
          {save === "saved" && summary && (
            <div className="space-y-1">
              <p>
                <span className="font-mono text-accent">+{summary.xp_gained} XP</span>
                <span className="text-muted"> · total {summary.xp} XP · série de {summary.streak} jour{summary.streak > 1 ? "s" : ""}</span>
              </p>
              {leveledUp && (
                <p className="font-semibold text-accent">Niveau {summary.level} atteint : {levelName(summary.level)}</p>
              )}
              {summary.unlocked.map((code) => (
                <p key={code} className="text-warn">
                  Badge débloqué : {BADGES[code]?.label ?? code}
                  <span className="text-muted"> — {BADGES[code]?.text}</span>
                </p>
              ))}
            </div>
          )}
          {save === "nosql" && (
            <span className="text-warn">
              XP non enregistrés : le script SQL du Lot 1 n’a pas encore été exécuté dans Supabase.
            </span>
          )}
          {save === "error" && <span className="text-danger">Ta progression n’a pas pu être enregistrée.</span>}
        </div>

        {renderEnd?.(results)}

        <h2 className="mt-10 text-lg font-semibold">Corrections</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {results.map((r, i) => (
            <li key={`${r.q.id}-${i}`}>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none gap-3">
                  <span className={`font-mono text-sm ${r.ok ? "text-accent" : "text-danger"}`}>{r.ok ? "OK" : "KO"}</span>
                  <span className="text-sm leading-snug">
                    <span className="font-mono text-muted">{String(i + 1).padStart(2, "0")} </span>
                    {r.q.prompt}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 pl-9 text-sm leading-relaxed text-muted">
                  <p>Ta réponse : <span className="text-fg">{r.given}</span></p>
                  <p>Bonne réponse : <span className="text-fg">{correctLabel(r.q)}</span></p>
                  <p>{r.q.explanation}</p>
                  {(r.q.source || r.q.reference_date) && (
                    <p className="font-mono text-xs">
                      {r.q.source && <>Source : {r.q.source}</>}
                      {r.q.kind === "conjunctural" && r.q.reference_date && (
                        <span className="ml-3 text-warn">Donnée au {frDate(r.q.reference_date)}</span>
                      )}
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={replay} className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
            {replayLabel}
          </button>
          <Link href="/dashboard" className="border border-line px-5 py-3 text-sm hover:border-muted">
            Mon parcours
          </Link>
          <Link href="/jouer" className="border border-line px-5 py-3 text-sm hover:border-muted">
            Autres modes
          </Link>
        </div>
      </div>,
    );
  }

  // phase === "playing"
  const item = items[idx];
  const q = item.q;
  const last = results[results.length - 1];
  const unit = unitOf(q);
  const wrongSelected = checked && q.type === "mcq" && !last?.ok && typeof choice === "number" ? wrongNote(q, choice) : null;
  const elapsedQ = Math.max(0, (now - qStart) / 1000);
  const remaining = T > 0 ? Math.max(0, T - elapsedQ) : 0;
  const barPct = T > 0 ? Math.round((remaining / T) * 100) : 0;
  const readyToSubmit = isNumeric(q) ? text.trim() !== "" : choice !== null;

  function optionClass(optIdx: number): string {
    const base = "flex w-full gap-3 border px-3 py-3.5 text-left text-sm transition-colors";
    if (!checked) return `${base} ${choice === optIdx ? "border-accent bg-panel" : "border-line hover:border-muted"}`;
    if (optIdx === Number(q.correct)) return `${base} border-accent bg-panel`;
    if (optIdx === choice) return `${base} border-danger bg-panel`;
    return `${base} border-line text-muted`;
  }

  function tfClass(value: boolean): string {
    const base = "w-full border px-3 py-3.5 text-left text-sm transition-colors";
    if (!checked) return `${base} ${choice === value ? "border-accent bg-panel" : "border-line hover:border-muted"}`;
    if (value === q.correct) return `${base} border-accent bg-panel`;
    if (value === choice) return `${base} border-danger bg-panel`;
    return `${base} border-line text-muted`;
  }

  return shell(
    <div className="fade-in" key={idx}>
      <p className="mb-1 font-mono text-xs text-muted">{kicker ?? title}</p>
      {note && idx === 0 && !checked && <p className="mb-3 font-mono text-xs text-warn">{note}</p>}
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>Q {String(idx + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}</span>
        <span className="truncate px-2">{cats[q.category_id] ?? q.category_id}, {DIFFICULTY_FR[q.difficulty] ?? q.difficulty}</span>
        <span className={T > 0 && remaining <= 5 && !checked ? "text-danger" : "text-fg"}>
          {T > 0 ? `${Math.ceil(remaining)} s` : clock(Math.floor((now - startAt) / 1000))}
        </span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {items.map((it, i) => (
          <span
            key={`${it.q.id}-${i}`}
            className={`h-1 flex-1 ${i < results.length ? (results[i].ok ? "bg-accent" : "bg-danger") : i === idx ? "bg-fg" : "bg-line"}`}
          />
        ))}
      </div>
      {T > 0 && !checked && (
        <div className="mt-2 h-0.5 w-full bg-line" aria-hidden="true">
          <div className={`h-full ${remaining <= 5 ? "bg-danger" : "bg-warn"}`} style={{ width: `${barPct}%`, transition: "width 250ms linear" }} />
        </div>
      )}

      <div className="mt-8">
        <h1 className="text-lg font-medium leading-snug sm:text-xl">{q.prompt}</h1>

        <div className="mt-6 space-y-2">
          {q.type === "mcq" &&
            item.order.map((optIdx, pos) => (
              <button key={optIdx} type="button" disabled={checked} onClick={() => setChoice(optIdx)} className={optionClass(optIdx)}>
                <span className="font-mono text-muted">{LETTERS[pos]}</span>
                <span>{mcqOptions(q)[optIdx]}</span>
              </button>
            ))}

          {q.type === "true_false" &&
            [true, false].map((v) => (
              <button key={String(v)} type="button" disabled={checked} onClick={() => setChoice(v)} className={tfClass(v)}>
                {v ? "Vrai" : "Faux"}
              </button>
            ))}

          {isNumeric(q) && (
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                disabled={checked}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ta réponse"
                aria-label="Ta réponse"
                className="w-full max-w-[14rem] border border-line bg-panel px-3 py-3 font-mono text-base focus:border-accent focus:outline-none disabled:opacity-60"
              />
              {unit && <span className="text-sm text-muted">{unit}</span>}
            </div>
          )}
        </div>

        {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}

        {checked && last && (
          <div className={`fade-in mt-6 border-l-2 bg-panel px-4 py-4 text-sm leading-relaxed ${last.ok ? "border-accent" : "border-danger"}`}>
            <p className={`font-semibold ${last.ok ? "text-accent" : "text-danger"}`}>
              {last.ok ? "Correct." : last.given === "Temps écoulé" ? "Temps écoulé." : "Incorrect."}
              {T > 0 && last.ok && <span className="ml-2 font-mono text-xs font-normal text-muted">+{last.points} pts · {last.seconds.toFixed(1).replace(".", ",")} s</span>}
            </p>
            {!last.ok && (
              <p className="mt-1">
                Bonne réponse : <span className="font-medium">{correctLabel(q)}</span>
                {isNumeric(q) && last.given !== "Temps écoulé" && <span className="text-muted"> (ta réponse : {last.given})</span>}
              </p>
            )}
            {wrongSelected && <p className="mt-2 text-muted">{wrongSelected}</p>}
            <p className="mt-2 text-muted">{q.explanation}</p>
            {(q.source || (q.kind === "conjunctural" && q.reference_date)) && (
              <p className="mt-3 font-mono text-xs text-muted">
                {q.source && <>Source : {q.source}</>}
                {q.kind === "conjunctural" && q.reference_date && <span className="ml-3 text-warn">Donnée au {frDate(q.reference_date)}</span>}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          {!checked ? (
            <button type="button" disabled={!readyToSubmit} onClick={() => submit(false)} className="bg-accent px-6 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40">
              Valider
            </button>
          ) : (
            <button type="button" onClick={next} className="bg-accent px-6 py-3 text-sm font-semibold text-ink hover:brightness-110">
              {idx + 1 < items.length ? "Question suivante" : "Voir les résultats"}
            </button>
          )}
          <span className="hidden font-mono text-xs text-muted sm:inline">Entrée pour valider · 1 à 4 pour choisir</span>
        </div>
      </div>
    </div>,
  );
}
