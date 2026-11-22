"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function Cta() {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    let active = true;
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (active) setLogged(!!data.session);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      {logged ? (
        <Link href="/dashboard" className="bg-accent px-6 py-4 text-center text-sm font-semibold text-ink hover:brightness-110">
          Aller à mon parcours →
        </Link>
      ) : (
        <>
          <Link href="/inscription" className="bg-accent px-6 py-4 text-center text-sm font-semibold text-ink hover:brightness-110">
            Commencer : test de niveau en 2 min →
          </Link>
          <Link href="/connexion" className="px-2 py-3 text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
            J’ai déjà un compte
          </Link>
        </>
      )}
    </div>
  );
}
