import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { toPublicUser, updateUser } from "@/lib/store";
import { SPORTS, type Sport } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}

interface ProfilePatch {
  favoriteSport?: string | null;
  favoriteClub?: string | null;
  favoritePlayer?: string | null;
}

function isSport(value: unknown): value is Sport {
  return typeof value === "string" && (SPORTS as readonly string[]).includes(value);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update your profile" }, { status: 401 });
  }

  let body: ProfilePatch;
  try {
    body = (await req.json()) as ProfilePatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updated = await updateUser(user.username, (u) => {
    if ("favoriteSport" in body) {
      u.profile.favoriteSport = isSport(body.favoriteSport) ? body.favoriteSport : null;
    }
    if ("favoriteClub" in body) {
      u.profile.favoriteClub = body.favoriteClub?.trim() || null;
    }
    if ("favoritePlayer" in body) {
      u.profile.favoritePlayer = body.favoritePlayer?.trim() || null;
    }
  });

  return NextResponse.json({ user: updated ? toPublicUser(updated) : null });
}
