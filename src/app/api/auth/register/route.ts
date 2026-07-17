import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { createUser, getUser, toPublicUser } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/auth/register
 * Body: { username, password }
 * Intentionally no email or password-strength validation — this is a
 * hackathon demo where username + password is the entire account model.
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

  const existing = await getUser(username);
  if (existing) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const user = await createUser(username, hashPassword(password));
  await createSession(user.username);
  return NextResponse.json({ user: toPublicUser(user) });
}
