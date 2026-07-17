import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { toPublicUser } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
