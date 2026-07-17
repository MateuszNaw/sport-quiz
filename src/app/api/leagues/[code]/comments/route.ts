import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateLeague } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, 280);
  if (!text) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const { code } = await params;
  const league = await updateLeague(code, (l) => {
    l.comments.push({
      id: crypto.randomUUID(),
      author: user.username,
      text,
      createdAt: new Date().toISOString(),
    });
  });
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }
  return NextResponse.json({ league });
}
