import { createHash } from "crypto";
import { pickFromMongo, questionExcludeKey } from "./questionDb";
import { pickFromStatic } from "./questionLoader";
import { pickFromBank } from "./questionBank";
import { DIFFICULTIES, SPORTS, type Difficulty, type Question, type Sport } from "./types";
import { utcDateString } from "./week";

const DAILY_LENGTH = 10;

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function pickSeeded<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

/**
 * Build today's fixed daily challenge set (deterministic for a UTC date).
 * Uses Mongo bank when available, then static / hardcoded fallbacks.
 */
export async function buildDailyQuestions(date = utcDateString()): Promise<{
  date: string;
  difficulty: Difficulty;
  questions: Question[];
}> {
  const rand = seededRandom(date);
  const difficulty: Difficulty = pickSeeded([...DIFFICULTIES], rand);
  const questions: Question[] = [];
  const exclude: string[] = [];

  for (let i = 0; i < DAILY_LENGTH; i++) {
    const sport = pickSeeded([...SPORTS], rand) as Sport;
    let q =
      (await pickFromMongo(sport, difficulty, undefined, exclude)) ??
      pickFromStatic(sport, difficulty, undefined, exclude) ??
      pickFromBank(sport, difficulty, undefined, exclude);

    // Stabilize id from date+index so clients can resume consistently.
    const key = questionExcludeKey(q);
    q = {
      ...q,
      id: createHash("sha256").update(`${date}:${i}:${key}`).digest("hex").slice(0, 16),
      difficulty,
    };
    exclude.push(key);
    questions.push(q);
  }

  return { date, difficulty, questions };
}

export { DAILY_LENGTH };
