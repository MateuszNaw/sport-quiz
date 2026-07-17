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

export function questionExcludeKey(q: Question): string {
  switch (q.quizType) {
    case "multiple-choice":
    case "timeline":
    case "image-quiz":
      return q.prompt.toLowerCase();
    case "prediction":
      return `${q.scenario} ${q.prompt}`.toLowerCase();
    case "true-false":
      return q.statement.toLowerCase();
    case "guess-score":
      return q.fixture.toLowerCase();
    case "guess-player":
      return q.answer.toLowerCase();
  }
}

export function questionDocId(sport: Sport, difficulty: Difficulty, excludeKey: string): string {
  return createHash("sha256").update(`${sport}|${difficulty}|${excludeKey}`).digest("hex").slice(0, 24);
}

async function questions() {
  return (await getDb()).collection<QuestionDoc>("questions");
}

async function sampleOne(filter: Record<string, unknown>): Promise<QuestionDoc | null> {
  const col = await questions();
  // Prefer $sample when the exclude list is large — scanning 80 docs can miss
  // the remaining unseen pool. Fall back to a limited find + shuffle.
  const excluded = filter.excludeKey as { $nin?: string[] } | undefined;
  const ninSize = excluded?.$nin?.length ?? 0;

  if (ninSize > 40) {
    const pipeline = [{ $match: filter }, { $sample: { size: 1 } }];
    const rows = await col.aggregate<QuestionDoc>(pipeline).toArray();
    return rows[0] ?? null;
  }

  const pool = await col.find(filter).limit(120).toArray();
  if (pool.length === 0) return null;
  return shuffle(pool)[0];
}

/**
 * Pick a curated question from MongoDB. Prefers questions whose excludeKey is
 * not in `exclude` (session + per-user seen). Only after the unseen pool for
 * this sport is exhausted does it allow repeats.
 */
export async function pickFromMongo(
  sport: Sport,
  difficulty: Difficulty,
  quizType?: QuizType,
  exclude: string[] = []
): Promise<Question | null> {
  if (!(await isMongoConfigured())) return null;

  try {
    const excluded = [...new Set(exclude.map((e) => e.toLowerCase()).filter(Boolean))];
    const withExclude = excluded.length > 0;

    // Unseen first (tighten → relax sport/difficulty/type), then allow repeats.
    const baseFilters: Record<string, unknown>[] = [
      { sport, difficulty, ...(quizType ? { quizType } : {}) },
      { sport, difficulty },
      { sport, ...(quizType ? { quizType } : {}) },
      { sport },
    ];

    const filters: Record<string, unknown>[] = [
      ...(withExclude
        ? baseFilters.map((f) => ({ ...f, excludeKey: { $nin: excluded } }))
        : []),
      ...baseFilters,
    ];

    for (const filter of filters) {
      const chosen = await sampleOne(filter);
      if (!chosen) continue;
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
