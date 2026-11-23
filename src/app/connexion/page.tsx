"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Notice, inputClass, buttonClass } from "@/components/AuthShell";
import { getSupabase, frError } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) {
        setError(frError(error.message));
        setLoading(false);
        return;
      }
      const retour = new URLSearchParams(window.location.search).get("retour") ?? "";
      const path = retour.split("?")[0];
      router.replace(["/quiz", "/jeux", "/test-niveau", "/profil", "/examen-blanc", "/favoris"].includes(path) ? retour : "/parcours");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Connexion" subtitle="Retrouve ta progression là où tu l’as laissée.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm">Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm">Mot de passe</label>
          <input id="password" type="password" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Connexion en cours…" : "Se connecter"}
        </button>
      </form>
      <div className="mt-6 space-y-2 text-sm text-muted">
        <p>
          <Link href="/mot-de-passe-oublie" className="text-fg underline underline-offset-4">
            Mot de passe oublié ?
          </Link>
        </p>
        <p>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-fg underline underline-offset-4">Créer un compte</Link>
        </p>
      </div>
    </AuthShell>
  );
}
