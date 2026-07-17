import { createHash } from "crypto";
import type { Document } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";
import type { Difficulty, Question, QuizType, Sport } from "./types";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type QuestionBody = DistributiveOmit<Question, "id" | "source">;

export interface QuestionDoc extends Document {
  _id: string;
  sport: Sport;
  difficulty: Difficulty;
  quizType: QuizType;
  /** Stable key used for exclude / de-dupe (prompt, statement, fixture, or answer). */
  excludeKey: string;
  body: QuestionBody;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function questionExcludeKey(q: {
  quizType: QuizType;
  prompt?: string;
  statement?: string;
  fixture?: string;
  answer?: string;
}): string {
  switch (q.quizType) {
    case "multiple-choice":
    case "timeline":
      return (q.prompt ?? "").toLowerCase();
    case "true-false":
      return (q.statement ?? "").toLowerCase();
    case "guess-score":
      return (q.fixture ?? "").toLowerCase();
    case "guess-player":
      return (q.answer ?? "").toLowerCase();
  }
}

export function questionDocId(sport: Sport, difficulty: Difficulty, excludeKey: string): string {
  return createHash("sha256").update(`${sport}|${difficulty}|${excludeKey}`).digest("hex").slice(0, 24);
}

async function questions() {
  return (await getDb()).collection<QuestionDoc>("questions");
}

/**
 * Pick a curated question from MongoDB. Returns null if Mongo isn't configured
 * or the questions collection is empty / has no match for this sport.
 */
export async function pickFromMongo(
  sport: Sport,
  difficulty: Difficulty,
  quizType?: QuizType,
  exclude: string[] = []
): Promise<Question | null> {
  if (!(await isMongoConfigured())) return null;

  try {
    const col = await questions();
    const excluded = exclude.map((e) => e.toLowerCase());

    const filters: Record<string, unknown>[] = [
      { sport, difficulty, ...(quizType ? { quizType } : {}), ...(excluded.length ? { excludeKey: { $nin: excluded } } : {}) },
      { sport, difficulty, ...(quizType ? { quizType } : {}) },
      { sport, ...(quizType ? { quizType } : {}), ...(excluded.length ? { excludeKey: { $nin: excluded } } : {}) },
      { sport, ...(quizType ? { quizType } : {}) },
      { sport },
    ];

    for (const filter of filters) {
      const pool = await col.find(filter).limit(80).toArray();
      if (pool.length === 0) continue;
      const chosen = shuffle(pool)[0];
      return {
        ...chosen.body,
        id: crypto.randomUUID(),
        source: "bank",
      } as Question;
    }
    return null;
  } catch (err) {
    console.error("Mongo question pick failed:", err);
    return null;
  }
}

export async function hasMongoQuestions(sport?: Sport): Promise<boolean> {
  if (!(await isMongoConfigured())) return false;
  try {
    const col = await questions();
    const count = await col.countDocuments(sport ? { sport } : {}, { limit: 1 });
    return count > 0;
  } catch {
    return false;
  }
}
