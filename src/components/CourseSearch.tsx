"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { matchesKeywords } from "@/lib/searchText";

export type CourseSearchEntry = {
  href: string;
  code: string;
  title: string;
  intro: string;
  level: string;
  index: string;
  onlyInSearch?: boolean;
};

export default function CourseSearch({ entries, children }: { entries: CourseSearchEntry[]; children: ReactNode }) {
  const [query, setQuery] = useState("");
  const searching = !!query.trim();
  const visible = entries.filter((entry) => searching ? matchesKeywords(entry.index, query) : !entry.onlyInSearch);

  return (
    <>
      <label className="mt-5 block max-w-xl text-sm text-muted">
        Rechercher dans les cours et les modules
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. duration, inflation, change" className="mt-2 w-full border border-line bg-panel px-4 py-3 text-base text-fg focus:border-accent focus:outline-none" />
      </label>
      {searching && (
        <p role="status" className="mt-4 text-sm text-muted">
          {visible.length ? `${visible.length} résultat${visible.length > 1 ? "s" : ""}` : "Aucun cours ou module ne correspond à cette recherche."}
        </p>
      )}
      {!!visible.length && (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {visible.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className="grid gap-1 py-4 hover:bg-panel sm:grid-cols-[3.5rem_1fr_8rem]">
                <span className="font-mono text-sm text-accent">{entry.code}</span>
                <span>
                  <span className="font-semibold">{entry.title}</span>
                  <span className="mt-1 block text-sm text-muted">{entry.intro}</span>
                </span>
                <span className="font-mono text-xs text-muted sm:text-right">{entry.level}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!searching && children}
    </>
  );
}
