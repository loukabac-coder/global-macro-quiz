import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

// Lit la partie « ?a=b » de l'adresse sans casser le rendu côté serveur.
export function useSearch(): string {
  return useSyncExternalStore(subscribe, () => window.location.search, () => "");
}
