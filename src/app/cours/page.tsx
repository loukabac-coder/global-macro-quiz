import Link from "next/link";
import { CHAPTERS } from "@/lib/courses";

export const metadata = { title: "Cours — Global Macro Quiz" };

export default function CoursIndex() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-fg">Tableau de bord</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Cours</h1>
        <p className="mt-3 max-w-xl text-muted">
          Un chapitre par catégorie : l’essentiel à retenir, les formules et des exemples. Lis un chapitre,
          puis entraîne-toi sur la même catégorie. Conseil : commence par le calcul mental.
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {CHAPTERS.map((c) => (
            <li key={c.slug}>
              <Link href={`/cours/${c.slug}`} className="grid gap-1 py-4 hover:bg-panel sm:grid-cols-[3.5rem_1fr_9rem] sm:items-baseline">
                <span className="font-mono text-sm text-accent">{c.code}</span>
                <span>
                  <span className="font-semibold">{c.title}</span>
                  <span className="mt-1 block text-sm text-muted">{c.intro}</span>
                </span>
                <span className="font-mono text-xs text-muted sm:text-right">{c.level}<br />{c.minutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">
          Contenu pédagogique rédigé à partir de notions standards. Il ne remplace pas les textes officiels
          (traités, rapports des banques centrales) cités dans les corrections des questions.
        </p>
      </main>
    </div>
  );
}
