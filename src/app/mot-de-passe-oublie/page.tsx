"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Notice, inputClass, buttonClass } from "@/components/AuthShell";
import { getSupabase, frError } from "@/lib/supabase";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialiser`,
      });
      if (error) setError(frError(error.message));
      else setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
    setLoading(false);
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indique l’adresse e-mail de ton compte : nous t’enverrons un lien pour choisir un nouveau mot de passe."
    >
      {done ? (
        <Notice kind="ok">
          Si un compte existe avec cette adresse, un e-mail vient d’être envoyé. Clique sur le lien
          qu’il contient pour choisir un nouveau mot de passe.
        </Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm">Adresse e-mail</label>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          {error && <Notice kind="error">{error}</Notice>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-muted">
        <Link href="/connexion" className="text-fg underline underline-offset-4">Retour à la connexion</Link>
      </p>
    </AuthShell>
  );
}
