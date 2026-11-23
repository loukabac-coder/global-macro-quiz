import Link from "next/link";
import AppShell from "@/components/AppShell";
import CourseSearch, { type CourseSearchEntry } from "@/components/CourseSearch";
import { lessonHref, lessonsFor } from "@/lib/courseTree";
import { GROUPS, LEVELS, TRACKS, unitCode } from "@/lib/program";
import { searchText } from "@/lib/searchText";

export const metadata = { title: "Cours — Global Macro Quiz" };

const entries: CourseSearchEntry[] = [
  ...GROUPS.flatMap((group) => group.units.flatMap((unit) => lessonsFor(group, unit).map((page, i) => ({
    href: lessonHref(group, unit, page), code: `${unitCode(group, unit)}.${i + 1}`, title: page.title, intro: unit.title,
    level: LEVELS.find(({ id }) => id === page.level)!.name,
    index: searchText([group.title, unit.title, page.title, ...page.sections.flatMap((section) => [
        section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? []), ...(section.formulas ?? []),
        section.example ?? "", ...(section.table?.head ?? []), ...(section.table?.rows.flat() ?? []),
      ]),
    ].join(" ")),
    onlyInSearch: true,
  })))),
];

export default function CoursIndex() {
  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Cours</h1>
        <CourseSearch entries={entries}>
          {TRACKS.map((track) => (
            <section key={track.id} className="mt-9">
              <h2 className="text-xl font-semibold">{track.title}</h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {GROUPS.filter((group) => group.track === track.id).map((group) => (
                  <li key={group.no}>
                    <Link href={`/cours/${group.slug}`} className="flex flex-wrap items-center gap-3 py-4 hover:bg-panel">
                      <span className="font-mono text-accent">{group.no}</span>
                      <span className="font-semibold">{group.title}</span>
                      <span className="text-sm text-muted sm:ml-auto">{group.units.length} sous-modules</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
        </CourseSearch>
      </main>
    </AppShell>
  );
}
