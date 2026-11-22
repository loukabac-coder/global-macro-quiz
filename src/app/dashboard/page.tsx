"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Cette page a été fusionnée : on renvoie vers la nouvelle adresse.
export default function Redirection() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/parcours");
  }, [router]);
  return <p className="p-6 text-sm text-muted">Redirection…</p>;
}
