import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import CourseReferences from "@/components/CourseReferences";
import { lessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, LEVELS, milestone, milestoneHref, unitCode, unitHref } from "@/lib/program";
import { hasStudyReferences } from "@/lib/studyReferences";

export function generateStaticParams() {
  return GROUPS.flatMap((group) => group.units.flatMap((unit) =>
    lessonsFor(group, unit).map((lesson) => ({ slug: group.slug, sous: unit.slug, page: lesson.slug }))));
}

type Props = { params: Promise<{ slug: string; sous: string; page: string }> };

export default function CoursPage(props: Props) {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du cours…</p>}><LessonContents {...props} /></Suspense>;
}

async function LessonContents({ params }: Props) {
  const { slug, sous, page } = await params;
  const group = GROUPS.find((item) => item.slug === slug);
  const unit = group?.units.find((item) => item.slug === sous);
  if (!group || !unit) notFound();
  const lessons = lessonsFor(group, unit);
  const index = lessons.findIndex((item) => item.slug === page);
  const lesson = lessons[index];
  if (!lesson) notFound();
  const level = LEVELS.find(({ id }) => id === lesson.level)!;
  const quizLevel = unit.from && lesson.level === "beginner" ? unit.from : lesson.level;

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <Crumbs items={[["Cours", "/cours"], [group.title, `/cours/${group.slug}`], [unit.title, unitHref(group, unit)]]} />
        <p className="font-mono text-sm text-accent">{unitCode(group, unit)}.{index + 1} · {level.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        {hasStudyReferences(`${slug}/${sous}`) && <CourseReferences key={`${slug}/${sous}`} scope={`${slug}/${sous}`} jump={{ href: "#explications", label: "Lire les explications" }} />}
        <div id="explications" className="mt-8 scroll-mt-5 space-y-8">
          {lesson.sections.map((section, number) => (
            <section key={number}>
              {section.title !== lesson.title && <h2 className="border-b border-line pb-2 text-lg font-semibold">{section.title}</h2>}
              {section.paragraphs?.map((p) => <p key={p} className="mt-3 leading-relaxed">{p}</p>)}
              {section.bullets && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              {section.formulas && <div className="mt-4 space-y-1 border border-line bg-panel px-4 py-3 font-mono text-sm">{section.formulas.map((formula) => <p key={formula}>{formula}</p>)}</div>}
              {section.table && (
                <div className="mt-4 overflow-x-auto border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-panel text-left font-mono text-xs text-muted">
                      <tr>{section.table.head.map((col) => <th key={col} scope="col" className="px-3 py-2 font-normal">{col}</th>)}</tr>
                    </thead>
                    <tbody>{section.table.rows.map((row) => <tr key={row.join("|")} className="border-t border-line">{row.map((cell, i) => <td key={i} className="px-3 py-2 align-top">{cell}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {section.example && <p className="mt-4 border-l-2 border-accent bg-panel px-4 py-3 text-sm leading-relaxed"><strong className="text-accent">Exemple chiffré fictif. </strong>{section.example}</p>}
            </section>
          ))}
        </div>
        {lesson.sources?.length ? <ul className="mt-8 space-y-2 text-sm text-muted">{lesson.sources.map(({ url, label }) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-accent">{label}</a></li>)}</ul> : null}
        <nav aria-label="Navigation du sous-module" className="mt-10 flex flex-wrap gap-3 border-t border-line pt-5 text-sm">
          {lessons[index - 1] && <Link className="border border-line px-4 py-3 hover:border-accent" href={lessonHref(group, unit, lessons[index - 1])}>← Page précédente</Link>}
          <Link className="border border-line px-4 py-3 hover:border-accent" href={unitHref(group, unit)}>Sommaire</Link>
          {lessons[index + 1] && <Link className="border border-line px-4 py-3 hover:border-accent" href={lessonHref(group, unit, lessons[index + 1])}>Page suivante →</Link>}
          <Link className="bg-accent px-4 py-3 font-semibold text-ink hover:brightness-110" href={milestoneHref(milestone(group, quizLevel, unit))}>Quiz du sous-module</Link>
        </nav>
      </main>
    </AppShell>
  );
}
