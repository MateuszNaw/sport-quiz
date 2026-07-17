import { NextResponse } from "next/server";
import { getGlobalLeaderboard } from "@/lib/store";

export const runtime = "nodejs";

/** GET /api/leaderboard?period=all|week */
export async function GET(req: Request) {
  const period = new URL(req.url).searchParams.get("period") === "week" ? "week" : "all";
  const rows = await getGlobalLeaderboard(period, 30);
  return NextResponse.json({ period, rows });
}
