"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, { Notice, inputClass, buttonClass } from "@/components/AuthShell";
import { getSupabase, frError } from "@/lib/supabase";

export default function Reinitialiser() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [configError] = useState<string | null>(() => {
    try {
      getSupabase();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Erreur inconnue.";
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (configError) return;
    const supabase = getSupabase();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [configError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) {
        setError(frError(error.message));
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Nouveau mot de passe">
      {ready ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm">Nouveau mot de passe</label>
            <input id="password" type="password" required minLength={8} autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <p className="mt-1.5 text-xs text-muted">8 caractères minimum.</p>
          </div>
          {error && <Notice kind="error">{error}</Notice>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <Notice kind="error">
            {configError ??
              "Ce lien n’est plus valide ou a expiré. Demande un nouveau lien de réinitialisation."}
          </Notice>
          <p className="text-sm text-muted">
            <Link href="/mot-de-passe-oublie" className="text-fg underline underline-offset-4">
              Demander un nouveau lien
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
