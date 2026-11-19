import Link from "next/link";

const categories = [
  { code: "A", name: "Central banks", text: "BCE, Fed, BoE, BoJ, PBoC : mandats, instruments, QE et QT." },
  { code: "B", name: "Monetary policy", text: "Taux directeurs, courbe des taux, règle de Taylor, forward guidance." },
  { code: "C", name: "Macroeconomics", text: "Inflation, croissance, chômage, dette publique, cycles économiques." },
  { code: "D", name: "Foreign exchange", text: "Paires majeures, carry trade, parité des taux, interventions." },
  { code: "E", name: "Commodities", text: "Pétrole, gaz, or, cuivre, OPEP+ et lien avec le dollar." },
  { code: "F", name: "Financial markets", text: "Obligations, duration, volatilité, spreads de crédit, dérivés." },
  { code: "G", name: "Macro guesstimates", text: "Estimer vite un PIB, une population, une dette, une grandeur de marché." },
  { code: "H", name: "Calcul mental", text: "Pourcentages, produits, identités remarquables, P&L en tête." },
  { code: "I", name: "Capitalisations", text: "Classements et poids des plus grandes capitalisations par indice." },
];

const modes = [
  ["Quick Quiz", "10 questions, pour une session courte."],
  ["Training", "Entraînement libre par catégorie, sans chrono."],
  ["Challenge", "Questions difficiles, chronométrées."],
  ["Daily Challenge", "Les mêmes questions pour tous, une fois par jour."],
  ["Mixed", "Toutes les catégories mélangées."],
  ["Weakness Training", "Les notions que tu rates reviennent plus souvent."],
];

const options = [
  { id: "A", text: "Le plein emploi", correct: false },
  { id: "B", text: "La stabilité des prix", correct: true },
  { id: "C", text: "La croissance du PIB de la zone euro", correct: false },
  { id: "D", text: "Le niveau du taux de change de l’euro", correct: false },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </span>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <a href="#categories" className="hover:text-fg">Catégories</a>
            <a href="#modes" className="hover:text-fg">Modes</a>
            <Link href="/connexion" className="hover:text-fg">Connexion</Link>
            <Link href="/inscription" className="border border-line px-3 py-1.5 text-fg hover:border-muted">Créer un compte</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_28rem] lg:py-24">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Construis ta culture macro, une question à la fois.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Banques centrales, politique monétaire, change, matières premières, marchés. Chaque
              réponse s’accompagne d’une correction détaillée, d’une source et, pour les données
              qui bougent, d’une date de référence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#categories" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
                Parcourir les catégories
              </a>
              <a href="#modes" className="border border-line px-5 py-3 text-sm hover:border-muted">
                Voir les modes de jeu
              </a>
            </div>
          </div>

          <div className="border border-line bg-panel" aria-label="Exemple de question avec sa correction">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-xs text-muted">
              <span>Q 07/10</span>
              <span>Central banks, intermédiaire</span>
              <span className="text-fg">00:24</span>
            </div>
            <div className="px-4 py-5">
              <p className="text-base font-medium leading-snug">
                Selon les traités européens, quel est l’objectif principal de la BCE ?
              </p>
              <ul className="mt-5 space-y-2">
                {options.map((o) => (
                  <li
                    key={o.id}
                    className={`flex gap-3 border px-3 py-2.5 text-sm ${
                      o.correct ? "border-accent text-fg" : "border-line text-muted"
                    }`}
                  >
                    <span className={`font-mono ${o.correct ? "text-accent" : ""}`}>{o.id}</span>
                    <span>{o.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-l-2 border-accent bg-ink px-3 py-3 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-accent">Correct.</span> Le traité sur le
                fonctionnement de l’Union européenne fixe la stabilité des prix comme objectif
                principal. Sans préjudice de cet objectif, la BCE soutient les politiques
                économiques générales de l’Union.
              </div>
            </div>
            <div className="border-t border-line px-4 py-2 font-mono text-xs text-muted">
              Exemple d’affichage de la correction
            </div>
          </div>
        </section>

        <section id="categories" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Neuf catégories, quatre niveaux</h2>
            <p className="mt-3 max-w-xl text-muted">
              De débutant à expert, chaque catégorie monte en difficulté avec toi.
            </p>
            <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.code} className="bg-ink p-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-accent">{c.code}</span>
                    <h3 className="font-semibold">{c.name}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modes" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">Six façons de t’entraîner</h2>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {modes.map(([name, text]) => (
                <div key={name} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
                  <dt className="font-semibold">{name}</dt>
                  <dd className="text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="max-w-xl text-muted">
              Les questions sur des données actuelles affichent leur date de référence et
              disparaissent quand elles deviennent trop anciennes.
            </p>
            <span className="border border-warn px-3 py-1.5 font-mono text-xs text-warn">
              Donnée au jj/mm/aaaa
            </span>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-muted">
          Global Macro Quiz, projet d’apprentissage. Contenu pédagogique, pas un conseil en investissement.
        </div>
      </footer>
    </div>
  );
}
