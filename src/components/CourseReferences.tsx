"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHECK_MAX_HOURS, wasRecentlyChecked } from "@/lib/dataFreshness";
import { studyDate, type StudyRow, type StudyView } from "@/lib/studyReferences";
import { useDataSnapshot } from "@/lib/useDataSnapshot";
import { matchesKeywords, searchText } from "@/lib/searchText";

function ReferenceDetails({ row }: { row: StudyRow }) {
  return (
    <div className="space-y-1 text-xs text-muted">
      {row.period && <p>Période ou séance · {row.period}</p>}
      {row.published && <p>Publication · {studyDate(row.published)}</p>}
      {row.checked && <p>Dernier contrôle réussi · {studyDate(row.checked)}</p>}
      {row.source && <p>{row.url?.startsWith("https://")
        ? <a className="underline underline-offset-4 hover:text-accent" href={row.url} target="_blank" rel="noreferrer">{row.source}</a>
        : row.source}</p>}
      {row.eligible === false && <p className="text-warn">Dernière valeur connue · à revérifier avant le quiz</p>}
      {row.awaitingCurrentQuote && <p className="text-muted">Nouveaux quiz · chiffres du jour en attente</p>}
      {row.pending && row.period && <p className="text-warn">Dernière tentative de collecte en échec</p>}
      {row.attempted && <p className="text-warn">Dernière tentative · {studyDate(row.attempted)}</p>}
    </div>
  );
}

export default function CourseReferences({ scope, canPractice = true, searchable = false }: {
  scope: string; canPractice?: boolean; searchable?: boolean;
}) {
  const read = useCallback(async () => {
    const result = await fetch(`/api/donnees?type=reperes&cours=${encodeURIComponent(scope)}`, { cache: "no-store" });
    return result.ok ? await result.json() as StudyView : null;
  }, [scope]);
  const { data, loading, unreachable, now } = useDataSnapshot(read);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const lastAnchor = useRef("");
  useEffect(() => {
    let hash = window.location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch { /* Le fragment peut avoir été saisi manuellement. */ }
    if (hash && hash !== lastAnchor.current && data) {
      const target = document.getElementById(hash);
      if (target) {
        const details = target.closest("details");
        if (details) details.open = true;
        target.scrollIntoView({ block: "start" });
        lastAnchor.current = hash;
      }
    }
  }, [data]);
  const stillVerified = (row: StudyRow) => !!row.eligible && wasRecentlyChecked(row.checked, now, CHECK_MAX_HOURS);
  const essential = data?.essentials.filter(stillVerified) ?? [];
  const caps = scope === "reperes/capitalisations";
  const directory = data?.tables.filter((table) => !caps || ["companies", "other-companies"].includes(table.id)) ?? [];
  const countries = [...new Set(directory.flatMap((table) => table.rows.flatMap((row) => row.country ?? [])))].sort((a, b) => a.localeCompare(b, "fr"));
  const filtering = !!(query.trim() || country);
  const matches = directory.flatMap((table) => table.rows.filter((row) => (!country || row.country === country) &&
    matchesKeywords(searchText([table.title, row.label, row.ticker, row.country, row.detail].filter(Boolean).join(" ")), query)));
  const comparisonDate = caps && country ? matches.filter((row) => row.comparable && stillVerified(row)).map((row) => row.period ?? "").sort().at(-1) : undefined;
  const found = caps && country ? matches.filter((row) => row.comparable && row.period === comparisonDate && stillVerified(row)) : matches;
  const tables = filtering ? [{
    id: "results", title: "Résultats de la recherche",
    scope: caps && country && comparisonDate ? `${country} · ${found.length} entreprises suivies comparables · Md$ · séance du ${comparisonDate}` : undefined,
    rows: caps ? found.toSorted((a, b) => (b.amount ?? -1) - (a.amount ?? -1)) : found,
    attempted: undefined, collapsed: false,
  }] : data?.tables;

  return (
    <section className="mt-7 space-y-5" aria-labelledby="course-references">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="course-references" className="text-xl font-semibold">Repères à connaître</h2>
        {canPractice && <div className="flex flex-wrap items-center gap-3">
          {canPractice && <Link href={`/quiz?mode=memoires&cours=${encodeURIComponent(scope)}`} className="bg-accent px-4 py-2.5 text-sm font-semibold text-ink hover:brightness-110">Tester ma mémoire</Link>}
        </div>}
      </div>
      {loading && <p role="status" className="text-sm text-muted">Chargement des observations…</p>}
      {unreachable && <p role="status" className="text-sm text-warn">Publication momentanément inaccessible. Nouvelle tentative automatique.</p>}
      {data?.checked_at && <p className="text-xs text-muted">Dernier passage du robot · {studyDate(data.checked_at)}</p>}
      {searchable && (
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="grow">Rechercher
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={caps ? "Nom ou ticker" : "Nom ou mot-clé"} className="mt-1 block w-full border border-line bg-panel px-3 py-2" />
          </label>
          {!!countries.length && <label>Pays ou zone
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 block max-w-full border border-line bg-panel px-3 py-2">
              <option value="">Tous</option>
              {countries.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>}
        </div>
      )}
      {!!essential.length && !filtering && (
        <ul aria-label="Repères essentiels" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {essential.map((row) => (
            <li key={row.id} className="min-w-0 border border-line bg-panel p-4">
              <a href={`#${row.id}`} className="block text-sm font-medium hover:text-accent">{row.label}</a>
              <p className="mt-1 break-words text-lg font-semibold text-accent">{row.value}</p>
              {row.period && <p className="mt-1 text-xs text-muted">{row.period}</p>}
            </li>
          ))}
        </ul>
      )}
      {tables?.map((table) => {
        const scopeText = table.scope && <p className="mt-1 text-xs text-muted">{table.scope}</p>;
        const rows = table.rows.length ? (
            <dl className="divide-y divide-line">
              {table.rows.map((row) => (
                <div key={row.id} id={row.id} className="grid scroll-mt-5 gap-2 p-4 sm:grid-cols-[1fr_1.2fr]">
                  <dt className="text-sm font-medium">{row.label}{filtering && (row.ticker || row.country) && <span className="mt-1 block text-xs text-muted">{[row.ticker, row.country].filter(Boolean).join(" · ")}</span>}</dt>
                  <dd className="min-w-0 space-y-1">
                    <p className={`break-words text-sm font-semibold ${row.eligible ? "text-fg" : "text-muted"}`}>{row.value}</p>
                    {row.detail && <p className="break-words text-sm text-muted">{row.detail}</p>}
                    {row.exact && <details className="text-xs text-muted">
                      <summary className="cursor-pointer hover:text-accent">Valeur publiée</summary>
                      <p className="mt-1 break-words font-mono text-fg">{row.exact}</p>
                    </details>}
                    <ReferenceDetails row={{ ...row, eligible: row.eligible === undefined ? undefined : stillVerified(row) }} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : <p className="p-4 text-sm text-warn">
            {filtering ? "Aucun résultat pour cette recherche." : "Aucune publication comparable disponible pour ce repère."}
            {table.attempted && <> Dernière tentative · {studyDate(table.attempted)}.</>}
          </p>;
        if (table.collapsed) return (
          <details key={table.id} id={table.id} className="scroll-mt-5 border border-line">
            <summary className="cursor-pointer bg-panel p-4 text-sm font-semibold hover:text-accent">{table.title}</summary>
            {scopeText && <div className="px-4 py-2">{scopeText}</div>}
            {rows}
          </details>
        );
        return (
          <section key={table.id} id={table.id} className="scroll-mt-5 border border-line">
            <div className="border-b border-line bg-panel p-4">
              <h3 className="font-semibold">{table.title}</h3>
              {scopeText}
            </div>
            {rows}
          </section>
        );
      })}
    </section>
  );
}
