import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Crumbs from "@/components/Crumbs";
import CourseReferences from "@/components/CourseReferences";
import { lessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, unitHref } from "@/lib/program";
import { hasStudyReferences } from "@/lib/studyReferences";

export function generateStaticParams() {
  return GROUPS.flatMap((group) => group.units.flatMap((unit) => {
    const slug = group.slug;
    const sous = unit.slug;
    const pages = lessonsFor(group, unit).map((lesson) => ({ slug, sous, page: lesson.slug }));
    return hasStudyReferences(`${slug}/${sous}`) ? [...pages, { slug, sous, page: "chiffres" }] : pages;
  }));
}

type Props = { params: Promise<{ slug: string; sous: string; page: string }> };

export default function CoursPage(props: Props) {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du cours…</p>}><SubmodulePage {...props} /></Suspense>;
}

async function SubmodulePage({ params }: Props) {
  const { slug, sous, page } = await params;
  const group = GROUPS.find((item) => item.slug === slug);
  const unit = group?.units.find((item) => item.slug === sous);
  if (!group || !unit) notFound();
  if (page !== "chiffres") {
    const lesson = lessonsFor(group, unit).find((item) => item.slug === page);
    if (!lesson) notFound();
    permanentRedirect(lessonHref(group, unit, lesson));
  }
  const scope = `${slug}/${sous}`;
  if (!hasStudyReferences(scope)) notFound();
  const course = unitHref(group, unit);
  return (
    <AppShell width="max-w-4xl">
      <main className="py-10">
        <Crumbs items={[["Cours", "/cours"], [group.title, `/cours/${slug}`], [unit.title, course]]} />
        <h1 className="text-3xl font-semibold tracking-tight">{unit.title}</h1>
        <nav aria-label="Sections du sous-module" className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link href={course} className="border border-line px-4 py-2 hover:border-accent">Cours</Link>
          <span aria-current="page" className="border border-accent px-4 py-2">Chiffres et classements</span>
        </nav>
        <CourseReferences scope={scope} searchable />
      </main>
    </AppShell>
  );
}
