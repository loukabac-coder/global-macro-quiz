"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
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
import { CAT_NAME } from "@/lib/categories";
import QuestionActions from "@/components/QuestionActions";
import { clearQuizResume, quizResumeKey, readQuizResume, writeQuizResume } from "@/lib/quizResume";
import type { Activity, Answer, Feedback, QuizSummary, ResumedQuiz } from "@/lib/quizSession";

export type Result = { q: Question; ok: boolean; given: string; seconds: number; points: number; wrongNote?: string | null };
type Phase = "loading" | "empty" | "error" | "playing" | "done";
type Item = { q: Question; order: number[] };
type LocalResume = { items: Item[]; idx: number; checked: boolean; choice: Answer; results: Result[]; issuedAt: number; questionAt: number };
type ServerResume = { id: string; orders: number[][] };

export type RunnerProps = {
  title: string;
  kicker?: string;
  activity?: Activity;
  timePerQuestion?: number;
  practiceLoad?: () => Promise<Question[]>;
  practiceKey?: string;
  /** Questions pour un visiteur sans compte. Sans cette fonction, redirection vers la connexion. */
  guestLoad?: () => Promise<Question[]>;
  /** Page réservée aux invités : aucune connexion à Supabase. */
  guestOnly?: boolean;
  renderEnd?: (results: Result[], summary: QuizSummary | null, guest: boolean) => React.ReactNode;
  backHref?: string;
  backLabel?: string;
  replayLabel?: string;
  onBack?: () => void;
};

function nowMs(): number {
  return performance.now();
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

function answerLabel(q: Question, answer: Answer) {
  if (answer === null) return "Pas de réponse";
  if (q.type === "mcq") return mcqOptions(q)[Number(answer)] ?? "";
  if (typeof answer === "boolean") return answer ? "Vrai" : "Faux";
  return fmt(answer);
}

function resultOf({ question, ok, answer, seconds, points, timedOut }: Feedback): Result {
  return {
    q: question, ok, given: timedOut ? "Temps écoulé" : answerLabel(question, answer), seconds, points,
    wrongNote: !ok && question.type === "mcq" && typeof answer === "number" ? wrongNote(question, answer) : null,
  };
}

async function startQuestion(db: ReturnType<typeof getSupabase>, id: string, index: number, exam: boolean) {
  const sentAt = nowMs();
  const { data, error } = await db.rpc(exam ? "start_exam_question" : "start_quiz_question", { p_run: id, p_index: index });
  if (error) throw new Error("La question n’a pas pu démarrer. Réessaie.");
  const receivedAt = nowMs();
  return exam ? (sentAt + receivedAt) / 2 - Number(data) * 1000 : receivedAt;
}

export default function QuizRunner(props: RunnerProps) {
  const { title, kicker, renderEnd, backHref = "/parcours", backLabel = "Quitter", replayLabel = "Rejouer" } = props;
  const router = useRouter();
  const exam = props.activity?.type === "exam";

  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
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
  const [save, setSave] = useState<"saving" | "saved" | "error" | null>(null);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [guest, setGuest] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [T, setTimer] = useState(0);
  const [pending, setPending] = useState(false);

  const configRef = useRef(props);
  const busy = useRef(false);
  const submitRef = useRef<(timedOut: boolean) => void>(() => {});
  const resumeKey = useRef<string | null>(null);
  const responses = useRef<HTMLDivElement>(null);

  useEffect(() => {
    configRef.current = props;
  });

  // Chargement des questions
  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const { practiceLoad, practiceKey, guestOnly, guestLoad, activity, timePerQuestion } = configRef.current;
        const isExam = activity?.type === "exam";
        let questions: Question[] = [];
        let issuedId: string | null = null;
        let quizNote: string | null = null;
        let timer = timePerQuestion ?? 0;
        let isGuest = false;
        let resumed: ResumedQuiz | null = null;
        let local: LocalResume | null = null;
        let beganAt: number | null = null;
        let orders: number[][] | undefined;
        if (practiceLoad) {
          resumeKey.current = quizResumeKey(null, activity, practiceKey);
          local = readQuizResume<LocalResume>(resumeKey.current);
          if (!local) questions = await practiceLoad();
        } else {
          const supabase = !guestOnly && supabaseConfigured() ? getSupabase() : null;
          const sessionResult = supabase ? await supabase.auth.getSession() : null;
          if (sessionResult?.error) throw new Error("Ta session n’a pas pu être vérifiée.");
          if (!active) return;
          const session = sessionResult?.data.session;
          if (session && supabase && activity) {
            const key = isExam ? null : quizResumeKey(session.user.id, activity);
            resumeKey.current = key;
            const previous = key && readQuizResume<ServerResume>(key);
            if (previous) {
              const { data, error } = await supabase.rpc("resume_quiz_run", { p_run: previous.id });
              if (error) throw new Error("La session interrompue n’a pas pu être chargée.");
              if (!active) return;
              resumed = data as ResumedQuiz | null;
              if (resumed) {
                issuedId = previous.id;
                questions = resumed.questions;
                timer = resumed.timeLimit;
                orders = previous.orders;
              }
            }
            if (!resumed) {
              const response = await fetch("/api/quiz", {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
                body: JSON.stringify(activity),
              });
              const res = await response.json() as { id?: string; questions?: Question[]; note?: string; error?: string; timeLimit?: number };
              if (!response.ok) throw new Error(res.error ?? "Le serveur de quiz est indisponible.");
              if (!active) return;
              questions = res.questions ?? [];
              issuedId = res.id ?? null;
              quizNote = res.note ?? null;
              timer = res.timeLimit ?? 0;
              orders = questions.map((q) => shuffle(mcqOptions(q).map((_, i) => i)));
              if (issuedId && key) writeQuizResume<ServerResume>(key, { id: issuedId, orders });
            }
            if (issuedId && (!resumed || (!resumed.feedback.length && resumed.questionSeconds === null))) {
              beganAt = await startQuestion(supabase, issuedId, 0, isExam);
            }
          } else {
            if (!guestLoad) {
              if (active) router.replace(`/connexion?retour=${encodeURIComponent(window.location.pathname + window.location.search)}`);
              return;
            }
            isGuest = true;
            resumeKey.current = quizResumeKey(null, activity);
            local = readQuizResume<LocalResume>(resumeKey.current);
            if (!local) questions = await guestLoad();
          }
        }
        if (!active) return;
        setNote(quizNote);
        if (!local && questions.length === 0) {
          setPhase("empty");
          return;
        }
        setSessionId(issuedId);
        setTimer(timer);
        setGuest(isGuest);
        const restoredFeedback = resumed?.feedback ?? [];
        const lastFeedback = restoredFeedback.at(-1);
        const showingFeedback = resumed?.questionSeconds === null && !!lastFeedback;
        setItems(local?.items ?? questions.map((q, i) => ({ q, order: orders?.[i] ?? shuffle(mcqOptions(q).map((_, j) => j)) })));
        setIdx(local?.idx ?? (showingFeedback ? restoredFeedback.length - 1 : restoredFeedback.length));
        setChoice(showingFeedback ? lastFeedback.answer : local?.choice ?? null);
        setText("");
        setChecked(local?.checked ?? showingFeedback);
        setResults(local?.results ?? restoredFeedback.map(resultOf));
        setFormError(null);
        setSave(resumed?.summary ? "saved" : null);
        setSummary(resumed?.summary ?? null);
        const t = nowMs();
        const wallTime = Date.now();
        const issuedSeconds = resumed?.issuedSeconds ?? (local ? (wallTime - local.issuedAt) / 1000 : 0);
        const questionSeconds = resumed?.questionSeconds ?? (local ? (wallTime - local.questionAt) / 1000 : lastFeedback?.seconds ?? 0);
        setStartAt(t - issuedSeconds * 1000);
        setQStart(beganAt ?? t - questionSeconds * 1000);
        setNow(t);
        setTotal(Math.floor(issuedSeconds));
        if (resumed?.summary && resumeKey.current) clearQuizResume(resumeKey.current);
        setPhase(resumed?.summary ? "done" : "playing");
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

  useEffect(() => {
    if (phase !== "playing" || sessionId || !resumeKey.current) return;
    const origin = Date.now() - nowMs();
    const issuedAt = origin + startAt;
    writeQuizResume<LocalResume>(resumeKey.current, { items, idx, checked, choice, results, issuedAt, questionAt: origin + qStart }, issuedAt);
  }, [phase, sessionId, items, idx, checked, choice, results, startAt, qStart]);

  // Horloge (et fin de temps automatique pour les séries chronométrées)
  useEffect(() => {
    if (phase !== "playing" || checked) return;
    const tick = () => {
      const t = nowMs();
      setNow(t);
      if (T > 0 && t - qStart >= T * 1000) {
        clearInterval(id);
        submitRef.current(true);
      }
    };
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, checked, T, qStart, idx]);

  function replay() {
    if (phase === "done" && resumeKey.current) clearQuizResume(resumeKey.current);
    setPhase("loading");
    setRunId((n) => n + 1);
  }

  async function advanceQuestion() {
    const t = sessionId ? await startQuestion(getSupabase(), sessionId, idx + 1, exam) : nowMs();
    setIdx(idx + 1);
    setChoice(null);
    setText("");
    setChecked(false);
    setFormError(null);
    setQStart(t);
    setNow(nowMs());
  }

  function finish() {
    setTotal(Math.floor((nowMs() - startAt) / 1000));
    setPhase("done");
    if (sessionId) void persist(sessionId);
    else if (resumeKey.current) clearQuizResume(resumeKey.current);
  }

  async function submit(timedOut: boolean) {
    if (checked || busy.current || phase !== "playing") return;
    const { q } = items[idx];
    const t = nowMs();
    timedOut ||= T > 0 && t - qStart >= T * 1000;
    const answer = timedOut ? null : isNumeric(q) ? parseNumber(text) : choice;
    if (answer === null && !timedOut) {
      if (isNumeric(q)) setFormError("Entre un nombre, par exemple 12 ou 4,75.");
      return;
    }
    const seconds = Math.round((t - qStart) / 100) / 10;
    const speed = T > 0 ? Math.max(0, 1 - seconds / T) : 0;
    busy.current = true;
    setPending(true);
    setFormError(null);
    let examFinished = false;
    try {
      let feedback: Feedback;
      if (sessionId) {
        const { data, error } = await getSupabase().rpc("record_quiz_answer", { p_run: sessionId, p_index: idx, p_answer: answer });
        if (error || !data) throw new Error("réponse");
        if (exam) {
          if (!data.submitted) throw new Error("examen");
          if (idx + 1 < items.length) await advanceQuestion();
          else examFinished = true;
          return;
        }
        feedback = data as Feedback;
      } else {
        const ok = answer !== null && (isNumeric(q) ? checkNumeric(q, Number(answer)) : answer === q.correct);
        feedback = { question: q, ok, answer, seconds, points: T > 0 && ok ? Math.round(50 + 50 * speed) : 0, timedOut };
      }
      setResults((r) => [...r, resultOf(feedback)]);
      setChoice(feedback.answer);
      setChecked(true);
    } catch {
      setFormError(exam ? "L’examen n’a pas pu avancer. Réessaie." : "La réponse n’a pas pu être vérifiée. Réessaie.");
    } finally {
      setPending(false);
      busy.current = false;
      if (examFinished) finish();
    }
  }

  async function persist(id: string) {
    if (busy.current) return;
    busy.current = true;
    setSave("saving");
    try {
      const { data, error } = await getSupabase().rpc("finish_quiz_run", { p_run: id });
      if (error || !data) throw new Error("session");
      const saved = data as QuizSummary;
      if (exam) {
        if (saved.corrections?.length !== items.length) throw new Error("corrections");
        setResults(saved.corrections.map(resultOf));
      }
      setSummary(saved);
      if (resumeKey.current && readQuizResume<ServerResume>(resumeKey.current)?.id === id) clearQuizResume(resumeKey.current);
      setSave("saved");
    } catch {
      setSave("error");
    } finally {
      busy.current = false;
    }
  }

  async function next() {
    if (!checked || busy.current) return;
    if (idx + 1 === items.length) {
      finish();
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      await advanceQuestion();
    } catch {
      setFormError("La question suivante n’a pas pu démarrer. Réessaie.");
    } finally {
      setPending(false);
      busy.current = false;
    }
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  function handleKey(e: KeyboardEvent) {
    if (phase !== "playing" || !items[idx] || busy.current || e.repeat || e.isComposing
      || e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
    const it = items[idx];
    const target = e.target instanceof HTMLElement ? e.target : null;
    const typing = target?.closest("input, textarea, select, [contenteditable]");
    const ready = isNumeric(it.q) ? text.trim() !== "" : choice !== null;
    if (e.key === "Enter") {
      if (typing && !target?.matches("[data-quiz-answer]")) return;
      const control = target?.closest("button, a, summary, form");
      if (control && !control.matches("[data-quiz-option][aria-pressed=true]")) return;
      e.preventDefault();
      if (checked) next();
      else if (ready) submit(false);
      return;
    }
    if (checked || typing) return;
    const k = e.key.toLowerCase();
    let selected: number | boolean | undefined;
    if (it.q.type === "mcq") {
      const pos = "123456789".indexOf(k) >= 0 ? "123456789".indexOf(k) : LETTERS.indexOf(k.toUpperCase());
      if (pos >= 0 && pos < it.order.length) selected = it.order[pos];
    } else if (it.q.type === "true_false") {
      if (k === "v" || k === "1") selected = true;
      if (k === "f" || k === "2") selected = false;
    }
    if (selected !== undefined) {
      e.preventDefault();
      setChoice(selected);
      responses.current?.querySelector<HTMLButtonElement>(`[data-quiz-option="${selected}"]`)?.focus();
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
          <Link href={guest || props.guestOnly ? "/" : "/parcours"} className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          {props.onBack
            ? <button onClick={props.onBack} className="text-sm text-muted hover:text-fg">{backLabel}</button>
            : <Link href={backHref} className="text-sm text-muted hover:text-fg">{backLabel}</Link>}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
    </div>
  );

  if (phase === "loading") return shell(<p className="text-sm text-muted">Chargement…</p>);
  if (phase === "empty")
    return shell(
      <div className="space-y-4">
        <p role="status" className="text-sm text-muted">{note ?? "Aucune question disponible pour ce choix pour le moment."}</p>
        <Link href={exam ? backHref : "/entrainement"} className="inline-block border border-line px-5 py-3 text-sm hover:border-muted">
          {exam ? "Retour au parcours" : "Choisir un autre mode"}
        </Link>
      </div>,
    );
  if (phase === "error")
    return shell(
      <div className="space-y-4">
        <p role="alert" className="border-l-2 border-danger bg-panel px-3 py-2.5 text-sm">Impossible de charger le quiz : {message}</p>
        <button onClick={replay} className="border border-line px-4 py-2 text-sm hover:border-muted">Réessayer</button>
      </div>,
    );

  if (phase === "done" && exam && !results.length) {
    return shell(save === "error" && sessionId ? (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-danger">Le résultat de l’examen n’a pas pu être chargé.</p>
        <button type="button" onClick={() => persist(sessionId)} className="border border-line px-4 py-2 text-sm hover:border-muted">Réessayer</button>
      </div>
    ) : <p role="status" className="text-sm text-muted">Calcul de ton résultat…</p>);
  }

  if (phase === "done") {
    const score = results.filter((r) => r.ok).length;
    const pct = Math.round((score / results.length) * 100);
    const points = results.reduce((s, r) => s + r.points, 0);
    const avg = results.reduce((s, r) => s + r.seconds, 0) / results.length;
    const stats: [string, string][] = [
      ["Score", `${score}/${results.length}`],
      ["Réussite", `${pct} %`],
      T > 0 && !exam ? ["Points", String(points)] : ["Durée", clock(total)],
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

        {sessionId && (
        <div role="status" className="mt-4 border border-line bg-panel px-4 py-3 text-sm">
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
          {save === "error" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-danger">Ta progression n’a pas pu être enregistrée.</span>
              <button onClick={() => persist(sessionId)} className="underline underline-offset-4">Réessayer l’enregistrement</button>
            </div>
          )}
        </div>
        )}
        {guest && (
          <div className="mt-4 border border-line bg-panel px-4 py-3 text-sm text-muted">
            <Link href="/inscription" className="text-fg underline underline-offset-4 hover:text-accent">Crée un compte</Link> pour conserver ta progression et débloquer le parcours complet.
          </div>
        )}

        {renderEnd?.(results, summary, guest)}

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
                  {r.wrongNote && <p>{r.wrongNote}</p>}
                  <p>{r.q.explanation}</p>
                  {(r.q.source || r.q.reference_date) && (
                    <p className="font-mono text-xs">
                      {r.q.source && <>Source : {r.q.source}</>}
                      {r.q.kind === "conjunctural" && r.q.reference_date && (
                        <span className="ml-3 text-warn">Donnée au {frDate(r.q.reference_date)}</span>
                      )}
                    </p>
                  )}
                  <QuestionActions question={r.q} />
                </div>
              </details>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={replay} disabled={save === "saving"} className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40">
            {replayLabel}
          </button>
          {guest ? (
            <Link href="/inscription" className="border border-line px-5 py-3 text-sm hover:border-muted">
              Créer un compte
            </Link>
          ) : (
            <Link href="/parcours" className="border border-line px-5 py-3 text-sm hover:border-muted">
              Mon parcours
            </Link>
          )}
          <Link href="/entrainement" className="border border-line px-5 py-3 text-sm hover:border-muted">
            Entraînement libre
          </Link>
        </div>
      </div>,
    );
  }

  // phase === "playing"
  const item = items[idx];
  const last = results[results.length - 1];
  const q = checked && last ? last.q : item.q;
  const allowsEstimate = isNumeric(q) && (q.tolerance_pct ?? 0) > 0;
  const unit = unitOf(q);
  const wrongSelected = checked && q.type === "mcq" && !last?.ok && typeof choice === "number" ? wrongNote(q, choice) : null;
  const elapsedQ = Math.max(0, (now - qStart) / 1000);
  const remaining = T > 0 ? Math.max(0, T - elapsedQ) : 0;
  const barPct = T > 0 ? Math.round((remaining / T) * 100) : 0;
  const readyToSubmit = (T > 0 && remaining === 0) || (isNumeric(q) ? text.trim() !== "" : choice !== null);

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
        <span className="truncate px-2">{CAT_NAME[q.category_id] ?? q.category_id}, {DIFFICULTY_FR[q.difficulty] ?? q.difficulty}</span>
        <span className={T > 0 && remaining <= 5 && !checked ? "text-danger" : "text-fg"}>
          {T > 0 ? `${Math.ceil(remaining)} s` : clock(Math.floor((now - startAt) / 1000))}
        </span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {items.map((it, i) => (
          <span
            key={`${it.q.id}-${i}`}
            className={`h-1 flex-1 ${i < results.length ? (results[i].ok ? "bg-accent" : "bg-danger") : i < idx ? "bg-muted" : i === idx ? "bg-fg" : "bg-line"}`}
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

        <div ref={responses} className="mt-6 space-y-2">
          {q.type === "mcq" &&
            item.order.map((optIdx, pos) => (
              <button key={optIdx} type="button" data-quiz-option={optIdx} disabled={checked || pending} aria-pressed={choice === optIdx} onClick={() => setChoice(optIdx)} className={optionClass(optIdx)}>
                <span className="font-mono text-muted">{LETTERS[pos]}</span>
                <span>{mcqOptions(q)[optIdx]}</span>
              </button>
            ))}

          {q.type === "true_false" &&
            [true, false].map((v) => (
              <button key={String(v)} type="button" data-quiz-option={String(v)} disabled={checked || pending} aria-pressed={choice === v} onClick={() => setChoice(v)} className={tfClass(v)}>
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
                data-quiz-answer
                disabled={checked || pending}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ta réponse"
                aria-label="Ta réponse"
                className="w-full max-w-[14rem] border border-line bg-panel px-3 py-3 font-mono text-base focus:border-accent focus:outline-none disabled:opacity-60"
              />
              {unit && <span className="text-sm text-muted">{unit}</span>}
            </div>
          )}
          {allowsEstimate && !checked && <p className="text-xs text-muted">Réponse approchée acceptée</p>}
        </div>

        {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}

        {checked && last && (
          <div role="status" className={`fade-in mt-6 border-l-2 bg-panel px-4 py-4 text-sm leading-relaxed ${last.ok ? "border-accent" : "border-danger"}`}>
            <p className={`font-semibold ${last.ok ? "text-accent" : "text-danger"}`}>
              {last.ok ? "Correct." : last.given === "Temps écoulé" ? "Temps écoulé." : "Incorrect."}
              {T > 0 && last.ok && <span className="ml-2 font-mono text-xs font-normal text-muted">+{last.points} pts · {last.seconds.toFixed(1).replace(".", ",")} s</span>}
            </p>
            {(!last.ok || allowsEstimate) && (
              <p className="mt-1">
                {allowsEstimate ? "Valeur de référence" : "Bonne réponse"} · <span className="font-medium">{correctLabel(q)}</span>
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
            <QuestionActions question={q} />
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          {!checked ? (
            <button type="button" disabled={!readyToSubmit || pending} onClick={() => submit(false)} className="bg-accent px-6 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40">
              {pending ? "Validation…" : "Valider"}
            </button>
          ) : (
            <button type="button" onClick={next} disabled={pending} className="bg-accent px-6 py-3 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-40">
              {pending ? "Chargement…" : idx + 1 < items.length ? "Question suivante" : "Voir les résultats"}
            </button>
          )}
          <span className="hidden font-mono text-xs text-muted sm:inline">
            Entrée pour valider{q.type === "mcq" ? ` · 1 à ${Math.min(item.order.length, 9)} pour choisir` : q.type === "true_false" ? " · 1 ou 2 pour choisir" : ""}
          </span>
        </div>
      </div>
    </div>,
  );
}
