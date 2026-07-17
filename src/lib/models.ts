import type { Difficulty, QuizType, Sport } from "./types";

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
  bestAnswerStreak: number;
  /** Rounds finished with 100% accuracy. */
  perfectRounds: number;
  /** Timeline questions solved with every event in the right slot. */
  timelinePerfectCount: number;
  /** Consecutive calendar days with at least one finished round. */
  dayStreak: number;
  /** YYYY-MM-DD of the last day a round was recorded. */
  lastPlayedDate: string | null;
  perSport: Partial<Record<Sport, SportStat>>;
  perDifficulty: Partial<Record<Difficulty, SportStat>>;
}

export function emptyStats(): UserStats {
  return {
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    totalScore: 0,
    bestAnswerStreak: 0,
    perfectRounds: 0,
    timelinePerfectCount: 0,
    dayStreak: 0,
    lastPlayedDate: null,
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
}

export interface RoundPayload {
  sport: Sport;
  quizType: QuizType;
  correct: boolean;
  credit: number;
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

export function computeLeaderboard(league: LeagueRecord): LeaderboardRow[] {
  const byUser = new Map<string, LeaderboardRow>();
  for (const member of league.members) {
    byUser.set(member, { username: member, bestScore: 0, gamesSubmitted: 0 });
  }
  for (const entry of league.scores) {
    const row = byUser.get(entry.username) ?? { username: entry.username, bestScore: 0, gamesSubmitted: 0 };
    row.bestScore = Math.max(row.bestScore, entry.score);
    row.gamesSubmitted += 1;
    byUser.set(entry.username, row);
  }
  return Array.from(byUser.values()).sort((a, b) => b.bestScore - a.bestScore);
}
