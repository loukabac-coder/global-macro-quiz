"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import QuizRunner from "@/components/QuizRunner";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import { MINI_CHECK_SIZE, PASS_THRESHOLD } from "@/lib/config";
import { moduleById } from "@/lib/modules";
import { GUEST_MILESTONE, LEVELS, canAttempt, getMilestone, levelOpen, milestoneSize, unitCode, unitHref, unitsAt, type Milestone } from "@/lib/program";
import { useProgramProgress } from "@/lib/useProgramProgress";
import { useSearch } from "@/lib/useSearch";

export default function ModulePage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du module…</p>}><SelectedModule /></Suspense>;
}

function SelectedModule() {
  const search = useSearch();
  const id = new URLSearchParams(search).get("id");
  return <ModuleContent key={id ?? ""} module={getMilestone(id)} legacyId={moduleById(id)?.id} legacyTitle={moduleById(id)?.title} />;
}

function ModuleContent({ module, legacyId, legacyTitle }: { module?: Milestone; legacyId?: string; legacyTitle?: string }) {
  const { status, progress } = useProgramProgress();
  const [phase, setPhase] = useState<"course" | "check" | "quiz">("course");
  const guest = status === "guest";
  const title = module?.unit?.title ?? (module ? `Synthèse · ${module.group.title}` : legacyTitle ?? "Quiz introuvable");
  const level = LEVELS.find((entry) => entry.id === module?.level);
  const allowed = module && (guest ? module.id === GUEST_MILESTONE : status === "ready" && canAttempt(module, progress));
  const size = module ? milestoneSize(module) : 0;
  const courseHref = module?.unit ? unitHref(module.group, module.unit) : module ? `/cours/${module.group.slug}` : "/cours";
  const back = module ? `/parcours#${module.level}-${module.group.no}` : "/parcours";

  if (allowed && module && phase === "check") {
    return (
      <QuizRunner
        title={`Mini-check · ${title}`}
        kicker="Mini-check · entraînement libre"
        practiceLoad={async () => (await import("@/lib/drawQuestions")).milestoneDraw(module, [], new Set(), MINI_CHECK_SIZE)}
        practiceKey={module.id}
        backHref={back}
        backLabel="Parcours"
        replayLabel="Refaire le mini-check"
        onBack={() => setPhase("course")}
        renderEnd={() => (
          <div className="mt-6 border border-accent bg-panel p-5">
            <p className="text-sm text-muted">{size} questions · seuil de {PASS_THRESHOLD} %</p>
            <button onClick={() => setPhase("quiz")} className="mt-3 bg-accent px-5 py-3 text-sm font-semibold text-ink">Lancer le quiz noté</button>
          </div>
        )}
      />
    );
  }

  if (allowed && module && phase === "quiz") {
    return (
      <QuizRunner
        title={`Quiz noté · ${title}`}
        kicker={`${level?.name} · seuil ${PASS_THRESHOLD} %`}
        activity={{ type: "module", id: legacyId ?? module.id }}
        backHref={back}
        backLabel="Parcours"
        replayLabel="Nouveau tirage"
        guestLoad={module.id === GUEST_MILESTONE ? async () => (await import("@/lib/drawQuestions")).milestoneDraw(module) : undefined}
        renderEnd={(results, summary, isGuest) => {
          if (!isGuest && summary?.module_passed === undefined) return null;
          const score = results.filter((result) => result.ok).length;
          const passed = summary?.module_passed ?? score * 100 >= PASS_THRESHOLD * results.length;
          return (
            <section className={`mt-6 border bg-panel p-5 ${passed ? "border-accent" : "border-warn"}`}>
              <h2 className="text-xl font-semibold">{passed ? module.unit ? "Sous-module réussi" : "Module validé" : "Seuil à atteindre"}</h2>
              <p className="mt-2 text-sm text-muted">{score}/{results.length} · seuil de {PASS_THRESHOLD} %</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link className="border border-line px-4 py-3 hover:border-accent" href={courseHref}>Revoir le cours</Link>
                <Link className="bg-accent px-4 py-3 font-semibold text-ink" href={isGuest ? "/inscription" : back}>{isGuest ? "Créer un compte" : "Continuer le parcours"}</Link>
              </div>
            </section>
          );
        }}
      />
    );
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <Crumbs items={[["Parcours", "/parcours"], [module?.group.title ?? "Quiz", back]]} />
        {module && <p className="font-mono text-sm text-accent">{module.unit ? unitCode(module.group, module.unit) : module.group.no} · {level?.name}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        {!module ? <p className="mt-4 text-muted">{legacyTitle ? "Cette étape figure dans les anciens résultats. Retrouve les cours réorganisés dans le parcours." : "Ce quiz n’existe pas."}</p>
          : status === "loading" ? <p className="mt-4 text-muted">Chargement de ta progression…</p>
            : status === "error" ? <p role="alert" className="mt-4 text-muted">Ta progression n’a pas pu être chargée. Actualise la page pour réessayer.</p>
              : !allowed ? (
                <p className="mt-4 text-muted">
                  {guest ? <><Link href="/inscription" className="underline hover:text-accent">Crée un compte</Link> pour suivre ta progression.</>
                    : levelOpen(module.level, progress) ? "Valide les sous-modules de ce niveau pour débloquer la synthèse."
                      : "Valide les six synthèses du niveau précédent pour continuer."}
                </p>
              ) : (
                <>
                  <p className="mt-4 text-muted">{size} questions · seuil de {PASS_THRESHOLD} % {guest && "· essai invité"}</p>
                  <section className="mt-6 border border-line bg-panel p-5">
                    <h2 className="font-semibold">{module.unit ? "Pages de cours" : "Notions à réviser"}</h2>
                    <ul className="mt-3 space-y-2 text-sm">
                      {(module.unit ? [module.unit] : unitsAt(module.group, module.level)).map((unit) => (
                        <li key={unit.slug}><Link href={unitHref(module.group, unit)} className="underline underline-offset-4 hover:text-accent">{unitCode(module.group, unit)} · {unit.title}</Link></li>
                      ))}
                    </ul>
                  </section>
                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <button onClick={() => setPhase("quiz")} className="bg-accent px-5 py-3 font-semibold text-ink hover:brightness-110">Lancer le quiz noté</button>
                    <button onClick={() => setPhase("check")} className="border border-line px-5 py-3 hover:border-accent">Faire le mini-check</button>
                  </div>
                </>
              )}
        {!allowed && <Link className="mt-6 inline-block border border-line px-4 py-3 text-sm hover:border-accent" href={courseHref}>Voir les cours</Link>}
      </main>
    </AppShell>
  );
}
