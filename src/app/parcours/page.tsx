"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import { PASS_THRESHOLD } from "@/lib/config";
import { moduleById, type Progress } from "@/lib/modules";
import { levelName, levelProgress } from "@/lib/progress";
import { GROUPS, LEVELS, TRACKS, GUEST_MILESTONE, canAttempt, getMilestone, hasPassed, levelOpen, milestone, milestoneHref, unitCode, unitsAt, type Milestone } from "@/lib/program";
import { useProgramProgress } from "@/lib/useProgramProgress";

function QuizLink({ item, progress, guest }: { item: Milestone; progress: Progress; guest: boolean }) {
  const { group, unit } = item;
  const done = hasPassed(item, progress);
  const canStart = guest ? item.id === GUEST_MILESTONE : canAttempt(item, progress);
  const label = unit ? `${unitCode(group, unit)} · ${unit.title}` : "Quiz de synthèse";
  const attempt = progress[item.id];
  const best = attempt?.best_pct;
  const status = done ? attempt?.passed ? `Réussi · ${attempt.best_pct} %` : "Acquis repris"
    : guest ? canStart ? "Essai invité" : "Compte requis"
      : canStart ? best === undefined ? "À faire" : `Meilleur score · ${best} %` : "Verrouillé";

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line py-3 text-sm">
      {canStart ? <Link className="font-medium underline decoration-line underline-offset-4 hover:text-accent" href={milestoneHref(item)}>{label}</Link>
        : <span className="font-medium">{label}</span>}
      <span className={`font-mono text-xs ${done ? "text-accent" : "text-muted"}`}>{status}</span>
    </li>
  );
}

export default function Parcours() {
  const { status, progress, profile, due, today } = useProgramProgress(true);
  const guest = status === "guest";
  const lp = profile ? levelProgress(profile.xp) : undefined;
  const stages = LEVELS.flatMap(({ id }) => GROUPS.map((group) => milestone(group, id, null)));
  const complete = stages.filter((item) => hasPassed(item, progress)).length;
  const todo = LEVELS.flatMap(({ id }) => GROUPS.flatMap((group) =>
    [...unitsAt(group, id).map((unit) => milestone(group, id, unit)), milestone(group, id, null)]))
    .find((item) => canAttempt(item, progress) && !hasPassed(item, progress));
  const archive = Object.entries(progress).filter(([id, row]) => !id.startsWith("p:") && row.passed);
  const links = [
    ["/examen-blanc", "Examen blanc", "20 questions · 45 s par question"],
    ["/quiz?mode=daily", "Défi du jour", today && profile?.last_daily_date === today ? "Fait aujourd’hui ✓" : "10 questions"],
    ["/quiz?mode=weakness", "Questions à revoir", due ? `${due} à revoir` : "Révision ciblée"],
    ["/entrainement", "Entraînement libre", "Quiz, filtres et jeux"],
    ["/favoris", "Favoris", "Questions enregistrées"],
    ["/test-niveau", "Test de niveau", "12 questions"],
  ];

  return (
    <AppShell>
      <main className="py-8 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Parcours</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">Réussis les quiz des sous-modules pour débloquer chacune des six synthèses. Il faut {PASS_THRESHOLD} % pour réussir un quiz. Les six synthèses ouvrent le niveau suivant.</p>
        {status === "loading" && <p className="mt-6 text-sm text-muted">Chargement de ta progression…</p>}
        {status === "error" && <p role="alert" className="mt-6 border-l-2 border-danger bg-panel p-4 text-sm">Ta progression n’a pas pu être chargée. Actualise la page pour réessayer.</p>}
        {guest && (
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href={milestoneHref(getMilestone(GUEST_MILESTONE)!)} className="bg-accent px-5 py-3 font-semibold text-ink">Essayer le calcul mental</Link>
            <Link href="/invite" className="border border-line px-5 py-3 hover:border-accent">Quiz rapide</Link>
            <Link href="/inscription" className="border border-line px-5 py-3 hover:border-accent">Créer un compte</Link>
          </div>
        )}
        {profile && lp && (
          <section className="mt-6 border border-line bg-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold"><Link href="/profil" className="hover:text-accent">{levelName(lp.level)}</Link></h2>
              <p className="font-mono text-sm text-muted">{profile.xp} XP · {profile.streak_days} j de série</p>
            </div>
            <div className="mt-3 h-1.5 bg-line"><div className="h-full bg-accent" style={{ width: `${lp.pct}%` }} /></div>
            <p className="mt-3 text-sm">{complete}/18 synthèses réussies</p>
            {todo && <Link href={milestoneHref(todo)} className="mt-4 inline-block bg-accent px-4 py-3 text-sm font-semibold text-ink">Continuer · {todo.unit?.title ?? todo.group.title}</Link>}
          </section>
        )}
        <nav aria-label="Modes d’entraînement" className="mt-6 grid gap-2 sm:grid-cols-3">
          {links.map(([href, label, detail]) => (
            <Link key={href} className="border border-line px-4 py-3 text-sm hover:border-accent" href={href}>
              <span className="font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{detail}</span>
            </Link>
          ))}
        </nav>
        {(status === "ready" || guest) && (
          <div className="mt-10 space-y-10">
            {LEVELS.map(({ id, name }) => (
              <section key={id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                  <h2 className="text-2xl font-semibold">{name}</h2>
                  <span className="font-mono text-sm text-muted">{!levelOpen(id, progress) ? "Niveau verrouillé" : `${stages.filter((item) => item.level === id && hasPassed(item, progress)).length}/6 modules validés`}</span>
                </div>
                {TRACKS.map((track) => (
                  <section key={track.id} className="mt-5">
                    <h3 className="mb-2 text-sm font-semibold text-muted">{track.title}</h3>
                    <div className="space-y-2">
                      {GROUPS.filter((group) => group.track === track.id).map((group) => {
                        const synthesis = milestone(group, id, null);
                        const units = unitsAt(group, id);
                        const done = units.filter((unit) => hasPassed(milestone(group, id, unit), progress)).length;
                        return (
                          <details key={group.no} id={`${id}-${group.no}`} className="scroll-mt-5 border border-line bg-panel" open={todo?.group.no === group.no && todo.level === id || undefined}>
                            <summary className="cursor-pointer px-4 py-4 hover:text-accent">
                              <span className="mr-2 font-mono text-accent">{group.no}</span><span className="font-semibold">{group.title}</span>
                              <span className="ml-3 text-xs text-muted">{hasPassed(synthesis, progress) ? "Validé ✓" : `${done}/${units.length} sous-modules`}</span>
                            </summary>
                            <ul className="px-4">
                              {units.map((unit) => <QuizLink key={unit.slug} item={milestone(group, id, unit)} progress={progress} guest={guest} />)}
                              <QuizLink item={synthesis} progress={progress} guest={guest} />
                            </ul>
                            <Link className="mx-4 mb-4 inline-block text-sm underline underline-offset-4 hover:text-accent" href={`/cours/${group.slug}`}>Tous les cours du module</Link>
                          </details>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </section>
            ))}
          </div>
        )}
        {!!archive.length && (
          <details className="mt-10 border border-line px-4 py-3">
            <summary className="cursor-pointer font-semibold">Anciennes validations · {archive.length}</summary>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {archive.map(([id, row]) => <li key={id}>{moduleById(id)?.title ?? id} · {row.best_pct} %</li>)}
            </ul>
          </details>
        )}
      </main>
    </AppShell>
  );
}
