"use client";

import { Suspense } from "react";
import QuizRunner from "@/components/QuizRunner";
import { useSearch } from "@/lib/useSearch";
import { parseList } from "@/lib/loaders";
import type { Activity } from "@/lib/quizSession";
import { todayParis } from "@/lib/rng";
import { guestDaily, guestQuick } from "@/lib/guest";

const TITLES: Record<string, string> = {
  quick: "Quick Quiz",
  mixed: "Mixed : toutes les catégories",
  daily: "Daily Challenge",
  weakness: "Weakness Training",
};

export default function QuizPage() {
  return <Suspense fallback={<p className="p-6 text-sm text-muted">Chargement du quiz…</p>}><Quiz /></Suspense>;
}

function Quiz() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const m = params.get("mode") ?? "";
  const categories = parseList(params.get("categorie"));
  const levels = parseList(params.get("niveau"));
  const training = categories.length > 0 || levels.length > 0;

  let activity: Activity = { type: "quick" };
  let title = TITLES.quick;
  if (m === "daily") {
    activity = { type: "daily" };
    title = TITLES.daily;
  } else if (m === "weakness") {
    activity = { type: "weakness" };
    title = TITLES.weakness;
  } else if (m === "mixed") {
    activity = { type: "mixed" };
    title = TITLES.mixed;
  } else if (training) {
    activity = { type: "training", categories, levels };
    title = "Training : " + [categories.join(", "), levels.join(", ")].filter(Boolean).join(" · ");
  }

  return (
    <QuizRunner
      key={search}
      title={title}
      activity={activity}
      backHref="/entrainement"
      backLabel="Entraînement libre"
      guestLoad={
        // Un invité peut faire le quiz rapide et le défi du jour. Les autres modes demandent un compte.
        activity.type === "daily" ? () => guestDaily(todayParis()) : activity.type === "quick" ? () => guestQuick(10) : undefined
      }
    />
  );
}
