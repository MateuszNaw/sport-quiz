import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getUser, type UserRecord } from "./store";

const SESSION_COOKIE = "sportiq_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
// Fine for a hackathon demo — set SESSION_SECRET in env for anything real.
const SECRET = process.env.SESSION_SECRET || "sportiq-hackathon-dev-secret";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const check = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === check.length && timingSafeEqual(expected, check);
  } catch {
    return false;
  }
}

function sign(username: string): string {
  const payload = Buffer.from(username, "utf-8").toString("base64url");
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function unsign(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  try {
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return Buffer.from(payload, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

export async function createSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUsername(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? unsign(token) : null;
}

export async function getSessionUser(): Promise<UserRecord | null> {
  const username = await getSessionUsername();
  return username ? getUser(username) : null;
}
