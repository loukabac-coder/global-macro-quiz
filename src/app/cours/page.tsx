import Link from "next/link";
import AppShell from "@/components/AppShell";
import { CHAPTERS } from "@/lib/courses";

export const metadata = { title: "Cours — Global Macro Quiz" };

export default function CoursIndex() {
  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Cours</h1>
        <p className="mt-3 max-w-xl text-muted">
          Une fiche par notion, écrite pour un étudiant de L2 : l’essentiel, les formules, des exemples chiffrés et les questions d’entretien classiques.
          Chaque fiche renvoie vers les questions liées. Conseil : commence par le calcul mental.
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {CHAPTERS.map((c) => (
            <li key={c.slug}>
              <Link href={`/cours/${c.slug}`} className="grid gap-1 py-4 hover:bg-panel sm:grid-cols-[3.5rem_1fr_9rem]">
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
          Contenu pédagogique rédigé à partir de notions standards. Il ne remplace pas les textes officiels (traités, rapports des banques centrales) cités dans les corrections des questions.
        </p>
      </main>
    </AppShell>
  );
}
