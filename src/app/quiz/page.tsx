"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type Item = { q: Question; order: number[] };
type Result = { q: Question; ok: boolean; given: string; seconds: number };
type Phase = "loading" | "empty" | "error" | "playing" | "done";

const QUIZ_SIZE = 10;

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

export default function QuickQuiz() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [cats, setCats] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState<number | boolean | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error" | null>(null);
  const startRef = useRef(0);
  const qStartRef = useRef(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = getSupabase();
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) {
          router.replace("/connexion");
          return;
        }
        const [qRes, cRes] = await Promise.all([
          supabase
            .from("questions")
            .select(
              "id, category_id, type, difficulty, prompt, options, correct, tolerance_pct, explanation, wrong_explanations, source, kind, reference_date",
            )
            .limit(1000),
          supabase.from("categories").select("id, name"),
        ]);
        if (!active) return;
        if (qRes.error) throw new Error(qRes.error.message);
        const all = (qRes.data ?? []) as Question[];
        if (all.length === 0) {
          setPhase("empty");
          return;
        }
        const map: Record<string, string> = {};
        for (const c of (cRes.data ?? []) as { id: string; name: string }[]) map[c.id] = c.name;
        const picked = shuffle(all)
          .slice(0, QUIZ_SIZE)
          .map((q) => ({ q, order: shuffle(mcqOptions(q).map((_, i) => i)) }));
        setCats(map);
        setItems(picked);
        setIdx(0);
        setChoice(null);
        setText("");
        setChecked(false);
        setResults([]);
        setElapsed(0);
        setFormError(null);
        setSaveStatus(null);
        startRef.current = nowMs();
        qStartRef.current = nowMs();
        setPhase("playing");
      } catch (e) {
        if (!active) return;
        setMessage(e instanceof Error ? e.message : "Erreur inconnue.");
        setPhase("error");
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router, runId]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setElapsed(Math.floor((nowMs() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  function replay() {
    setPhase("loading");
    setRunId((n) => n + 1);
  }

  function validate(e: React.FormEvent) {
    e.preventDefault();
    if (checked) return;
    const { q } = items[idx];
    let ok = false;
    let given = "";
    if (q.type === "mcq") {
      if (choice === null) return;
      ok = choice === Number(q.correct);
      given = mcqOptions(q)[choice as number] ?? "";
    } else if (q.type === "true_false") {
      if (choice === null) return;
      ok = choice === q.correct;
      given = choice ? "Vrai" : "Faux";
    } else {
      const v = parseNumber(text);
      if (v === null) {
        setFormError("Entre un nombre, par exemple 12 ou 4,75.");
        return;
      }
      ok = checkNumeric(q, v);
      given = fmt(v);
    }
    setFormError(null);
    const seconds = Math.round((nowMs() - qStartRef.current) / 1000);
    setResults((r) => [...r, { q, ok, given, seconds }]);
    setChecked(true);
  }

  function next() {
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      setChoice(null);
      setText("");
      setChecked(false);
      setFormError(null);
      qStartRef.current = nowMs();
    } else {
      const total = Math.floor((nowMs() - startRef.current) / 1000);
      setElapsed(total);
      setPhase("done");
      save(results, total);
    }
  }

  async function save(final: Result[], seconds: number) {
    setSaveStatus("saving");
    try {
      const supabase = getSupabase();
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) throw new Error("Session expirée");
      const score = final.filter((r) => r.ok).length;
      const { data: s, error: e1 } = await supabase
        .from("quiz_sessions")
        .insert({
          user_id: user.id,
          mode: "quick",
          finished_at: new Date().toISOString(),
          score,
          total: final.length,
          seconds_spent: seconds,
        })
        .select("id")
        .single();
      if (e1 || !s) throw new Error(e1?.message ?? "Session non enregistrée");
      const { error: e2 } = await supabase.from("attempts").insert(
        final.map((r) => ({
          user_id: user.id,
          session_id: s.id,
          question_id: r.q.id,
          is_correct: r.ok,
          answer: { given: r.given },
          seconds_spent: r.seconds,
        })),
      );
      if (e2) throw new Error(e2.message);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
            Quitter
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">{children}</main>
    </div>
  );

  if (phase === "loading") return shell(<p className="text-sm text-muted">Chargement des questions…</p>);
  if (phase === "empty")
    return shell(
      <p className="text-sm text-muted">
        Aucune question disponible pour le moment. Ajoute-en dans Supabase, puis recharge la page.
      </p>,
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
    return shell(
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Résultats</h1>
        <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
          {[
            ["Score", `${score}/${results.length}`],
            ["Réussite", `${pct} %`],
            ["Durée", clock(elapsed)],
          ].map(([label, value]) => (
            <div key={label} className="bg-ink p-5">
              <div className="text-sm text-muted">{label}</div>
              <div className="mt-2 font-mono text-3xl">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          {saveStatus === "saving" && "Enregistrement des résultats…"}
          {saveStatus === "saved" && "Résultats enregistrés dans ton historique."}
          {saveStatus === "error" && "Les résultats n’ont pas pu être enregistrés."}
        </p>

        <h2 className="mt-10 text-lg font-semibold">Corrections</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {results.map((r, i) => (
            <li key={r.q.id}>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none gap-3">
                  <span className={`font-mono text-sm ${r.ok ? "text-accent" : "text-danger"}`}>
                    {r.ok ? "OK" : "KO"}
                  </span>
                  <span className="text-sm leading-snug">
                    <span className="font-mono text-muted">{String(i + 1).padStart(2, "0")} </span>
                    {r.q.prompt}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 pl-9 text-sm leading-relaxed text-muted">
                  <p>
                    Ta réponse : <span className="text-fg">{r.given}</span>
                  </p>
                  <p>
                    Bonne réponse : <span className="text-fg">{correctLabel(r.q)}</span>
                  </p>
                  <p>{r.q.explanation}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={replay} className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
            Rejouer
          </button>
          <Link href="/dashboard" className="border border-line px-5 py-3 text-sm hover:border-muted">
            Tableau de bord
          </Link>
        </div>
      </>,
    );
  }

  // phase === "playing"
  const item = items[idx];
  const q = item.q;
  const last = results[results.length - 1];
  const unit = unitOf(q);
  const wrongSelected =
    checked && q.type === "mcq" && !last?.ok && typeof choice === "number" ? wrongNote(q, choice) : null;

  function optionClass(optIdx: number): string {
    const base = "flex w-full gap-3 border px-3 py-3 text-left text-sm";
    if (!checked) {
      return `${base} ${choice === optIdx ? "border-accent bg-panel" : "border-line hover:border-muted"}`;
    }
    if (optIdx === Number(q.correct)) return `${base} border-accent bg-panel`;
    if (optIdx === choice) return `${base} border-danger bg-panel`;
    return `${base} border-line text-muted`;
  }

  function tfClass(value: boolean): string {
    const base = "w-full border px-3 py-3 text-left text-sm";
    if (!checked) {
      return `${base} ${choice === value ? "border-accent bg-panel" : "border-line hover:border-muted"}`;
    }
    if (value === q.correct) return `${base} border-accent bg-panel`;
    if (value === choice) return `${base} border-danger bg-panel`;
    return `${base} border-line text-muted`;
  }

  return shell(
    <>
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>
          Q {String(idx + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}
        </span>
        <span>
          {cats[q.category_id] ?? q.category_id}, {DIFFICULTY_FR[q.difficulty] ?? q.difficulty}
        </span>
        <span className="text-fg">{clock(elapsed)}</span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {items.map((it, i) => (
          <span
            key={it.q.id}
            className={`h-1 flex-1 ${
              i < results.length ? (results[i].ok ? "bg-accent" : "bg-danger") : i === idx ? "bg-fg" : "bg-line"
            }`}
          />
        ))}
      </div>

      <form onSubmit={validate} className="mt-8">
        <h1 className="text-xl font-medium leading-snug">{q.prompt}</h1>

        <div className="mt-6 space-y-2">
          {q.type === "mcq" &&
            item.order.map((optIdx, pos) => (
              <button
                key={optIdx}
                type="button"
                disabled={checked}
                onClick={() => setChoice(optIdx)}
                className={optionClass(optIdx)}
              >
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
                disabled={checked}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ta réponse"
                aria-label="Ta réponse"
                className="w-48 border border-line bg-panel px-3 py-2.5 font-mono text-sm focus:border-accent focus:outline-none disabled:opacity-60"
              />
              {unit && <span className="text-sm text-muted">{unit}</span>}
            </div>
          )}
        </div>

        {formError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {formError}
          </p>
        )}

        {checked && last && (
          <div className={`mt-6 border-l-2 bg-panel px-4 py-4 text-sm leading-relaxed ${last.ok ? "border-accent" : "border-danger"}`}>
            <p className={`font-semibold ${last.ok ? "text-accent" : "text-danger"}`}>
              {last.ok ? "Correct." : "Incorrect."}
            </p>
            {!last.ok && (
              <p className="mt-1">
                Bonne réponse : <span className="font-medium">{correctLabel(q)}</span>
                {isNumeric(q) && <span className="text-muted"> (ta réponse : {last.given})</span>}
              </p>
            )}
            {wrongSelected && <p className="mt-2 text-muted">{wrongSelected}</p>}
            <p className="mt-2 text-muted">{q.explanation}</p>
            {(q.source || (q.kind === "conjunctural" && q.reference_date)) && (
              <p className="mt-3 font-mono text-xs text-muted">
                {q.source && <>Source : {q.source}</>}
                {q.kind === "conjunctural" && q.reference_date && (
                  <span className="ml-3 text-warn">Donnée au {frDate(q.reference_date)}</span>
                )}
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          {!checked ? (
            <button
              type="submit"
              disabled={isNumeric(q) ? text.trim() === "" : choice === null}
              className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40"
            >
              Valider
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110"
            >
              {idx + 1 < items.length ? "Question suivante" : "Voir les résultats"}
            </button>
          )}
        </div>
      </form>
    </>,
  );
}
