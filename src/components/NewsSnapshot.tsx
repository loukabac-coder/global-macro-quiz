"use client";

import { dataTimestamp } from "@/lib/dataFreshness";
import { electionSummary, fetchNews, isNewsVerified, isRecentAnnouncement, POLICY_MOVEMENT } from "@/lib/news";
import { useDataSnapshot } from "@/lib/useDataSnapshot";

export default function NewsSnapshot() {
  const { data, loading, unreachable, now } = useDataSnapshot(fetchNews);
  return (
    <section id="actualite" className="mt-12 scroll-mt-5 border-t border-line pt-7">
      <h2 className="text-xl font-semibold">Actualité économique et dirigeants</h2>
      {loading && <p className="mt-4 text-sm text-muted">Chargement de l’actualité…</p>}
      {data?.updated_at && <p className="mt-2 text-sm text-muted">Dernière vérification réussie le {dataTimestamp.format(new Date(data.updated_at))}.</p>}
      {unreachable && <p role="status" className="mt-2 text-sm text-warn">Le site affiche la dernière publication chargée.</p>}
      {data?.failed.length ? <p className="mt-2 text-sm text-warn">Dernier contrôle en échec pour {data.failed.join(", ")}.</p> : null}
      {!!data?.decisions?.length && (
        <div className="mt-5">
          <h3 className="font-semibold">Dernières décisions des banques centrales</h3>
          <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
            {data.decisions.map((row) => (
              <li key={row.id} className="py-3">
                <p>{row.source} · {POLICY_MOVEMENT[row.movement]} · {row.date}</p>
                <p className="mt-1 text-xs text-muted">Contrôle réussi · {dataTimestamp.format(new Date(row.retrieved_at))} · <a href={row.url} className="underline hover:text-accent" target="_blank" rel="noreferrer">Communiqué</a></p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data?.leaders.length ? (
        <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
          {data.leaders.map((row) => (
            <li key={row.id} className="py-3">
              <p><span className="font-semibold">{row.office}</span> · {row.name}</p>
              <p className="mt-1 text-xs text-muted">Vérification du {row.date} · {isNewsVerified(row, now, 2) ? "Utilisable en quiz" : "À revérifier"} · <a href={row.url} className="underline hover:text-accent" target="_blank" rel="noreferrer">{row.source}</a></p>
            </li>
          ))}
        </ul>
      ) : null}
      {!!data?.elections?.length && (
        <ul aria-label="Résultats électoraux officiels" className="mt-5 divide-y divide-line border-y border-line text-sm">
          {data.elections.map((row) => (
            <li key={row.id} className="py-3">
              <p>{row.country} · {row.date} · {electionSummary(row)}</p>
              <p className="mt-1 text-xs text-muted">Contrôle réussi · {dataTimestamp.format(new Date(row.retrieved_at))} · <a href={row.url} className="underline hover:text-accent" target="_blank" rel="noreferrer">{row.source}</a></p>
            </li>
          ))}
        </ul>
      )}
      {data?.events.length ? (
        <ul className="mt-6 space-y-3">
          {data.events.slice(0, 12).map((row) => (
            <li key={row.id} className="border border-line bg-panel p-4">
              <h3 className="font-semibold">{row.title}</h3>
              <p className="mt-2 text-sm text-muted">{row.context}</p>
              <p className="mt-3 text-xs text-muted">{row.topic} · {row.date} · Vérifié le {dataTimestamp.format(new Date(row.retrieved_at))}</p>
              {row.published_at && <p className="mt-1 text-xs text-muted">Communiqué publié le {dataTimestamp.format(new Date(row.published_at))}</p>}
              <p className="mt-1 text-xs text-muted">{isRecentAnnouncement(row, now) ? "Utilisable en quiz" : "Archive du communiqué"} · <a href={row.url} className="underline hover:text-accent" target="_blank" rel="noreferrer">{row.source}</a></p>
            </li>
          ))}
        </ul>
      ) : !loading ? <p className="mt-5 text-sm text-muted">Aucun communiqué disponible.</p> : null}
    </section>
  );
}
