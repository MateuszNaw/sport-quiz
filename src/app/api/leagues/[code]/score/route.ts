import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeague } from "@/lib/store";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";
import { isoWeekId } from "@/lib/week";

export const runtime = "nodejs";

/**
 * POST /api/leagues/[code]/score
 * Body: { score, difficulty }
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit a score" }, { status: 401 });
  }

  let body: { score?: number; difficulty?: Difficulty };
  try {
    body = (await req.json()) as { score?: number; difficulty?: Difficulty };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.score !== "number" || !body.difficulty || !DIFFICULTIES.includes(body.difficulty)) {
    return NextResponse.json({ error: "Invalid score payload" }, { status: 400 });
  }

  const { code } = await params;
  const now = new Date().toISOString();
  const league = await updateLeague(code, (l) => {
    if (!l.members.includes(user.username)) l.members.push(user.username);
    l.scores.push({
      username: user.username,
      score: body.score as number,
      difficulty: body.difficulty as Difficulty,
      date: now,
      weekId: isoWeekId(new Date(now)),
    });
  });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  return NextResponse.json({ league });
}
