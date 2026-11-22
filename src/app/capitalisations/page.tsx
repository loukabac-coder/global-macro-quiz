"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { fetchMarketCaps, fmtCap, frDay, hasFreshMarketCaps, type Company, type MarketCaps } from "@/lib/marketcaps";

type Tab = "monde" | "europe" | "pays";

function nowMs(): number {
  return Date.now();
}

function Table({ rows }: { rows: Company[] }) {
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
            <td className="py-2.5 font-mono text-muted">{i + 1}</td>
            <td className="py-2.5">{c.name}</td>
            <td className="hidden py-2.5 text-muted sm:table-cell">{c.country}</td>
            <td className="py-2.5 text-right font-mono">
              {fmtCap(c.market_cap_usd)}
              {c.price_date && <span className="block text-xs text-muted">Séance {c.price_date}</span>}
              {c.fx_date && <span className="block text-xs text-muted">Change {c.fx_date}</span>}
            </td>
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
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMarketCaps().then((d) => {
      if (!active) return;
      if (d) {
        setData(d);
        setFresh(hasFreshMarketCaps(d, nowMs()));
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
  const selectedCountry = countries.includes(country) ? country : countries[0] ?? "";
  const inCountry = world.filter((c) => c.country === selectedCountry);
  const nvidia = world.find((c) => c.ticker === "NVDA");

  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Capitalisations boursières</h1>
        <p className="mt-3 max-w-xl text-muted">
          Estimations des capitalisations des entreprises suivies. Les dates de séance et de conversion sont affichées lorsqu’elles sont connues.
        </p>

        {state === "loading" && <p className="mt-8 text-sm text-muted">Chargement…</p>}
        {state === "none" && (
          <p className="mt-8 border-l-2 border-warn bg-panel px-4 py-3 text-sm">
            Le classement n’est pas disponible pour le moment.
          </p>
        )}

        {state === "ok" && data && (
          <>
            <p className={`mt-6 font-mono text-xs ${fresh ? "text-muted" : "text-danger"}`}>
              Collecte du {frDay(data.updated_at as string)} · {data.source.replace("au taux du jour", "avec les taux disponibles")}
              {!fresh && " · Questions sur cet instantané désactivées"}
              {data.failed.length > 0 && ` · ${data.failed.length} valeur(s) indisponible(s)`}
            </p>

            {nvidia && (
              <p className="mt-6 border border-line bg-panel px-4 py-3 text-sm">
                Repère : <span className="font-semibold">Nvidia</span> vaut {fmtCap(nvidia.market_cap_usd)}, soit le n°
                {world.indexOf(nvidia) + 1} du panel.
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              {([["monde", "Top 15 du panel"], ["europe", "Top 10 Europe"], ["pays", "Par pays"]] as [Tab, string][]).map(
                ([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    aria-pressed={tab === k}
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
                    value={selectedCountry}
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
              Le panel contient {data.items.length} grandes valeurs d’Amérique, d’Europe, d’Asie et du Moyen-Orient. Les montants sont exprimés en dollars.
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
    </AppShell>
  );
}
