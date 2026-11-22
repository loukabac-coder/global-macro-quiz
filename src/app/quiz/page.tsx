"use client";

import QuizRunner, { type Mode } from "@/components/QuizRunner";
import { useSearch } from "@/lib/useSearch";
import { loadDaily, loadQuick, loadTraining, loadWeakness, parseList } from "@/lib/loaders";
import { todayParis } from "@/lib/rng";
import { guestDaily, guestQuick } from "@/lib/guest";

const TITLES: Record<string, string> = {
  quick: "Quick Quiz",
  mixed: "Mixed : toutes les catégories",
  daily: "Daily Challenge",
  weakness: "Weakness Training",
};

export default function QuizPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const m = params.get("mode") ?? "";
  const categories = parseList(params.get("categorie"));
  const levels = parseList(params.get("niveau"));
  const training = categories.length > 0 || levels.length > 0;

  let mode: Mode = "quick";
  let title = TITLES.quick;
  if (m === "daily") {
    mode = "daily";
    title = TITLES.daily;
  } else if (m === "weakness") {
    mode = "weakness";
    title = TITLES.weakness;
  } else if (m === "mixed") {
    mode = "mixed";
    title = TITLES.mixed;
  } else if (training) {
    mode = "training";
    title = "Training : " + [categories.join(", "), levels.join(", ")].filter(Boolean).join(" · ");
  }

  return (
    <QuizRunner
      key={search}
      title={title}
      mode={mode}
      backHref="/entrainement"
      backLabel="Entraînement libre"
      guestLoad={
        // Un invité peut faire le quiz rapide et le défi du jour. Les autres modes demandent un compte.
        mode === "daily" ? () => guestDaily(todayParis()) : mode === "quick" ? () => guestQuick(10) : undefined
      }
      load={async ({ supabase, userId }) => {
        if (mode === "daily") return loadDaily(supabase, todayParis());
        if (mode === "weakness") return loadWeakness(supabase, userId);
        if (mode === "training") return loadTraining(supabase, categories, levels);
        return loadQuick(supabase, mode === "mixed");
      }}
    />
  );
}
