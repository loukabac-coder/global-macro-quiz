import Link from "next/link";
import AppShell from "@/components/AppShell";
import CourseSearch, { type CourseSearchEntry } from "@/components/CourseSearch";
import { CHAPTERS } from "@/lib/courses";
import { MODULES } from "@/lib/modules";
import { DIFFICULTY_FR } from "@/lib/quiz";
import { searchText } from "@/lib/searchText";

export const metadata = { title: "Cours — Global Macro Quiz" };

const entries: CourseSearchEntry[] = [
  ...CHAPTERS.map((chapter) => ({
    href: `/cours/${chapter.slug}`, code: chapter.code, title: chapter.title, intro: chapter.intro, level: chapter.level,
    index: searchText([
      chapter.title, chapter.intro, chapter.code, chapter.category, chapter.level, ...chapter.remember, ...(chapter.interview ?? []),
      ...chapter.sections.flatMap((section) => [
        section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.formulas ?? []),
        section.example ?? "", ...(section.table?.head ?? []), ...(section.table?.rows.flat() ?? []),
      ]),
    ].join(" ")),
  })),
  ...MODULES.filter((module) => module.ready).map((module) => ({
    href: `/module?id=${module.id}`, code: "Module", title: module.title, intro: module.goal, level: DIFFICULTY_FR[module.level],
    index: searchText([module.title, module.goal, ...module.points, ...module.categories].join(" ")),
    onlyInSearch: true,
  })),
];

export default function CoursIndex() {
  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Cours</h1>
        <CourseSearch entries={entries}>
          <h2 className="mt-12 text-xl font-semibold tracking-tight">Chiffres du jour</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">Les chiffres à connaître en ce moment, mis à jour chaque jour, avec leur date de référence.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/capitalisations" className="border border-line bg-panel p-4 hover:border-accent">
              <span className="font-semibold">Capitalisations boursières</span>
              <span className="mt-1 block text-sm text-muted">Les plus grosses entreprises du monde et d’Europe.</span>
            </Link>
            <Link href="/donnees" className="border border-line bg-panel p-4 hover:border-accent">
              <span className="font-semibold">Données macro</span>
              <span className="mt-1 block text-sm text-muted">Taux directeurs, inflation, change, pétrole, or.</span>
            </Link>
          </div>
          <p className="mt-8 text-sm text-muted">
            Contenu pédagogique rédigé à partir de notions standards. Il ne remplace pas les textes officiels (traités, rapports des banques centrales) cités dans les corrections des questions.
          </p>
        </CourseSearch>
      </main>
    </AppShell>
  );
}
