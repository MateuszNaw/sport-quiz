/** XP / level progression from total career score. */

export function xpFromScore(score: number): number {
  return Math.max(0, Math.round(score));
}

/** Level 1 at 0 XP; each level needs more XP (triangular-ish curve). */
export function levelFromXp(xp: number): number {
  let level = 1;
  let need = 200;
  let remaining = Math.max(0, xp);
  while (remaining >= need && level < 99) {
    remaining -= need;
    level += 1;
    need = Math.round(200 + level * 80);
  }
  return level;
}

export function xpProgress(xp: number): { level: number; intoLevel: number; need: number; ratio: number } {
  let level = 1;
  let need = 200;
  let remaining = Math.max(0, xp);
  while (remaining >= need && level < 99) {
    remaining -= need;
    level += 1;
    need = Math.round(200 + level * 80);
  }
  return { level, intoLevel: remaining, need, ratio: need === 0 ? 1 : remaining / need };
}
