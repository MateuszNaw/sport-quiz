import { NextResponse } from "next/server";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";
import { getSessionUser } from "@/lib/auth";
import type { HistoryEntry, RoundPayload } from "@/lib/models";
import { toPublicUser, updateUser } from "@/lib/store";
import { DIFFICULTIES, QUIZ_TYPES, SPORTS, type Difficulty } from "@/lib/types";

export const runtime = "nodejs";

interface ResultsPayload {
  difficulty: Difficulty;
  score: number;
  rounds: RoundPayload[];
}

function isValidRound(r: unknown): r is RoundPayload {
  if (typeof r !== "object" || r === null) return false;
  const round = r as Record<string, unknown>;
  return (
    (SPORTS as readonly string[]).includes(round.sport as string) &&
    (QUIZ_TYPES as readonly string[]).includes(round.quizType as string) &&
    typeof round.correct === "boolean" &&
    typeof round.credit === "number"
  );
}

/**
 * POST /api/results
 * Body: { difficulty, score, rounds: [{ sport, quizType, correct, credit }] }
 * Records a finished round for the signed-in user: updates aggregate stats,
 * appends a history entry, and unlocks any newly-earned achievements.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to save your progress." }, { status: 401 });
  }

  let body: ResultsPayload;
  try {
    body = (await req.json()) as ResultsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !DIFFICULTIES.includes(body.difficulty) ||
    typeof body.score !== "number" ||
    !Array.isArray(body.rounds)
  ) {
    return NextResponse.json({ error: "Invalid results payload" }, { status: 400 });
  }
  const rounds = body.rounds.filter(isValidRound);
  if (rounds.length === 0) {
    return NextResponse.json({ error: "No valid rounds to record" }, { status: 400 });
  }

  let bestStreakThisGame = 0;
  let runningStreak = 0;
  let timelinePerfect = 0;
  for (const r of rounds) {
    if (r.correct) {
      runningStreak += 1;
      bestStreakThisGame = Math.max(bestStreakThisGame, runningStreak);
    } else {
      runningStreak = 0;
    }
    if (r.quizType === "timeline" && r.credit >= 1) timelinePerfect += 1;
  }
  const correctCount = rounds.filter((r) => r.correct).length;
  const allCorrect = correctCount === rounds.length;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  let newlyUnlocked: ReturnType<typeof evaluateAchievements> = [];

  const updated = await updateUser(user.username, (u) => {
    const s = u.stats;
    s.gamesPlayed += 1;
    s.questionsAnswered += rounds.length;
    s.correctAnswers += correctCount;
    s.totalScore += body.score;
    s.bestAnswerStreak = Math.max(s.bestAnswerStreak, bestStreakThisGame);
    if (allCorrect) s.perfectRounds += 1;
    s.timelinePerfectCount += timelinePerfect;

    for (const r of rounds) {
      const sportStat = s.perSport[r.sport] ?? { correct: 0, total: 0 };
      sportStat.total += 1;
      if (r.correct) sportStat.correct += 1;
      s.perSport[r.sport] = sportStat;

      const diffStat = s.perDifficulty[body.difficulty] ?? { correct: 0, total: 0 };
      diffStat.total += 1;
      if (r.correct) diffStat.correct += 1;
      s.perDifficulty[body.difficulty] = diffStat;
    }

    if (s.lastPlayedDate !== today) {
      s.dayStreak = s.lastPlayedDate === yesterday ? s.dayStreak + 1 : 1;
      s.lastPlayedDate = today;
    }

    newlyUnlocked = evaluateAchievements(s, u.achievements);
    for (const a of newlyUnlocked) u.achievements.push(a.id);

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      difficulty: body.difficulty,
      total: rounds.length,
      correct: correctCount,
      score: body.score,
      sports: Array.from(new Set(rounds.map((r) => r.sport))),
    };
    u.history = [entry, ...u.history].slice(0, 50);
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: toPublicUser(updated),
    newlyUnlocked: newlyUnlocked.map((a) => ({ id: a.id, label: a.label, description: a.description })),
    totalAchievements: ACHIEVEMENTS.length,
  });
}
