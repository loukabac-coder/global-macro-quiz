"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { levelFromXp, levelName } from "@/lib/progress";
import Crumbs from "@/components/Crumbs";

// Quatre entrées seulement. Chaque page appartient à une rubrique : celle-ci est surlignée dans le menu.
const NAV: [string, string][] = [
  ["/parcours", "Parcours"],
  ["/entrainement", "Entraînement libre"],
  ["/cours", "Cours"],
  ["/profil", "Profil"],
];

const SECTION: [string, string][] = [
  ["/parcours", "/parcours"],
  ["/test-niveau", "/parcours"],
  ["/entrainement", "/entrainement"],
  ["/quiz", "/entrainement"],
  ["/jeux", "/entrainement"],
  ["/calcul-mental", "/entrainement"],
  ["/invite", "/entrainement"],
  ["/cours", "/cours"],
  ["/donnees", "/cours"],
  ["/capitalisations", "/cours"],
  ["/profil", "/profil"],
];

function sectionOf(path: string): string {
  return SECTION.find(([prefix]) => path.startsWith(prefix))?.[1] ?? "";
}

type Chip = { xp: number; streak: number };

export default function AppShell({ children, width = "max-w-5xl" }: { children: React.ReactNode; width?: string }) {
  const path = usePathname();
  const router = useRouter();
  const [logged, setLogged] = useState<boolean | null>(null);
  const [chip, setChip] = useState<Chip | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!active) return;
        setLogged(!!user);
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("xp, streak_days").eq("id", user.id).maybeSingle();
        if (active && p) setChip({ xp: p.xp ?? 0, streak: p.streak_days ?? 0 });
      } catch {
        if (active) setLogged(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, []);

  const nav = logged === false ? NAV.filter(([h]) => h !== "/profil") : NAV;
  const here = sectionOf(path);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-ink/95 backdrop-blur">
        <div className={`mx-auto flex ${width} items-center justify-between gap-4 px-4 py-3 sm:px-5`}>
          <Link href={logged ? "/parcours" : "/"} className="shrink-0 font-mono text-sm font-semibold tracking-tight">
            global<span className="text-accent">/</span>macro<span className="text-accent">/</span>quiz
          </Link>
          <nav className="hidden items-center gap-5 text-sm sm:flex" aria-label="Navigation principale">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={here === href ? "text-fg" : "text-muted hover:text-fg"}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            {logged && chip && (
              <Link href="/profil" className="hidden border border-line px-2.5 py-1 font-mono text-xs sm:block" title={levelName(levelFromXp(chip.xp))}>
                niv {levelFromXp(chip.xp)} · {chip.xp} xp · {chip.streak} j
              </Link>
            )}
            {logged === false && (
              <>
                <Link href="/connexion" className="text-muted hover:text-fg">Connexion</Link>
                <Link href="/inscription" className="border border-line px-3 py-1.5 hover:border-muted">Créer un compte</Link>
              </>
            )}
            {logged && (
              <button
                onClick={async () => {
                  await getSupabase().auth.signOut();
                  router.push("/");
                }}
                className="text-muted hover:text-fg"
              >
                Quitter
              </button>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 text-sm sm:hidden" aria-label="Navigation mobile">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`shrink-0 px-3 py-1.5 ${here === href ? "border border-accent text-fg" : "border border-transparent text-muted"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className={`mx-auto ${width} px-4 sm:px-5`}>
        {here === "/cours" && (path.startsWith("/donnees") || path.startsWith("/capitalisations")) && (
          <div className="-mb-4 pt-6">
            <Crumbs items={[["Cours", "/cours"], ["Chiffres du jour"]]} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
