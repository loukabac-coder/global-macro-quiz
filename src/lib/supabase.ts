import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Crée le client Supabase au moment où on en a besoin (jamais au chargement de la page).
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Les variables Supabase sont manquantes (fichier .env.local ou réglages Vercel).",
      );
    }
    client = createClient(url, key);
  }
  return client;
}

// Traduit les messages d’erreur de Supabase en français clair.
export function frError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Confirme d’abord ton adresse e-mail avec le lien reçu par courrier.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cette adresse e-mail.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de demandes d’e-mails. Réessaie dans quelques minutes.";
  if (m.includes("password") && m.includes("characters"))
    return "Le mot de passe est trop court (8 caractères minimum).";
  if (m.includes("same password") || m.includes("different from the old"))
    return "Choisis un mot de passe différent de l’ancien.";
  if (m.includes("valid email") || m.includes("invalid email"))
    return "Cette adresse e-mail n’est pas valide.";
  return "Une erreur est survenue : " + message;
}
