/** ISO week helpers for weekly leaderboards / league resets. */

export function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Monday-based ISO week id, e.g. "2026-W29". */
export function isoWeekId(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isInCurrentWeek(isoDate: string, now = new Date()): boolean {
  return isoWeekId(new Date(isoDate)) === isoWeekId(now);
}
