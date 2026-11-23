"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import NewsSnapshot from "@/components/NewsSnapshot";
import CourseReferences from "@/components/CourseReferences";
import { dataTimestamp } from "@/lib/dataFreshness";
import { fetchMacro, fmtValue, isDatedObservation, isVerifiedMacro, referenceLabel } from "@/lib/macro";
import { useDataSnapshot } from "@/lib/useDataSnapshot";

export default function Donnees() {
  const { data, loading, unreachable, now } = useDataSnapshot(fetchMacro);

  const rows = data ? Object.entries(data.indicators) : [];
  const pending = data?.failed?.filter((series) => !data.indicators[series]) ?? [];

  return (
    <AppShell width="max-w-4xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Données macroéconomiques</h1>
        <p className="mt-3 max-w-xl text-muted">
          Dernières observations publiées, actualisées automatiquement. La période ou la séance de chaque chiffre est indiquée séparément du dernier contrôle de la source.
        </p>

        {loading && <p className="mt-8 text-sm text-muted">Chargement…</p>}
        {!loading && rows.length === 0 && (
          <p className="mt-8 border-l-2 border-warn bg-panel px-4 py-3 text-sm">
            Les données macroéconomiques ne sont pas disponibles pour le moment.
          </p>
        )}

        {data?.checked_at && (
          <p className="mt-4 text-sm text-muted">Dernier passage du robot le {dataTimestamp.format(new Date(data.checked_at))}.</p>
        )}
        {unreachable && rows.length > 0 && <p role="status" className="mt-3 text-sm text-warn">Le site affiche la dernière publication chargée. Nouvelle tentative automatique.</p>}
        {!!pending.length && <p className="mt-3 text-sm text-warn">Séries en attente d’une première valeur vérifiée · {pending.join(", ")}.</p>}
        {data && rows.length > 0 && (
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
                  const dated = isDatedObservation(key, ind);
                  const fresh = isVerifiedMacro(data, key, now);
                  return (
                    <tr key={key} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5">
                        {ind.label}
                        <p className="mt-1 text-xs text-muted sm:hidden">{ind.source}</p>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono ${fresh ? "" : "text-muted"}`}>
                        {dated ? fmtValue(ind) : "—"}
                        {dated && !fresh && <p className="mt-1 text-xs">Dernière valeur connue</p>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">
                        {dated ? referenceLabel(key, ind) : "Date de séance indisponible"}
                        {ind.retrieved_at && <p className="mt-1 text-muted">Vérifiée le {dataTimestamp.format(new Date(ind.retrieved_at))}</p>}
                        {ind.published_at && <p className="mt-1 text-muted">Publiée le {dataTimestamp.format(new Date(ind.published_at))}</p>}
                        {ind.status && <p className="mt-1 text-muted">Statut · {ind.status}</p>}
                        {data.failed?.includes(key) && <p className="mt-1 text-warn">Observation conservée après un échec de collecte</p>}
                        {fresh ? <p className="mt-1 text-accent">Utilisable en quiz</p> : <p className="mt-1 text-warn">Fraîcheur non vérifiée · questions de cette série suspendues</p>}
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted sm:table-cell">{ind.source_url?.startsWith("https://")
                        ? <a href={ind.source_url} className="underline hover:text-accent" target="_blank" rel="noreferrer">{ind.source}</a>
                        : ind.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/capitalisations" className="border border-line px-5 py-3 text-sm hover:border-muted">Capitalisations du jour</Link>
          <Link href="/quiz?categorie=monetary-policy,macroeconomics,fx,commodities,geopolitics" className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:brightness-110">S’entraîner sur ces données</Link>
        </div>
        <NewsSnapshot />
        <div id="classements" className="mt-10 border-t border-line pt-2">
          <CourseReferences scope="reperes/producteurs" canPractice={false} />
        </div>
      </main>
    </AppShell>
  );
}
