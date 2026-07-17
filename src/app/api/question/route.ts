import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateWithAi, isAiConfigured } from "@/lib/generate";
import { pickFromBank } from "@/lib/questionBank";
import { pickFromMongo, questionExcludeKey } from "@/lib/questionDb";
import { pickFromStatic } from "@/lib/questionLoader";
import { markQuestionsSeen } from "@/lib/store";
import {
  DIFFICULTIES,
  QUIZ_TYPES,
  SPORTS,
  type GenerateQuestionRequest,
  type QuizType,
} from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/question
 * Body: { sport, difficulty, quizType?, exclude?: string[] }
 * Prefer MongoDB curated questions, then local JSON banks, then AI, then
 * the tiny hardcoded fallback bank.
 *
 * Signed-in users: merge their stored seenQuestions into exclude, then mark
 * the served question as seen so it won't repeat across sessions.
 */
export async function POST(req: Request) {
  let body: GenerateQuestionRequest;
  try {
    body = (await req.json()) as GenerateQuestionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sport, difficulty, exclude = [], sessionExclude = [] } = body;
  if (!SPORTS.includes(sport)) {
    return NextResponse.json(
      { error: `sport must be one of: ${SPORTS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json(
      { error: `difficulty must be one of: ${DIFFICULTIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (body.quizType !== undefined && !QUIZ_TYPES.includes(body.quizType)) {
    return NextResponse.json(
      { error: `quizType must be one of: ${QUIZ_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const quizType: QuizType =
    body.quizType ?? QUIZ_TYPES[Math.floor(Math.random() * QUIZ_TYPES.length)];

  const sessionUser = await getSessionUser();
  const seen = sessionUser?.seenQuestions ?? [];
  const mergedExclude = [...new Set([...exclude, ...seen].map((e) => e.toLowerCase()))];

  let question =
    (await pickFromMongo(sport, difficulty, quizType, mergedExclude, sessionExclude)) ??
    pickFromStatic(sport, difficulty, quizType, mergedExclude, sessionExclude);

  if (!question && isAiConfigured()) {
    try {
      question = await generateWithAi(sport, difficulty, quizType, mergedExclude);
    } catch (err) {
      console.error("AI generation failed, falling back to bank:", err);
    }
  }

  if (!question) {
    question = pickFromBank(sport, difficulty, quizType, mergedExclude, sessionExclude);
  }

  if (sessionUser) {
    const key = questionExcludeKey(question);
    if (key) {
      // Fire-and-forget would risk lost writes on cold shutdown; await is fine
      // for a single $replace of the user doc.
      await markQuestionsSeen(sessionUser.username, [key]);
    }
  }

  return NextResponse.json({ question });
}
