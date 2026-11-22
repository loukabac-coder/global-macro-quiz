"use client";

import QuizRunner from "@/components/QuizRunner";
import { guestQuick } from "@/lib/guest";

// Test sans compte : 5 questions, rien n'est sauvegardé.
export default function Invite() {
  return (
    <QuizRunner
      title="Quiz rapide"
      kicker="Mode invité · rien n’est sauvegardé"
      guestOnly
      backHref="/"
      backLabel="Accueil"
      replayLabel="Rejouer avec 5 nouvelles questions"
      guestLoad={() => guestQuick(5)}
    />
  );
}
