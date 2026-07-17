import { NextResponse } from "next/server";
import { ACHIEVEMENTS, evaluateAchievements } from "@/lib/achievements";
import { getSessionUser } from "@/lib/auth";
import type { HistoryEntry, RoundPayload } from "@/lib/models";
import { recordChallenge, recordGlobalScore, toPublicUser, updateUser } from "@/lib/store";
import { DIFFICULTIES, QUIZ_TYPES, SPORTS, type Difficulty } from "@/lib/types";
import { xpFromScore } from "@/lib/xp";
import { isoWeekId } from "@/lib/week";

export const runtime = "nodejs";

interface ResultsPayload {
  difficulty: Difficulty;
  score: number;
  rounds: RoundPayload[];
  mode?: "standard" | "daily" | "endless";
  challenge?: {
    fromUsername: string;
    challengeScore: number;
  };
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

  const mode = body.mode ?? "standard";
  const today = new Date().toISOString().slice(0, 10);

  if (mode === "daily" && user.stats.lastDailyDate === today) {
    return NextResponse.json({
      user: toPublicUser(user),
      newlyUnlocked: [],
      totalAchievements: ACHIEVEMENTS.length,
      alreadyPlayedDaily: true,
    });
  }

  let bestStreakThisGame = 0;
  let runningStreak = 0;
  let timelinePerfect = 0;
  let speedBonuses = 0;
  for (const r of rounds) {
    if (r.correct) {
      runningStreak += 1;
      bestStreakThisGame = Math.max(bestStreakThisGame, runningStreak);
    } else {
      runningStreak = 0;
    }
    if (r.quizType === "timeline" && r.credit >= 1) timelinePerfect += 1;
    if (r.speedBonus) speedBonuses += 1;
  }
  const correctCount = rounds.filter((r) => r.correct).length;
  const allCorrect = correctCount === rounds.length;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const xpGain = xpFromScore(body.score);

  let newlyUnlocked: ReturnType<typeof evaluateAchievements> = [];
  let challengeResult: { won: boolean } | null = null;

  const updated = await updateUser(user.username, (u) => {
    const s = u.stats;
    s.gamesPlayed += 1;
    s.questionsAnswered += rounds.length;
    s.correctAnswers += correctCount;
    s.totalScore += body.score;
    s.xp = (s.xp ?? 0) + xpGain;
    s.bestAnswerStreak = Math.max(s.bestAnswerStreak, bestStreakThisGame);
    if (allCorrect) s.perfectRounds += 1;
    s.timelinePerfectCount += timelinePerfect;
    s.speedBonusCount = (s.speedBonusCount ?? 0) + speedBonuses;

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
    if (mode === "daily") s.lastDailyDate = today;

    if (body.challenge?.fromUsername) {
      const won = body.score > body.challenge.challengeScore;
      s.challengesPlayed = (s.challengesPlayed ?? 0) + 1;
      if (won) s.challengesWon = (s.challengesWon ?? 0) + 1;
      challengeResult = { won };
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
      mode,
    };
    u.history = [entry, ...u.history].slice(0, 50);
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await recordGlobalScore({
      username: user.username,
      score: body.score,
      difficulty: body.difficulty,
      date: new Date().toISOString(),
      weekId: isoWeekId(),
      mode: mode === "endless" ? "endless" : mode === "daily" ? "daily" : "standard",
    });
  } catch (err) {
    console.error("global score write failed", err);
  }

  if (body.challenge?.fromUsername && challengeResult) {
    try {
      await recordChallenge({
        fromUsername: body.challenge.fromUsername,
        toUsername: user.username,
        challengeScore: body.challenge.challengeScore,
        attemptScore: body.score,
        difficulty: body.difficulty,
        won: (challengeResult as { won: boolean }).won,
        date: new Date().toISOString(),
      });
    } catch (err) {
      console.error("challenge write failed", err);
    }
  }

  return NextResponse.json({
    user: toPublicUser(updated),
    newlyUnlocked: newlyUnlocked.map((a) => ({ id: a.id, label: a.label, description: a.description })),
    totalAchievements: ACHIEVEMENTS.length,
    challenge: challengeResult,
  });
}
