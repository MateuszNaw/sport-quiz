import type { Difficulty, QuizType, Sport } from "./types";
import { levelFromXp } from "./xp";
import { isInCurrentWeek } from "./week";

/**
 * Shared data shapes for accounts, stats, achievements and social features.
 * No server-only imports here (no `fs`) so this file is safe to import from
 * both client and server code.
 */

export interface SportStat {
  correct: number;
  total: number;
}

export interface UserStats {
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalScore: number;
  /** Career XP (mirrors totalScore gains; kept separate for future tuning). */
  xp: number;
  bestAnswerStreak: number;
  /** Rounds finished with 100% accuracy. */
  perfectRounds: number;
  /** Timeline questions solved with every event in the right slot. */
  timelinePerfectCount: number;
  /** Consecutive calendar days with at least one finished round. */
  dayStreak: number;
  /** YYYY-MM-DD of the last day a round was recorded. */
  lastPlayedDate: string | null;
  /** YYYY-MM-DD of last completed daily challenge. */
  lastDailyDate: string | null;
  /** Fast answers under the speed threshold. */
  speedBonusCount: number;
  challengesPlayed: number;
  challengesWon: number;
  perSport: Partial<Record<Sport, SportStat>>;
  perDifficulty: Partial<Record<Difficulty, SportStat>>;
}

export function emptyStats(): UserStats {
  return {
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalScore: 0,
    xp: 0,
    bestAnswerStreak: 0,
    perfectRounds: 0,
    timelinePerfectCount: 0,
    dayStreak: 0,
    lastPlayedDate: null,
    lastDailyDate: null,
    speedBonusCount: 0,
    challengesPlayed: 0,
    challengesWon: 0,
    perSport: {},
    perDifficulty: {},
  };
}

export interface HistoryEntry {
  id: string;
  date: string;
  difficulty: Difficulty;
  total: number;
  correct: number;
  score: number;
  sports: Sport[];
  mode?: "standard" | "daily" | "endless";
}

export interface UserProfileFields {
  favoriteSport: Sport | null;
  favoriteClub: string | null;
  favoritePlayer: string | null;
}

export function emptyProfile(): UserProfileFields {
  return { favoriteSport: null, favoriteClub: null, favoritePlayer: null };
}

/** Shape returned to the client — never includes the password hash. */
export interface PublicUser {
  username: string;
  createdAt: string;
  profile: UserProfileFields;
  stats: UserStats;
  achievements: string[];
  history: HistoryEntry[];
  level: number;
}

export function withLevel(user: Omit<PublicUser, "level"> & { stats: UserStats }): PublicUser {
  return { ...user, level: levelFromXp(user.stats.xp ?? user.stats.totalScore) };
}

export interface RoundPayload {
  sport: Sport;
  quizType: QuizType;
  correct: boolean;
  credit: number;
  speedBonus?: boolean;
  hintUsed?: boolean;
}

export interface LeagueComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface LeagueReaction {
  id: string;
  author: string;
  emoji: string;
  targetUsername: string;
  createdAt: string;
}

export interface LeagueScoreEntry {
  username: string;
  score: number;
  difficulty: Difficulty;
  date: string;
  weekId?: string;
}

export interface LeagueRecord {
  code: string;
  name: string;
  ownerUsername: string;
  createdAt: string;
  members: string[];
  scores: LeagueScoreEntry[];
  comments: LeagueComment[];
  reactions: LeagueReaction[];
}

export interface LeaderboardRow {
  username: string;
  bestScore: number;
  gamesSubmitted: number;
}

export function computeLeaderboard(
  league: LeagueRecord,
  period: "all" | "week" = "all"
): LeaderboardRow[] {
  const byUser = new Map<string, LeaderboardRow>();
  for (const member of league.members) {
    byUser.set(member, { username: member, bestScore: 0, gamesSubmitted: 0 });
  }
  for (const entry of league.scores) {
    if (period === "week" && !isInCurrentWeek(entry.date)) continue;
    const row = byUser.get(entry.username) ?? { username: entry.username, bestScore: 0, gamesSubmitted: 0 };
    row.bestScore = Math.max(row.bestScore, entry.score);
    row.gamesSubmitted += 1;
    byUser.set(entry.username, row);
  }
  return Array.from(byUser.values()).sort((a, b) => b.bestScore - a.bestScore);
}

export interface GlobalScoreEntry {
  username: string;
  score: number;
  difficulty: Difficulty;
  date: string;
  weekId: string;
  mode: "standard" | "daily" | "endless";
}

export interface ChallengeRecord {
  id: string;
  fromUsername: string;
  toUsername: string;
  challengeScore: number;
  attemptScore: number;
  difficulty: Difficulty;
  won: boolean;
  date: string;
}
