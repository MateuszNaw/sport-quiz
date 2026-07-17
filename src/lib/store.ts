import { promises as fs } from "fs";
import path from "path";
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

/**
 * Tiny JSON-file "database" for the hackathon build. Good enough for a
 * single-instance demo: no external services required, but not meant for
 * concurrent production traffic.
 */

const DB_PATH = path.join(process.cwd(), ".data", "sportiq-db.json");

export interface UserRecord {
  username: string;
  passwordHash: string;
  createdAt: string;
  profile: UserProfileFields;
  stats: UserStats;
  achievements: string[];
  history: HistoryEntry[];
}

interface Database {
  users: Record<string, UserRecord>;
  leagues: Record<string, LeagueRecord>;
}

function emptyDb(): Database {
  return { users: {}, leagues: {} };
}

let cache: Database | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function readDb(): Promise<Database> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    cache = JSON.parse(raw) as Database;
  } catch {
    cache = emptyDb();
  }
  return cache;
}

function writeDb(db: Database): Promise<void> {
  cache = db;
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  });
  return writeQueue;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { username, createdAt, profile, stats, achievements, history } = user;
  return { username, createdAt, profile, stats, achievements, history };
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const db = await readDb();
  return db.users[username.toLowerCase()] ?? null;
}

export async function createUser(username: string, passwordHash: string): Promise<UserRecord> {
  const db = await readDb();
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
  db.users[key] = record;
  await writeDb(db);
  return record;
}

/** Loads the user, lets the caller mutate it in place, then persists. */
export async function updateUser(
  username: string,
  mutate: (user: UserRecord) => void
): Promise<UserRecord | null> {
  const db = await readDb();
  const key = username.toLowerCase();
  const user = db.users[key];
  if (!user) return null;
  mutate(user);
  await writeDb(db);
  return user;
}

function generateLeagueCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createLeague(name: string, ownerUsername: string): Promise<LeagueRecord> {
  const db = await readDb();
  let code = generateLeagueCode();
  while (db.leagues[code]) code = generateLeagueCode();
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
  db.leagues[code] = league;
  await writeDb(db);
  return league;
}

export async function getLeague(code: string): Promise<LeagueRecord | null> {
  const db = await readDb();
  return db.leagues[code.toUpperCase()] ?? null;
}

export async function getLeaguesForUser(username: string): Promise<LeagueRecord[]> {
  const db = await readDb();
  return Object.values(db.leagues).filter((l) => l.members.includes(username));
}

export async function updateLeague(
  code: string,
  mutate: (league: LeagueRecord) => void
): Promise<LeagueRecord | null> {
  const db = await readDb();
  const league = db.leagues[code.toUpperCase()];
  if (!league) return null;
  mutate(league);
  await writeDb(db);
  return league;
}

export type { LeagueComment, LeagueReaction, LeagueRecord, LeagueScoreEntry };
