"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import QuizRunner, { type Result } from "@/components/QuizRunner";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { useSearch } from "@/lib/useSearch";
import { moduleQuestions } from "@/lib/moduleQuestions";
import { MINI_CHECK_SIZE, MODULE_QUIZ_SIZE, PASS_THRESHOLD } from "@/lib/config";
import {
  GUEST_MODULE,
  MODULES,
  computeStatuses,
  levelOfModule,
  moduleById,
  previousModule,
  type Module,
  type Progress,
} from "@/lib/modules";

type Phase = "loading" | "blocked" | "course" | "check" | "quiz";
type Block = "soon" | "account" | "locked" | "unknown" | "error";

function Outcome({ results, m, guest, passed, onCourse }: { results: Result[]; m: Module; guest: boolean; passed: boolean; onCourse: () => void }) {
  const score = results.filter((r) => r.ok).length;
  const pct = Math.round((score / results.length) * 100);
  const next = MODULES[MODULES.findIndex((x) => x.id === m.id) + 1];
  return (
    <section className={`fade-in mt-6 border-2 bg-panel p-5 ${passed ? "border-accent" : "border-warn"}`}>
      <h2 className="text-xl font-semibold">{m.title}</h2>
      <p className="mt-2 text-sm text-muted">
        {passed ? "Seuil atteint" : "Seuil à atteindre"} · {pct} % (seuil {PASS_THRESHOLD} %)
      </p>
      {passed ? (
        <div className="mt-4">
          {guest
            ? <Link href="/inscription" className="inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink">Créer un compte pour suivre le parcours</Link>
            : <Link href={next?.ready ? `/module?id=${next.id}` : "/parcours"} className="inline-block bg-accent px-5 py-3 text-sm font-semibold text-ink">
                {next?.ready ? `Continuer avec « ${next.title} »` : "Voir le parcours terminé"}
              </Link>}
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">Il te manque {Math.ceil(PASS_THRESHOLD * results.length / 100) - score} bonne(s) réponse(s).</p>
          <button onClick={onCourse} className="mt-4 border border-line px-5 py-3 text-sm hover:border-muted">Revoir le cours</button>
        </>
      )}
    </section>
  );
}

export default function ModulePage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du module…</p>}><SelectedModule /></Suspense>;
}

function SelectedModule() {
  const search = useSearch();
  const id = new URLSearchParams(search).get("id");
  return <ModuleContent key={id ?? ""} m={moduleById(id)} />;
}

function ModuleContent({ m }: { m?: Module }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [block, setBlock] = useState<Block>("unknown");
  const [guest, setGuest] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let active = true;
    async function run() {
      const mod = m;
      if (!mod) {
        if (active) {
          setBlock("unknown");
          setPhase("blocked");
        }
        return;
      }
      let isGuest = true;
      const progress: Progress = {};
      let placement: string | null = null;
      try {
        const supabase = supabaseConfigured() ? getSupabase() : null;
        const session = supabase ? await supabase.auth.getSession() : null;
        if (session?.error) throw session.error;
        const user = session?.data.session?.user;
        if (user && supabase) {
          isGuest = false;
          const [mp, pr] = await Promise.all([
            supabase.from("module_progress").select("module_id, passed, best_pct, attempts").eq("user_id", user.id),
            supabase.from("profiles").select("placement_level").eq("id", user.id).maybeSingle(),
          ]);
          if (mp.error || pr.error) throw new Error("progression indisponible");
          for (const r of (mp.data ?? []) as { module_id: string; passed: boolean; best_pct: number; attempts: number }[]) {
            progress[r.module_id] = { passed: r.passed, best_pct: r.best_pct, attempts: r.attempts };
          }
          placement = (pr.data as { placement_level: string | null } | null)?.placement_level ?? null;
        }
      } catch {
        if (active) {
          setBlock("error");
          setPhase("blocked");
        }
        return;
      }
      if (!active) return;
      setGuest(isGuest);
      if (!mod.ready) {
        setBlock("soon");
        setPhase("blocked");
      } else if (isGuest && mod.id !== GUEST_MODULE) {
        setBlock("account");
        setPhase("blocked");
      } else if (!isGuest && computeStatuses(progress, placement)[mod.id] === "locked") {
        setBlock("locked");
        setPhase("blocked");
      } else {
        setPhase("course");
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [m]);

  const lvl = m ? levelOfModule(m) : null;

  if (phase === "check" && m) {
    return (
      <QuizRunner
        key={`check-${round}`}
        title={`Mini-check · ${m.title}`}
        kicker="Mini-check · non noté, rien n’est enregistré"
        practiceLoad={async () => moduleQuestions(m, MINI_CHECK_SIZE)}
        backHref="/parcours"
        backLabel="Parcours"
        replayLabel="Refaire le mini-check"
        renderEnd={() => (
          <div className="fade-in mt-6 border border-accent bg-panel p-5">
            <p className="font-semibold">Prêt pour le quiz noté ?</p>
            <p className="mt-1 text-sm text-muted">{MODULE_QUIZ_SIZE} questions. Il faut {PASS_THRESHOLD} % pour valider le module.</p>
            <button onClick={() => setPhase("quiz")} className="mt-4 bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
              Lancer le quiz noté →
            </button>
          </div>
        )}
      />
    );
  }

  if (phase === "quiz" && m) {
    return (
      <QuizRunner
        key={`quiz-${round}`}
        title={`Quiz noté · ${m.title}`}
        kicker={`Quiz noté · seuil ${PASS_THRESHOLD} %`}
        activity={{ type: "module", id: m.id }}
        backHref="/parcours"
        backLabel="Parcours"
        replayLabel="Réessayer"
        guestLoad={m.id === GUEST_MODULE ? async () => moduleQuestions(m, MODULE_QUIZ_SIZE) : undefined}
        renderEnd={(results, summary, isGuest) => {
          if (!isGuest && summary?.module_passed === undefined) return null;
          const passed = summary?.module_passed ?? results.filter((r) => r.ok).length * 100 >= PASS_THRESHOLD * results.length;
          return <Outcome results={results} m={m} guest={isGuest} passed={passed} onCourse={() => setPhase("course")} />;
        }}
      />
    );
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        {phase === "loading" && <p className="text-sm text-muted">Chargement…</p>}

        {phase === "blocked" && (
          <div>
            <Crumbs items={[["Parcours", "/parcours"], [m ? m.title : "Module"]]} />
            <h1 className="text-3xl font-semibold tracking-tight">{m ? m.title : "Module introuvable"}</h1>
            <div className="mt-6 border border-line bg-panel p-5 text-sm leading-relaxed">
              {block === "unknown" && <p>Ce module n’existe pas.</p>}
              {block === "error" && <p role="alert">Ta progression n’a pas pu être chargée. Actualise la page pour réessayer.</p>}
              {block === "soon" && <p>Ce module est en préparation : les questions arrivent bientôt.</p>}
              {block === "account" && (
                <p>
                  Ce module demande un compte. <Link href="/inscription" className="text-fg underline underline-offset-4 hover:text-accent">Crée un compte</Link> pour débloquer le parcours complet.
                </p>
              )}
              {block === "locked" && m && (
                <p>
                  Ce module est verrouillé. Valide d’abord « {previousModule(m.id)?.title} » avec au moins {PASS_THRESHOLD} %.
                </p>
              )}
            </div>
            <Link href="/parcours" className="mt-6 inline-block border border-line px-5 py-3 text-sm hover:border-muted">
              Retour au parcours
            </Link>
          </div>
        )}

        {phase === "course" && m && lvl && (
          <div>
            <Crumbs items={[["Parcours", "/parcours"], [lvl.name, "/parcours"], [m.title]]} />
            <p className="font-mono text-xs text-accent">
              {lvl.name.toUpperCase()} · MODULE {m.id.slice(1)}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{m.title}</h1>
            <p className="mt-3 text-muted">{m.goal}</p>

            {guest && (
              <p className="mt-4 border-l-2 border-warn bg-panel px-3 py-2.5 text-sm text-muted">
                Mode invité : rien n’est sauvegardé. <Link href="/inscription" className="text-fg underline underline-offset-4 hover:text-accent">Crée un compte</Link> pour valider le module et débloquer la suite.
              </p>
            )}

            <section className="mt-8 border border-line bg-panel">
              <h2 className="border-b border-line px-4 py-3 font-mono text-sm text-accent">Cours court : l’essentiel</h2>
              <ul className="space-y-3 px-4 py-4">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-mono text-accent">›</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {m.chapter && (
                <p className="border-t border-line px-4 py-3 text-sm">
                  <Link href={`/cours/${m.chapter}`} className="text-fg underline underline-offset-4 hover:text-accent">
                    Lire la fiche complète
                  </Link>
                </p>
              )}
            </section>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => { setRound((n) => n + 1); setPhase("check"); }} className="bg-accent px-6 py-3.5 text-sm font-semibold text-ink hover:brightness-110">
                Commencer le mini-check ({MINI_CHECK_SIZE} questions) →
              </button>
              <button onClick={() => { setRound((n) => n + 1); setPhase("quiz"); }} className="border border-line px-5 py-3.5 text-sm text-muted hover:border-muted hover:text-fg">
                Passer directement au quiz noté
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-muted">
              Le mini-check n’est pas noté. Le quiz noté valide le module à partir de {PASS_THRESHOLD} % de bonnes réponses.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  );
}
