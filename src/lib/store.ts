import type { Document } from "mongodb";
import {
  emptyProfile,
  emptyStats,
  withLevel,
  type ChallengeRecord,
  type GlobalScoreEntry,
  type HistoryEntry,
  type LeagueComment,
  type LeagueReaction,
  type LeagueRecord,
  type LeagueScoreEntry,
  type PublicUser,
  type UserProfileFields,
  type UserStats,
} from "./models";
import { getDb } from "./mongodb";
import { isoWeekId } from "./week";

/**
 * MongoDB-backed store for accounts, stats, leagues, and global boards.
 */

export const MAX_SEEN_QUESTIONS = 1000;

export interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
  profile: UserProfileFields;
  stats: UserStats;
  achievements: string[];
  history: HistoryEntry[];
  seenQuestions: string[];
}

interface UserDoc extends UserRecord {
  _id: string;
}

interface LeagueDoc extends LeagueRecord {
  _id: string;
}

interface GlobalScoreDoc extends GlobalScoreEntry, Document {
  _id: string;
}

interface ChallengeDoc extends ChallengeRecord, Document {
  _id: string;
}

async function users() {
  return (await getDb()).collection<UserDoc>("users");
}

async function leagues() {
  return (await getDb()).collection<LeagueDoc>("leagues");
}

async function globalScores() {
  return (await getDb()).collection<GlobalScoreDoc>("global_scores");
}

async function challenges() {
  return (await getDb()).collection<ChallengeDoc>("challenges");
}

function normalizeStats(raw: Partial<UserStats> | undefined): UserStats {
  const base = emptyStats();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    xp: raw.xp ?? raw.totalScore ?? 0,
    lastDailyDate: raw.lastDailyDate ?? null,
    speedBonusCount: raw.speedBonusCount ?? 0,
    challengesPlayed: raw.challengesPlayed ?? 0,
    challengesWon: raw.challengesWon ?? 0,
    perSport: raw.perSport ?? {},
    perDifficulty: raw.perDifficulty ?? {},
  };
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { username, createdAt, profile, stats, achievements, history } = user;
  return withLevel({
    username,
    createdAt,
    profile,
    stats: normalizeStats(stats),
    achievements,
    history,
  });
}

function stripId<T extends { _id?: string }>(doc: T): Omit<T, "_id"> {
  const { _id: _unused, ...rest } = doc;
  void _unused;
  return rest;
}

function normalizeUser(doc: Omit<UserDoc, "_id"> | UserRecord): UserRecord {
  return {
    ...doc,
    stats: normalizeStats(doc.stats),
    seenQuestions: Array.isArray(doc.seenQuestions) ? doc.seenQuestions : [],
  };
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const col = await users();
  const doc = await col.findOne({ _id: username.toLowerCase() });
  return doc ? normalizeUser(stripId(doc) as UserRecord) : null;
}

export async function createUser(username: string, passwordHash: string): Promise<UserRecord> {
  const key = username.toLowerCase();
  const record: UserRecord = {
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    profile: emptyProfile(),
    stats: emptyStats(),
    achievements: [],
    history: [],
    seenQuestions: [],
  };
  const col = await users();
  await col.insertOne({ _id: key, ...record });
  return record;
}

export async function markQuestionsSeen(username: string, keys: string[]): Promise<void> {
  const normalized = [...new Set(keys.map((k) => k.trim().toLowerCase()).filter(Boolean))];
  if (normalized.length === 0) return;

  await updateUser(username, (user) => {
    const merged = [...new Set([...(user.seenQuestions ?? []), ...normalized])];
    user.seenQuestions = merged.slice(-MAX_SEEN_QUESTIONS);
  });
}

export async function updateUser(
  username: string,
  mutate: (user: UserRecord) => void
): Promise<UserRecord | null> {
  const col = await users();
  const key = username.toLowerCase();
  const doc = await col.findOne({ _id: key });
  if (!doc) return null;
  const user = normalizeUser(stripId(doc) as UserRecord);
  mutate(user);
  await col.replaceOne({ _id: key }, { _id: key, ...user } as UserDoc);
  return user;
}

function generateLeagueCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createLeague(name: string, ownerUsername: string): Promise<LeagueRecord> {
  const col = await leagues();
  let code = generateLeagueCode();
  while (await col.findOne({ _id: code })) code = generateLeagueCode();
  const league: LeagueRecord = {
    code,
    name,
    ownerUsername,
    createdAt: new Date().toISOString(),
    members: [ownerUsername],
    scores: [],
    comments: [],
    reactions: [],
  };
  await col.insertOne({ _id: code, ...league });
  return league;
}

export async function getLeague(code: string): Promise<LeagueRecord | null> {
  const col = await leagues();
  const doc = await col.findOne({ _id: code.toUpperCase() });
  return doc ? (stripId(doc) as LeagueRecord) : null;
}

export async function getLeaguesForUser(username: string): Promise<LeagueRecord[]> {
  const col = await leagues();
  const docs = await col.find({ members: username }).toArray();
  return docs.map((d) => stripId(d) as LeagueRecord);
}

export async function updateLeague(
  code: string,
  mutate: (league: LeagueRecord) => void
): Promise<LeagueRecord | null> {
  const col = await leagues();
  const key = code.toUpperCase();
  const doc = await col.findOne({ _id: key });
  if (!doc) return null;
  const league = stripId(doc) as LeagueRecord;
  mutate(league);
  await col.replaceOne({ _id: key }, { _id: key, ...league } as LeagueDoc);
  return league;
}

export async function recordGlobalScore(entry: Omit<GlobalScoreEntry, "weekId"> & { weekId?: string }): Promise<void> {
  const col = await globalScores();
  const full: GlobalScoreEntry = {
    ...entry,
    weekId: entry.weekId ?? isoWeekId(new Date(entry.date)),
  };
  const id = `${full.username.toLowerCase()}_${full.date}_${full.mode}_${full.score}_${Math.random().toString(36).slice(2, 7)}`;
  await col.insertOne({ _id: id, ...full });
}

export async function getGlobalLeaderboard(
  period: "all" | "week",
  limit = 25
): Promise<{ username: string; bestScore: number; games: number; xp: number }[]> {
  const col = await globalScores();
  const filter = period === "week" ? { weekId: isoWeekId() } : {};
  const rows = await col.find(filter).sort({ score: -1 }).limit(400).toArray();
  const byUser = new Map<string, { username: string; bestScore: number; games: number; xp: number }>();
  for (const row of rows) {
    const cur = byUser.get(row.username) ?? { username: row.username, bestScore: 0, games: 0, xp: 0 };
    cur.bestScore = Math.max(cur.bestScore, row.score);
    cur.games += 1;
    cur.xp += row.score;
    byUser.set(row.username, cur);
  }
  return Array.from(byUser.values())
    .sort((a, b) => b.bestScore - a.bestScore || b.xp - a.xp)
    .slice(0, limit);
}

export async function recordChallenge(entry: Omit<ChallengeRecord, "id">): Promise<ChallengeRecord> {
  const col = await challenges();
  const id = crypto.randomUUID();
  const record: ChallengeRecord = { id, ...entry };
  await col.insertOne({ _id: id, ...record });
  return record;
}

export async function getChallengesForUser(username: string, limit = 20): Promise<ChallengeRecord[]> {
  const col = await challenges();
  const docs = await col
    .find({ $or: [{ fromUsername: username }, { toUsername: username }] })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => stripId(d) as ChallengeRecord);
}

export type { LeagueComment, LeagueReaction, LeagueRecord, LeagueScoreEntry };
