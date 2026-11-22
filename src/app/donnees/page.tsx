"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ageDays, fetchMacro, fmtValue, isFresh, type MacroData } from "@/lib/macro";

function nowMs(): number {
  return Date.now();
}

function dayFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Donnees() {
  const [data, setData] = useState<MacroData | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    fetchMacro().then((d) => {
      if (!active) return;
      if (d) {
        setData(d);
        setNow(nowMs());
        setState("ok");
      } else setState("none");
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = data ? Object.entries(data.indicators) : [];

  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Données du jour</h1>
        <p className="mt-3 max-w-xl text-muted">
          Taux directeurs, inflation, change, pétrole, or. Un robot les met à jour chaque jour à partir de sources publiques. Chaque chiffre affiche sa date de référence : quand il devient trop ancien, les questions qui s’appuient dessus disparaissent automatiquement.
        </p>

        {state === "loading" && <p className="mt-8 text-sm text-muted">Chargement…</p>}
        {state === "none" && (
          <p className="mt-8 border-l-2 border-warn bg-panel px-4 py-3 text-sm">
            Pas encore de données : le robot de mise à jour n’a pas encore tourné.
          </p>
        )}

        {state === "ok" && data && (
          <div className="mt-8 overflow-x-auto border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-panel text-left font-mono text-xs text-muted">
                  <th className="px-3 py-2 font-normal">Indicateur</th>
                  <th className="px-3 py-2 text-right font-normal">Valeur</th>
                  <th className="px-3 py-2 font-normal">Date de référence</th>
                  <th className="hidden px-3 py-2 font-normal sm:table-cell">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([key, ind]) => {
                  const fresh = isFresh(ind, now);
                  const age = Math.round(ageDays(ind, now));
                  return (
                    <tr key={key} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5">{ind.label}</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${fresh ? "" : "text-muted line-through"}`}>{fmtValue(ind)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">
                        {dayFr(ind.ref_date)}
                        <span className={`ml-2 ${fresh ? "text-muted" : "text-danger"}`}>
                          {fresh ? `(il y a ${age} j)` : "périmée : questions désactivées"}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted sm:table-cell">{ind.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/capitalisations" className="border border-line px-5 py-3 text-sm hover:border-muted">Capitalisations du jour</Link>
          <Link href="/quiz?categorie=monetary-policy,macroeconomics,fx,commodities" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">S’entraîner sur ces données</Link>
        </div>
      </main>
    </AppShell>
  );
}
