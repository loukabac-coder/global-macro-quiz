import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import { CHAPTERS } from "@/lib/courses";
import { legacyLessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, unitCode, unitHref } from "@/lib/program";

export function generateStaticParams() {
  return [...GROUPS, ...CHAPTERS].map(({ slug }) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default function CoursModule(props: Props) {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement des sous-modules…</p>}><ModuleContents {...props} /></Suspense>;
}

async function ModuleContents({ params }: Props) {
  const { slug } = await params;
  const group = GROUPS.find((item) => item.slug === slug);
  if (!group) {
    const old = legacyLessonHref(slug);
    if (old) redirect(old);
    notFound();
  }
  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <Crumbs items={[["Cours", "/cours"], [group.title]]} />
        <h1 className="text-3xl font-semibold tracking-tight"><span className="text-accent">{group.no}</span> · {group.title}</h1>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {group.units.map((unit) => (
            <li key={unit.slug}>
              <Link href={unitHref(group, unit)} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-4 hover:bg-panel">
                <span className="font-mono text-accent">{unitCode(group, unit)}</span>
                <span className="font-semibold">{unit.title}</span>
                <span className="text-sm text-muted sm:ml-auto">{lessonsFor(group, unit).length} pages</span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </AppShell>
  );
}
