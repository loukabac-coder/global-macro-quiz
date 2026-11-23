import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import CourseReferences from "@/components/CourseReferences";
import { lessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, LEVELS, milestone, milestoneHref, unitCode, unitsAt } from "@/lib/program";
import { hasStudyReferences } from "@/lib/studyReferences";

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

  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <Crumbs items={[["Cours", "/cours"], [group.title, `/cours/${slug}`], [unit.title]]} />
        <h1 className="text-3xl font-semibold tracking-tight"><span className="text-accent">{code}</span> · {unit.title}</h1>
        {hasStudyReferences(`${slug}/${sous}`) && <CourseReferences key={`${slug}/${sous}`} scope={`${slug}/${sous}`} jump={{ href: "#sommaire", label: "Voir le sommaire" }} />}
        <h2 id="sommaire" className="mt-8 scroll-mt-5 text-xl font-semibold">Sommaire</h2>
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {pages.map((page, index) => (
            <li key={page.slug}>
              <Link href={lessonHref(group, unit, page)} className="grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-1 px-2 py-4 hover:bg-panel sm:grid-cols-[4rem_1fr_8rem]">
                <span className="font-mono text-sm text-accent">{code}.{index + 1}</span>
                <span className="font-semibold">{page.title}</span>
                <span className="col-start-2 text-sm text-muted sm:col-start-3 sm:text-right">{LEVELS.find((level) => level.id === page.level)?.name}</span>
              </Link>
            </li>
          ))}
        </ol>
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
