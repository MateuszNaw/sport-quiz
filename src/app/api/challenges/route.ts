import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getChallengesForUser } from "@/lib/store";

export const runtime = "nodejs";

/** GET /api/challenges — recent challenge results for the signed-in user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const rows = await getChallengesForUser(user.username, 25);
  return NextResponse.json({ challenges: rows });
}
