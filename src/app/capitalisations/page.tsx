"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { fetchMarketCaps, fmtCap, verifiedCompanies, type Company } from "@/lib/marketcaps";
import { comparablePanels, FRENCH_ISSUERS } from "@/lib/liveQuestions";
import { dataTimestamp } from "@/lib/dataFreshness";
import { useDataSnapshot } from "@/lib/useDataSnapshot";

type Tab = "monde" | "europe" | "pays";

function Table({ rows, ranked, verified, offset = 0 }: { rows: Company[]; ranked: boolean; verified: Set<string>; offset?: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left font-mono text-xs text-muted">
          {ranked && <th className="w-10 py-2 font-normal">#</th>}
          <th className="py-2 font-normal">Entreprise</th>
          <th className="hidden py-2 font-normal sm:table-cell">Pays</th>
          <th className="py-2 text-right font-normal">Capitalisation</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c, i) => (
          <tr key={c.ticker} className="border-b border-line">
            {ranked && <td className="py-2.5 font-mono text-muted">{offset + i + 1}</td>}
            <td className="py-2.5">{c.name}</td>
            <td className="hidden py-2.5 text-muted sm:table-cell">{c.country}</td>
            <td className="py-2.5 text-right font-mono">
              {fmtCap(c.market_cap_usd)}
              {c.price_date && <span className="block text-xs text-muted">Séance {c.price_date}</span>}
              {c.fx_date && <span className="block text-xs text-muted">Change {c.fx_date}{c.fx_source && ` · ${c.fx_source}`}</span>}
              <span className={`block text-xs ${verified.has(c.ticker) ? "text-accent" : "text-warn"}`}>{verified.has(c.ticker) ? "Utilisable en quiz" : "Observation non vérifiée pour les quiz"}</span>
              {c.retrieved_at && <span className="block text-xs text-muted">Vérifiée le {dataTimestamp.format(new Date(c.retrieved_at))}</span>}
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
  const verified = data ? verifiedCompanies(data, now) : [];
  const verifiedIds = new Set(verified.map((company) => company.ticker));
  const panels = comparablePanels(verified);
  const world = data ? data.items.toSorted((a, b) => a.name.localeCompare(b.name, "fr")) : [];
  const europe = world.filter((c) => c.region === "Europe");
  const countries = [...new Set(world.map((c) => c.country))].sort((a, b) => a.localeCompare(b, "fr"));
  const selectedCountry = countries.includes(country) ? country : countries[0] ?? "";
  const inCountry = world.filter((c) => selectedCountry === "France" ? FRENCH_ISSUERS.has(c.ticker) : c.country === selectedCountry);
  const panelKey = tab === "monde" ? "world" : tab === "europe" ? "europe" : selectedCountry === "France" ? "fr" : selectedCountry === "États-Unis" ? "us" : `pays:${selectedCountry}`;
  const panel = panels.find(({ key }) => key === panelKey);
  const scope = tab === "monde" ? world : tab === "europe" ? europe : inCountry;
  const rows = panel?.companies ?? scope;
  const shown = rows.slice(0, panel && tab === "monde" ? 15 : panel && tab === "europe" ? 10 : undefined);
  const remaining = panel ? scope.filter((row) => !panel.companies.some((included) => included.ticker === row.ticker)) : [];

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
            <p className="mt-6 font-mono text-xs text-muted">
              Dernière collecte réussie le {dataTimestamp.format(new Date(data.updated_at))} · {data.source.replace("au taux du jour", "avec les taux disponibles")}
              {data.checked_at && ` · Dernier contrôle le ${dataTimestamp.format(new Date(data.checked_at))}`}
              {data.failed.length > 0 && ` · Dernier contrôle en échec pour ${data.failed.join(", ")}`}
            </p>
            {unreachable && <p role="status" className="mt-3 text-sm text-warn">Le site affiche la dernière publication chargée.</p>}

            <div className="mt-8 flex flex-wrap gap-2 text-sm">
              {([["monde", "Panel mondial"], ["europe", "Europe"], ["pays", "Par pays"]] as [Tab, string][]).map(
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
              {tab === "pays" && (
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
              )}
              <p className="mb-3 text-sm text-muted">{panel ? `Classement ${panel.title} · ${panel.companies.length} entreprises comparables en dollars américains le ${panel.date}.` : "Dernières observations par entreprise, triées par nom."}</p>
              {shown.length ? <Table rows={shown} ranked={!!panel} verified={verifiedIds} /> : <p className="text-sm text-muted">Aucune entreprise pour ce périmètre.</p>}
              {shown.length < rows.length && <details className="mt-4 border border-line px-4 py-3"><summary className="cursor-pointer text-sm">Suite du classement</summary><Table rows={rows.slice(shown.length)} ranked verified={verifiedIds} offset={shown.length} /></details>}
              {!!remaining.length && <details className="mt-4 border border-line px-4 py-3"><summary className="cursor-pointer text-sm">Autres valeurs suivies</summary><Table rows={remaining} ranked={false} verified={verifiedIds} /></details>}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted">
              Le panel suit {data.items.length} grandes valeurs. Les rangs utilisent une séance commune et des taux de conversion du même jour.
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
