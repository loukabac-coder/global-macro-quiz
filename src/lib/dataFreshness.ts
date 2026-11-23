const HOUR_MS = 3_600_000;
const DAY_MS = HOUR_MS * 24;

export const DATA_REFRESH_MS = 120_000;
export const CHECK_MAX_HOURS = 48;
export const dataTimestamp = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris",
});

export type SnapshotDates = { checked_at?: string; updated_at: string | null };

export function isAtLeastAsRecent(candidate: SnapshotDates, previous: SnapshotDates): boolean {
  const stamp = (value: string | null | undefined) => value ? Date.parse(value) : -Infinity;
  return stamp(candidate.checked_at ?? candidate.updated_at) >= stamp(previous.checked_at ?? previous.updated_at)
    && stamp(candidate.updated_at) >= stamp(previous.updated_at);
}

export function observationAge(date: string, nowMs: number): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const observed = new Date(date + "T00:00:00Z");
  if (!Number.isFinite(observed.getTime()) || observed.toISOString().slice(0, 10) !== date) return NaN;
  return Math.floor((nowMs - observed.getTime()) / DAY_MS);
}

export function wasRecentlyChecked(timestamp: string | null | undefined, nowMs: number, hours: number, weekdaysOnly = false): boolean {
  if (!timestamp) return false;
  const checked = Date.parse(timestamp);
  const age = nowMs - checked;
  if (!Number.isFinite(age) || age < 0) return false;
  if (!weekdaysOnly) return age <= hours * HOUR_MS;
  if (age > (hours + 48) * HOUR_MS) return false;
  let activeAge = age;
  for (let day = Math.floor(checked / DAY_MS) * DAY_MS; day < nowMs; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    if (weekday === 0 || weekday === 6) activeAge -= Math.min(day + DAY_MS, nowMs) - Math.max(day, checked);
  }
  return activeAge <= hours * HOUR_MS;
}
