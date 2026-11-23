"use client";

import { useState } from "react";
import Link from "next/link";
import { hashString } from "@/lib/rng";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Question } from "@/lib/quiz";

export default function QuestionActions({ question }: { question: Question }) {
  const [favorite, setFavorite] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [signIn, setSignIn] = useState(false);

  async function save(report?: FormData) {
    if (pending) return;
    setPending(true);
    setNotice(null);
    setSignIn(false);
    try {
      if (!supabaseConfigured()) {
        setNotice("Ce service est indisponible pour le moment.");
        return;
      }
      const db = getSupabase();
      const { data: { session }, error: sessionError } = await db.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setSignIn(true);
        return;
      }
      const question_key = `${question.id}:${hashString(question.prompt).toString(16)}`;
      const { error } = report
        ? await db.from("question_reports").insert({
          question_key, question_id: question.id, prompt: question.prompt,
          reason: report.get("reason"), detail: String(report.get("detail") ?? "").trim(),
        })
        : await db.from("question_favorites").insert({ question_key, question });
      if (error && error.code !== "23505") throw error;
      if (report) {
        setReported(true);
        setReportOpen(false);
      } else {
        setFavorite(true);
      }
    } catch {
      setNotice(report ? "Le signalement a échoué. Réessaie." : "Le favori n’a pas pu être ajouté. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 text-xs text-muted">
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="button" disabled={pending || favorite} onClick={() => save()} className="min-h-9 text-left underline underline-offset-4 hover:text-fg disabled:no-underline">
          {favorite ? "Ajouté aux favoris" : "Ajouter aux favoris"}
        </button>
        <button type="button" disabled={pending || reported} aria-expanded={reportOpen} onClick={() => setReportOpen((open) => !open)} className="min-h-9 text-left underline underline-offset-4 hover:text-fg disabled:no-underline">
          {reported ? "Signalement enregistré" : reportOpen ? "Fermer le signalement" : "Signaler la question"}
        </button>
      </div>
      {reportOpen && (
        <form className="space-y-3 border border-line bg-panel p-3" onSubmit={(event) => {
          event.preventDefault();
          void save(new FormData(event.currentTarget));
        }}>
          <label className="block">
            Motif
            <select name="reason" required className="mt-1 block w-full border border-line bg-ink p-2 text-sm text-fg">
              <option value="incorrect">Réponse ou correction incorrecte</option>
              <option value="ambiguous">Énoncé ambigu</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label className="block">
            Précisions (facultatif)
            <textarea name="detail" rows={2} maxLength={1000} className="mt-1 block w-full border border-line bg-ink p-2 text-sm text-fg" />
          </label>
          <button type="submit" disabled={pending} className="border border-line px-3 py-2 text-sm text-fg hover:border-accent disabled:opacity-50">
            {pending ? "Envoi…" : "Envoyer le signalement"}
          </button>
        </form>
      )}
      {notice && <p role="alert" className="text-danger">{notice}</p>}
      {signIn && <p role="status"><Link href="/connexion" className="text-fg underline underline-offset-4">Connecte-toi</Link> pour enregistrer un favori ou un signalement.</p>}
    </div>
  );
}
