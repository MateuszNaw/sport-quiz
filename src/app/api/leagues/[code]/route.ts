import { NextResponse } from "next/server";
import { getLeague } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const league = await getLeague(code);
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  return NextResponse.json({ league });
}
