import Link from "next/link";
import AppShell from "@/components/AppShell";
import Cta from "@/components/Cta";
import { LEVELS, MODULES } from "@/lib/modules";

const modes: [string, string][] = [
  ["Finance Games", "Séries chronométrées de 10 questions rapides : calcul éclair, ordres de grandeur, culture marchés. Points selon ta vitesse."],
  ["Calcul mental infini", "Pourcentages, variations, intérêts composés, devises, bps, règle de 72. Générés à la volée, niveaux 1 à 5."],
  ["Daily Challenge", "Les mêmes 10 questions pour tout le monde, chaque jour. Une série à tenir."],
  ["Weakness Training", "Les questions que tu rates reviennent au bon moment (répétition espacée)."],
  ["Training par catégorie", "Banques centrales, taux, change, matières premières, capitalisations, marchés."],
];

export default function Home() {
  return (
    <AppShell>
      <main>
        <section className="grid gap-10 py-12 lg:grid-cols-[1fr_26rem] lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs text-accent">préparation aux entretiens · finance de marché</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Prépare les questions techniques et les finance games de tes entretiens.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              Calcul mental, culture marchés, macro. Des questions rapides comme à l’oral, {MODULES.length} modules progressifs et des chiffres de marché datés.
            </p>
            <Cta />
            <p className="mt-4 font-mono text-xs text-muted">Gratuit · sans carte bancaire · du niveau L2 au niveau entretien</p>
          </div>

          <div className="self-start border border-line bg-panel" aria-label="Exemple de question avec sa correction">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 font-mono text-xs text-muted">
              <span>Q 03/10</span>
              <span>Calcul mental</span>
              <span className="text-danger">00:09</span>
            </div>
            <div className="h-0.5 bg-line"><div className="h-full w-[55%] bg-warn" /></div>
            <div className="px-4 py-5">
              <p className="text-base font-medium leading-snug">Un actif perd 20 %. Quelle hausse, en %, le ramène à son niveau de départ ?</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="border border-accent bg-ink px-3 py-2.5 font-mono text-sm caret">25</span>
                <span className="text-sm text-muted">%</span>
              </div>
              <div className="mt-5 border-l-2 border-accent bg-ink px-3 py-3 text-sm leading-relaxed text-muted">
                <span className="font-semibold text-accent">Correct.</span> 100 devient 80. Pour revenir à 100, il faut gagner 20 sur 80 : 20 / 80 = 25 %. Une baisse de x % exige x / (1 − x) pour revenir au départ.
              </div>
            </div>
            <div className="border-t border-line px-4 py-2 font-mono text-xs text-muted">+7 XP · série 4 jours</div>
          </div>
        </section>

        <section className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Comment ça marche</h2>
          <ol className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              ["01", "Test de niveau", "12 questions pour trouver ton point de départ dans le parcours."],
              ["02", "Parcours en 4 niveaux", "Chaque module propose un cours court, un mini-check et un quiz de validation."],
              ["03", "Finance Games", "Des séries chronométrées pour t’entraîner à répondre vite, à l’oral comme en entretien."],
            ].map(([n, t, d]) => (
              <li key={n} className="bg-ink p-5">
                <span className="font-mono text-sm text-accent">{n}</span>
                <h3 className="mt-2 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Le parcours, des bases à l’entretien</h2>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {LEVELS.map((level) => (
              <li key={level.id} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                <span className="font-semibold">{level.name}</span>
                <span className="text-sm text-muted">{level.tagline}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold tracking-tight">Des façons de s’entraîner</h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {modes.map(([name, text]) => (
              <div key={name} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
                <dt className="font-semibold">{name}</dt>
                <dd className="text-sm text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-line py-14">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Des chiffres du jour, avec leur date</h2>
              <p className="mt-3 max-w-xl text-muted">
                Capitalisations, taux directeurs, inflation, change, pétrole, or : mis à jour chaque jour. Chaque donnée affiche sa date de référence, et les questions qui en dépendent se désactivent quand elle devient trop ancienne.
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href="/capitalisations" className="border border-line px-4 py-2.5 hover:border-muted">Capitalisations</Link>
              <Link href="/donnees" className="border border-line px-4 py-2.5 hover:border-muted">Données macro</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-6 text-sm text-muted">
        Global Macro Quiz, projet d’apprentissage. Contenu pédagogique, pas un conseil en investissement.
      </footer>
    </AppShell>
  );
}
