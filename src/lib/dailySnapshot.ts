import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { curriculumQuestions } from "@/lib/curriculum/catalog";
import { readStudySources } from "@/lib/dataSnapshots";
import { dailyQuestions } from "@/lib/guest";
import { buildStudyQuestions } from "@/lib/studyQuestions";
import { todayParis } from "@/lib/rng";
import type { Question } from "@/lib/quiz";

export async function readDailySnapshot(writer?: SupabaseClient): Promise<{ day: string; questions: Question[] }> {
  const day = todayParis();
  if (!writer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { day, questions: dailyQuestions(curriculumQuestions(), day) };
    writer = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  const saved = await writer.rpc("daily_quiz_snapshot", { p_day: day, p_questions: null });
  if (saved.error) throw new Error("daily_snapshot");
  if (saved.data) return { day, questions: saved.data as Question[] };
  const live = buildStudyQuestions(await readStudySources(), Date.now());
  const questions = dailyQuestions(curriculumQuestions(), day, live);
  const published = await writer.rpc("daily_quiz_snapshot", { p_day: day, p_questions: questions });
  if (published.error && todayParis() !== day) return readDailySnapshot(writer);
  if (published.error || !published.data) throw new Error("daily_snapshot");
  return { day, questions: published.data as Question[] };
}
