import {
  emptyProfile,
  emptyStats,
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

/**
 * MongoDB-backed store for accounts, stats, and leagues.
 */

export interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
  profile: UserProfileFields;
  stats: UserStats;
  achievements: string[];
  history: HistoryEntry[];
}

interface UserDoc extends UserRecord {
  _id: string;
}

interface LeagueDoc extends LeagueRecord {
  _id: string;
}

async function users() {
  return (await getDb()).collection<UserDoc>("users");
}

async function leagues() {
  return (await getDb()).collection<LeagueDoc>("leagues");
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { username, createdAt, profile, stats, achievements, history } = user;
  return { username, createdAt, profile, stats, achievements, history };
}

function stripId<T extends { _id?: string }>(doc: T): Omit<T, "_id"> {
  const { _id: _unused, ...rest } = doc;
  void _unused;
  return rest;
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const col = await users();
  const doc = await col.findOne({ _id: username.toLowerCase() });
  return doc ? (stripId(doc) as UserRecord) : null;
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
  };
  const col = await users();
  await col.insertOne({ _id: key, ...record });
  return record;
}

/** Loads the user, lets the caller mutate it in place, then persists. */
export async function updateUser(
  username: string,
  mutate: (user: UserRecord) => void
): Promise<UserRecord | null> {
  const col = await users();
  const key = username.toLowerCase();
  const doc = await col.findOne({ _id: key });
  if (!doc) return null;
  const user = stripId(doc) as UserRecord;
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

export type { LeagueComment, LeagueReaction, LeagueRecord, LeagueScoreEntry };
