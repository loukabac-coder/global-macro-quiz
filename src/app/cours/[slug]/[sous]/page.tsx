import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import { lessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, LEVELS, milestone, milestoneHref, unitCode, unitsAt } from "@/lib/program";
import { hasStudyReferences, studyDataHref } from "@/lib/studyReferences";

export function generateStaticParams() {
  return GROUPS.flatMap((group) => group.units.map((unit) => ({ slug: group.slug, sous: unit.slug })));
}

type Props = { params: Promise<{ slug: string; sous: string }> };

export default function CoursSousModule(props: Props) {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du sommaire…</p>}><UnitContents {...props} /></Suspense>;
}

async function UnitContents({ params }: Props) {
  const { slug, sous } = await params;
  const group = GROUPS.find((item) => item.slug === slug);
  const unit = group?.units.find((item) => item.slug === sous);
  if (!group || !unit) notFound();
  const code = unitCode(group, unit);
  const pages = lessonsFor(group, unit);
  const sources = [...new Map(pages.flatMap((page) => page.sources ?? []).map((source) => [source.url, source])).values()];

  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <Crumbs items={[["Cours", "/cours"], [group.title, `/cours/${slug}`], [unit.title]]} />
        <h1 className="text-3xl font-semibold tracking-tight"><span className="text-accent">{code}</span> · {unit.title}</h1>
        {hasStudyReferences(`${slug}/${sous}`) && (
          <nav aria-label="Sections du sous-module" className="mt-5 flex flex-wrap gap-2 text-sm">
            <span aria-current="page" className="border border-accent px-4 py-2">Cours</span>
            <Link href={studyDataHref(`${slug}/${sous}`)} className="border border-line px-4 py-2 hover:border-accent">Chiffres et classements</Link>
          </nav>
        )}
        <h2 id="sommaire" className="mt-8 scroll-mt-5 text-lg font-semibold">Sommaire</h2>
        <ol className="mt-3 flex flex-wrap gap-2 text-sm">
          {pages.map((page, index) => (
            <li key={page.slug}>
              <Link href={lessonHref(group, unit, page)} className="block border border-line px-3 py-2 hover:border-accent">
                <span className="mr-2 font-mono text-xs text-accent">{code}.{index + 1}</span>{page.title}
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {pages.map((page) => (
            <section key={page.slug} id={page.slug} className="scroll-mt-5 py-6">
              <h2 className="text-xl font-semibold">{page.title}</h2>
              {page.sections.map((section, index) => (
                <div key={index} className="mt-3 space-y-3 leading-relaxed">
                  {section.title !== page.title && <h3 className="font-semibold">{section.title}</h3>}
                  {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                  {section.bullets && <ul className="list-disc space-y-1 pl-5">{section.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}
                  {section.formulas && <div className="border border-line bg-panel p-3 font-mono text-sm">{section.formulas.map((formula) => <p key={formula}>{formula}</p>)}</div>}
                  {section.table && <div className="overflow-x-auto border border-line">
                    <table className="w-full text-sm">
                      <thead className="bg-panel text-left"><tr>{section.table.head.map((head) => <th key={head} scope="col" className="px-3 py-2">{head}</th>)}</tr></thead>
                      <tbody>{section.table.rows.map((row, i) => <tr key={i} className="border-t border-line">{row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>}
                  {section.example && <p className="border-l-2 border-accent bg-panel p-3 text-sm"><strong>Exemple. </strong>{section.example}</p>}
                </div>
              ))}
            </section>
          ))}
        </div>
        {!!sources.length && <ul className="mt-4 space-y-1 text-sm text-muted">{sources.map(({ url, label }) => <li key={url}><a href={url} className="underline hover:text-accent">{label}</a></li>)}</ul>}
        <h2 className="mt-8 text-xl font-semibold">Quiz du sous-module</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {LEVELS.filter(({ id }) => unitsAt(group, id).includes(unit)).map(({ id, name }) => (
            <li key={id}><Link className="inline-block border border-line px-4 py-3 text-sm hover:border-accent" href={milestoneHref(milestone(group, id, unit))}>{name}</Link></li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
