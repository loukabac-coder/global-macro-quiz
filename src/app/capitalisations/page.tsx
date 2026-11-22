"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ageHours, fetchMarketCaps, fmtCap, frDay, type Company, type MarketCaps } from "@/lib/marketcaps";

type Tab = "monde" | "europe" | "pays";

function nowMs(): number {
  return Date.now();
}

function Table({ rows, start = 1 }: { rows: Company[]; start?: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left font-mono text-xs text-muted">
          <th className="w-10 py-2 font-normal">#</th>
          <th className="py-2 font-normal">Entreprise</th>
          <th className="hidden py-2 font-normal sm:table-cell">Pays</th>
          <th className="py-2 text-right font-normal">Capitalisation</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={c.ticker} className="border-b border-line">
            <td className="py-2.5 font-mono text-muted">{start + i}</td>
            <td className="py-2.5">{c.name}</td>
            <td className="hidden py-2.5 text-muted sm:table-cell">{c.country}</td>
            <td className="py-2.5 text-right font-mono">{fmtCap(c.market_cap_usd)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Capitalisations() {
  const [data, setData] = useState<MarketCaps | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  const [tab, setTab] = useState<Tab>("monde");
  const [country, setCountry] = useState("France");
  const [age, setAge] = useState(0);

  useEffect(() => {
    let active = true;
    fetchMarketCaps().then((d) => {
      if (!active) return;
      if (d) {
        setData(d);
        setAge(ageHours(d.updated_at as string, nowMs()));
        setState("ok");
      } else setState("none");
    });
    return () => {
      active = false;
    };
  }, []);

  const world = data ? [...data.items].sort((a, b) => b.market_cap_usd - a.market_cap_usd) : [];
  const europe = world.filter((c) => c.region === "Europe");
  const countries = [...new Set(world.map((c) => c.country))].sort((a, b) => a.localeCompare(b, "fr"));
  const inCountry = world.filter((c) => c.country === country);
  const nvidia = world.find((c) => c.ticker === "NVDA");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <Link href="/cours" className="text-sm text-muted hover:text-fg">Cours</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Capitalisations boursières</h1>
        <p className="mt-3 max-w-xl text-muted">
          Le classement à connaître avant de s’entraîner. Les chiffres sont recalculés automatiquement chaque jour
          et les questions du quiz utilisent ces mêmes chiffres.
        </p>

        {state === "loading" && <p className="mt-8 text-sm text-muted">Chargement…</p>}
        {state === "none" && (
          <p className="mt-8 border-l-2 border-warn bg-panel px-4 py-3 text-sm">
            Pas encore de données : le robot quotidien n’a pas tourné. Une fois lancé, le classement apparaît ici.
          </p>
        )}

        {state === "ok" && data && (
          <>
            <p className={`mt-6 font-mono text-xs ${age > 48 ? "text-danger" : "text-warn"}`}>
              Données du {frDay(data.updated_at as string)}
              {age > 48 && " : ATTENTION, plus de 48 h, le robot n’a pas mis à jour"}
              {" · "}Source : {data.source}
            </p>

            {nvidia && (
              <p className="mt-6 border border-line bg-panel px-4 py-3 text-sm">
                Repère : <span className="font-semibold">Nvidia</span> vaut {fmtCap(nvidia.market_cap_usd)}, soit le n°
                {world.indexOf(nvidia) + 1} mondial.
              </p>
            )}

            <div className="mt-8 flex gap-2 text-sm">
              {([["monde", "Top 15 monde"], ["europe", "Top 10 Europe"], ["pays", "Par pays"]] as [Tab, string][]).map(
                ([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`border px-4 py-2 ${tab === k ? "border-accent bg-panel" : "border-line text-muted hover:border-muted"}`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>

            <div className="mt-6">
              {tab === "monde" && <Table rows={world.slice(0, 15)} />}
              {tab === "europe" && <Table rows={europe.slice(0, 10)} />}
              {tab === "pays" && (
                <>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    aria-label="Pays"
                    className="mb-4 border border-line bg-panel px-3 py-2 text-sm"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Table rows={inCountry} />
                </>
              )}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted">
              Le classement porte sur environ {data.items.length} grandes entreprises suivies (cotées aux
              États-Unis, en Europe, en Asie et au Moyen-Orient), pas sur toutes les sociétés cotées.
              Les montants sont convertis en dollars au taux du jour. Les sources peuvent différer légèrement
              (heure, classes d’actions).
            </p>
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/quiz?categorie=market-caps" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">
            S’entraîner sur les capitalisations
          </Link>
          <Link href="/cours/capitalisations" className="border border-line px-5 py-3 text-sm hover:border-muted">
            Lire le cours
          </Link>
        </div>
      </main>
    </div>
  );
}
