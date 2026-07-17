import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeague } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST /api/leagues/[code]/reactions
 * Body: { targetUsername, emoji }
 * Toggles a reaction from the signed-in user on a leaderboard row.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
  }

  let body: { targetUsername?: string; emoji?: string };
  try {
    body = (await req.json()) as { targetUsername?: string; emoji?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { targetUsername, emoji } = body;
  if (!targetUsername || !emoji) {
    return NextResponse.json({ error: "Invalid reaction payload" }, { status: 400 });
  }

  const { code } = await params;
  const league = await updateLeague(code, (l) => {
    const existingIdx = l.reactions.findIndex(
      (r) => r.author === user.username && r.targetUsername === targetUsername && r.emoji === emoji
    );
    if (existingIdx >= 0) {
      l.reactions.splice(existingIdx, 1);
    } else {
      l.reactions.push({
        id: crypto.randomUUID(),
        author: user.username,
        emoji,
        targetUsername,
        createdAt: new Date().toISOString(),
      });
    }
  });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  return NextResponse.json({ league });
}
