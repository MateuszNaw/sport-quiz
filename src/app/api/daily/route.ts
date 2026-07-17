import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildDailyQuestions } from "@/lib/daily";
import { utcDateString } from "@/lib/week";

export const runtime = "nodejs";

/** GET /api/daily — today's fixed challenge set. */
export async function GET() {
  const date = utcDateString();
  const user = await getSessionUser();
  const alreadyPlayed = Boolean(user?.stats.lastDailyDate === date);
  const pack = await buildDailyQuestions(date);
  return NextResponse.json({ ...pack, alreadyPlayed, length: pack.questions.length });
}
