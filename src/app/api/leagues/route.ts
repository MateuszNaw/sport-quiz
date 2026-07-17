import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createLeague, getLeaguesForUser } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ leagues: [] });
  const leagues = await getLeaguesForUser(user.username);
  return NextResponse.json({ leagues });
}

/**
 * POST /api/leagues
 * Body: { name }
 * Creates a private league owned by the signed-in user and returns its
 * invite code (also usable directly as the /leagues/[code] URL).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a league" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "League name is required" }, { status: 400 });
  }

  const league = await createLeague(name, user.username);
  return NextResponse.json({ league });
}
