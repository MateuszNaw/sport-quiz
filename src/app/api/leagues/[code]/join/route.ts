import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeague } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to join a league" }, { status: 401 });
  }

  const { code } = await params;
  const league = await updateLeague(code, (l) => {
    if (!l.members.includes(user.username)) l.members.push(user.username);
  });
  if (!league) {
    return NextResponse.json({ error: "League not found — check the invite code" }, { status: 404 });
  }
  return NextResponse.json({ league });
}
