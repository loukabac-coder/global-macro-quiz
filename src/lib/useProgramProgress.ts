"use client";

import { useEffect, useState } from "react";
import type { Progress } from "@/lib/modules";
import { todayParis } from "@/lib/rng";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

type Profile = { display_name: string | null; xp: number; streak_days: number; last_daily_date: string | null };
type Loaded = { status: "loading" | "error" | "guest" | "ready"; progress: Progress; profile?: Profile; due?: number; today?: string };

export function useProgramProgress(dashboard = false) {
  const [state, setState] = useState<Loaded>({ status: "loading", progress: {} });
  useEffect(() => {
    let active = true;
    async function load(): Promise<Loaded> {
      if (!supabaseConfigured()) return { status: "guest", progress: {} };
      const db = getSupabase();
      const { data, error } = await db.auth.getSession();
      if (error) throw error;
      const userId = data.session?.user.id;
      if (!userId) return { status: "guest", progress: {} };
      const [rows, profile, reviews] = await Promise.all([
        db.from("module_progress").select("module_id, passed, best_pct, attempts").eq("user_id", userId),
        dashboard ? db.from("profiles").select("display_name, xp, streak_days, last_daily_date").eq("id", userId).maybeSingle() : null,
        dashboard ? db.from("question_reviews").select("question_id", { count: "exact", head: true }).eq("user_id", userId).lte("due_at", new Date().toISOString()) : null,
      ]);
      if (rows.error || profile?.error || reviews?.error) throw rows.error ?? profile?.error ?? reviews?.error;
      return {
        status: "ready", progress: Object.fromEntries(rows.data.map((row) => [row.module_id, row])),
        profile: profile?.data ?? undefined, due: reviews?.count ?? 0, today: todayParis(),
      };
    }
    load().then((result) => {
      if (active) setState(result);
    }).catch(() => {
      if (active) setState({ status: "error", progress: {} });
    });
    return () => { active = false; };
  }, [dashboard]);
  return state;
}
