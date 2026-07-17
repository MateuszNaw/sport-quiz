import { NextResponse } from "next/server";
import { generateWithAi, isAiConfigured } from "@/lib/generate";
import { pickFromBank } from "@/lib/questionBank";
import { pickFromMongo } from "@/lib/questionDb";
import { pickFromStatic } from "@/lib/questionLoader";
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
 */
export async function POST(req: Request) {
  let body: GenerateQuestionRequest;
  try {
    body = (await req.json()) as GenerateQuestionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sport, difficulty, exclude = [] } = body;
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

  const mongoQuestion = await pickFromMongo(sport, difficulty, quizType, exclude);
  if (mongoQuestion) {
    return NextResponse.json({ question: mongoQuestion });
  }

  const staticQuestion = pickFromStatic(sport, difficulty, quizType, exclude);
  if (staticQuestion) {
    return NextResponse.json({ question: staticQuestion });
  }

  if (isAiConfigured()) {
    try {
      const question = await generateWithAi(sport, difficulty, quizType, exclude);
      return NextResponse.json({ question });
    } catch (err) {
      console.error("AI generation failed, falling back to bank:", err);
    }
  }

  const question = pickFromBank(sport, difficulty, quizType, exclude);
  return NextResponse.json({ question });
}
