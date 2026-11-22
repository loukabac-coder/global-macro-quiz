import Link from "next/link";
import AppShell from "@/components/AppShell";
import { CHAPTERS } from "@/lib/courses";

export const metadata = { title: "Cours — Global Macro Quiz" };

export default function CoursIndex() {
  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Cours</h1>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {CHAPTERS.map((c) => (
            <li key={c.slug}>
              <Link href={`/cours/${c.slug}`} className="grid gap-1 py-4 hover:bg-panel sm:grid-cols-[3.5rem_1fr_8rem]">
                <span className="font-mono text-sm text-accent">{c.code}</span>
                <span>
                  <span className="font-semibold">{c.title}</span>
                  <span className="mt-1 block text-sm text-muted">{c.intro}</span>
                </span>
                <span className="font-mono text-xs text-muted sm:text-right">{c.level}</span>
              </Link>
            </li>
          ))}
        </ul>
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
      </main>
    </AppShell>
  );
}
