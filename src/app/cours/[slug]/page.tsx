import Link from "next/link";
import { notFound } from "next/navigation";
import { CHAPTERS, getChapter } from "@/lib/courses";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export default async function Chapitre({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  const next = CHAPTERS[index + 1];

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <Link href="/cours" className="text-sm text-muted hover:text-fg">Tous les cours</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-xs text-muted">
          <span className="text-accent">{chapter.code}</span> · {chapter.level} · {chapter.minutes} min de lecture
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{chapter.title}</h1>
        <p className="mt-4 leading-relaxed text-muted">{chapter.intro}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/quiz?categorie=${chapter.category}`} className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
            S’entraîner sur ce chapitre
          </Link>
          {chapter.category === "market-caps" && (
            <Link href="/capitalisations" className="border border-accent px-5 py-3 text-sm text-accent hover:bg-panel">
              Voir le classement du jour
            </Link>
          )}
          <Link href={`/quiz?categorie=${chapter.category}&niveau=beginner`} className="border border-line px-5 py-3 text-sm hover:border-muted">
            Niveau débutant seulement
          </Link>
        </div>

        <div className="mt-12 space-y-10">
          {chapter.sections.map((s) => (
            <section key={s.title}>
              <h2 className="border-b border-line pb-2 text-lg font-semibold">{s.title}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-3 leading-relaxed">{p}</p>
              ))}
              {s.bullets && (
                <ul className="mt-3 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm leading-relaxed">
                      <span className="font-mono text-accent">›</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.formulas && (
                <div className="mt-4 space-y-1 border border-line bg-panel px-4 py-3 font-mono text-sm">
                  {s.formulas.map((f) => (
                    <p key={f}>{f}</p>
                  ))}
                </div>
              )}
              {s.table && (
                <div className="mt-4 overflow-x-auto border border-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-panel text-left font-mono text-xs text-muted">
                        {s.table.head.map((h) => (
                          <th key={h} className="px-3 py-2 font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((r) => (
                        <tr key={r.join("|")} className="border-b border-line last:border-0">
                          {r.map((cell, i) => (
                            <td key={i} className="px-3 py-2 align-top">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.example && (
                <p className="mt-4 border-l-2 border-accent bg-panel px-4 py-3 text-sm leading-relaxed">
                  <span className="font-semibold text-accent">Exemple. </span>
                  {s.example}
                </p>
              )}
            </section>
          ))}
        </div>

        <section className="mt-12 border border-line">
          <h2 className="border-b border-line px-4 py-3 font-mono text-sm text-accent">À retenir</h2>
          <ul className="space-y-2 px-4 py-4">
            {chapter.remember.map((r) => (
              <li key={r} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-mono text-accent">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        {chapter.interview && (
          <section className="mt-8 border border-line">
            <h2 className="border-b border-line px-4 py-3 font-mono text-sm text-warn">Questions d’entretien classiques</h2>
            <ul className="space-y-2 px-4 py-4">
              {chapter.interview.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-warn">?</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {next && (
          <p className="mt-10 text-sm">
            <span className="text-muted">Chapitre suivant : </span>
            <Link href={`/cours/${next.slug}`} className="underline underline-offset-4">{next.title}</Link>
          </p>
        )}
      </main>
    </div>
  );
}
