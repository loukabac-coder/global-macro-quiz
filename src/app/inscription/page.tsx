"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Notice, inputClass, buttonClass } from "@/components/AuthShell";
import { getSupabase, frError } from "@/lib/supabase";

export default function Inscription() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/connexion` },
      });
      if (error) setError(frError(error.message));
      else setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
    setLoading(false);
  }

  if (done) {
    return (
      <AuthShell title="Vérifie ta boîte mail">
        <Notice kind="ok">
          Un e-mail de confirmation vient d’être envoyé à <strong>{email}</strong>. Clique sur le lien
          qu’il contient, puis connecte-toi. Pense à regarder dans les courriers indésirables.
        </Notice>
        <p className="mt-6 text-sm text-muted">
          <Link href="/connexion" className="text-fg underline underline-offset-4">
            Aller à la connexion
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Créer un compte" subtitle="Ton adresse e-mail et un mot de passe suffisent.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm">Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm">Mot de passe</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          <p className="mt-1.5 text-xs text-muted">8 caractères minimum.</p>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Création en cours…" : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-fg underline underline-offset-4">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
