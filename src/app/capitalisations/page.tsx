"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { fetchMarketCaps, fmtCap, hasFreshMarketCaps, type Company } from "@/lib/marketcaps";
import { dataTimestamp } from "@/lib/dataFreshness";
import { useDataSnapshot } from "@/lib/useDataSnapshot";

type Tab = "monde" | "europe" | "pays";

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
              {c.fx_date && <span className="block text-xs text-muted">Change {c.fx_date}{c.fx_source && ` · ${c.fx_source}`}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Capitalisations() {
  const { data, loading, unreachable, now } = useDataSnapshot(fetchMarketCaps);
  const [tab, setTab] = useState<Tab>("monde");
  const [country, setCountry] = useState("France");
  const fresh = !!data && !unreachable && hasFreshMarketCaps(data, now);

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
          Estimations des capitalisations du panel, actualisées automatiquement. Chaque séance et chaque taux de conversion sont datés lorsqu’ils sont connus.
        </p>

        {loading && <p className="mt-8 text-sm text-muted">Chargement…</p>}
        {!loading && world.length === 0 && (
          <p className="mt-8 border-l-2 border-warn bg-panel px-4 py-3 text-sm">
            Le classement n’est pas disponible pour le moment.
          </p>
        )}

        {data?.updated_at && world.length > 0 && (
          <>
            <p className={`mt-6 font-mono text-xs ${fresh ? "text-muted" : "text-danger"}`}>
              {fresh ? "Collecte" : "Dernier classement connu, collecté"} le {dataTimestamp.format(new Date(data.updated_at))} · {data.source.replace("au taux du jour", "avec les taux disponibles")}
              {!fresh && " · Fraîcheur non vérifiée, questions désactivées"}
              {data.failed.length > 0 && ` · ${data.failed.length} valeur(s) indisponible(s)`}
            </p>

            {nvidia && (
              <p className="mt-6 border border-line bg-panel px-4 py-3 text-sm">
                Dans ce classement, <span className="font-semibold">Nvidia</span> est n°{world.indexOf(nvidia) + 1} du panel
                avec une capitalisation estimée de {fmtCap(nvidia.market_cap_usd)}.
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
