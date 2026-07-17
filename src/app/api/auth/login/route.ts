import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { getUser, toPublicUser } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const user = await getUser(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
  }

  await createSession(user.username);
  return NextResponse.json({ user: toPublicUser(user) });
}
