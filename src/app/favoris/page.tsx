"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { CAT_NAME } from "@/lib/categories";
import { isCurrentFavorite } from "@/lib/curriculum/catalog";
import { correctLabel, DIFFICULTY_FR, type Question } from "@/lib/quiz";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

type Favorite = { question_key: string; question: Question };

export default function Favoris() {
  const [rows, setRows] = useState<Favorite[] | null>(null);
  const [signIn, setSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supabaseConfigured()) throw new Error("supabase");
        const db = getSupabase();
        const { data: { session }, error: sessionError } = await db.auth.getSession();
        if (sessionError) throw sessionError;
        if (!active) return;
        if (!session) {
          setSignIn(true);
          return;
        }
        const favorites: Favorite[] = [];
        for (let offset = 0; active;) {
          const { data, error } = await db.from("question_favorites").select("question_key, question")
            .order("created_at", { ascending: false }).order("question_key").range(offset, offset + 499);
          if (error) throw error;
          if (!data.length) break;
          favorites.push(...data as Favorite[]);
          offset += data.length;
        }
        if (active) setRows(favorites);
      } catch {
        if (active) setError("Tes favoris n’ont pas pu être chargés.");
      }
    }
    void load();
    return () => { active = false; };
  }, [retry]);

  async function remove(key: string) {
    if (removing) return;
    setRemoving(key);
    setError(null);
    try {
      const { error } = await getSupabase().from("question_favorites").delete().eq("question_key", key);
      if (error) throw error;
      setRows((items) => items?.filter((item) => item.question_key !== key) ?? null);
    } catch {
      setError("Ce favori n’a pas pu être retiré. Réessaie.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <AppShell width="max-w-3xl">
      <main className="fade-in py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Mes questions favorites</h1>
        {signIn && <p className="mt-4 text-sm text-muted"><Link href="/connexion?retour=%2Ffavoris" className="text-fg underline underline-offset-4">Connecte-toi</Link> pour retrouver tes favoris.</p>}
        {!rows && !signIn && !error && <p role="status" className="mt-4 text-sm text-muted">Chargement…</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error} {!rows && <button type="button" onClick={() => { setError(null); setRetry((count) => count + 1); }} className="text-fg underline underline-offset-4">Réessayer</button>}
          </p>
        )}
        {rows?.length === 0 && (
          <p className="mt-4 text-sm text-muted">Ajoute une question depuis sa correction pour la retrouver ici. <Link href="/entrainement" className="text-fg underline underline-offset-4">Commencer un quiz</Link></p>
        )}
        {!!rows?.length && (
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {rows.map(({ question_key: key, question: q }) => (
              <li key={key} className="space-y-2 py-4">
                {isCurrentFavorite(q) ? <details>
                  <summary className="cursor-pointer">
                    <span className="font-mono text-xs text-muted">{CAT_NAME[q.category_id] ?? q.category_id} · {DIFFICULTY_FR[q.difficulty] ?? q.difficulty}</span>
                    <span className="mt-1 block font-medium">{q.prompt}</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-muted">
                    <p>Bonne réponse · <span className="text-fg">{correctLabel(q)}</span></p>
                    <p>{q.explanation}</p>
                    {(q.source || q.reference_date) && <p className="font-mono text-xs">{[q.source, q.reference_date].filter(Boolean).join(" · ")}</p>}
                  </div>
                </details> : <p className="text-sm text-muted">Cette question a été retirée du parcours.</p>}
                <button type="button" disabled={!!removing} onClick={() => remove(key)} className="min-h-9 text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-50">
                  {removing === key ? "Retrait…" : "Retirer des favoris"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
