import type { Difficulty, Question, QuizType, Sport } from "./types";

// Static, pre-written question sets. Each file lives at
// src/data/questions/<sport>-<difficulty>.json and holds an array of
// question objects (same shape as the AI schema, minus id/sport/difficulty/source).
// Plain `Omit` collapses a discriminated union down to its common keys, which
// would erase the per-quizType fields (prompt/options/clues/...). Distribute
// it over each union member instead so StaticEntry keeps its shape.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type StaticEntry = DistributiveOmit<Question, "id" | "sport" | "difficulty" | "source">;

// Statically imported so Next.js bundles them at build time (works in both
// the Node.js and edge runtimes, unlike fs.readFile).
import footballEasy from "@/data/questions/football-easy.json";
import footballMedium from "@/data/questions/football-medium.json";
import footballHard from "@/data/questions/football-hard.json";
import basketballEasy from "@/data/questions/basketball-easy.json";
import basketballMedium from "@/data/questions/basketball-medium.json";
import basketballHard from "@/data/questions/basketball-hard.json";
import tennisEasy from "@/data/questions/tennis-easy.json";
import tennisMedium from "@/data/questions/tennis-medium.json";
import tennisHard from "@/data/questions/tennis-hard.json";
import baseballEasy from "@/data/questions/baseball-easy.json";
import baseballMedium from "@/data/questions/baseball-medium.json";
import baseballHard from "@/data/questions/baseball-hard.json";
import hockeyEasy from "@/data/questions/hockey-easy.json";
import hockeyMedium from "@/data/questions/hockey-medium.json";

type Bucket = Partial<Record<Sport, Partial<Record<Difficulty, StaticEntry[]>>>>;

const STATIC_QUESTIONS: Bucket = {
  football: {
    easy: footballEasy as StaticEntry[],
    medium: footballMedium as StaticEntry[],
    hard: footballHard as StaticEntry[],
  },
  basketball: {
    easy: basketballEasy as StaticEntry[],
    medium: basketballMedium as StaticEntry[],
    hard: basketballHard as StaticEntry[],
  },
  tennis: {
    easy: tennisEasy as StaticEntry[],
    medium: tennisMedium as StaticEntry[],
    hard: tennisHard as StaticEntry[],
  },
  baseball: {
    easy: baseballEasy as StaticEntry[],
    medium: baseballMedium as StaticEntry[],
    hard: baseballHard as StaticEntry[],
  },
  hockey: {
    easy: hockeyEasy as StaticEntry[],
    medium: hockeyMedium as StaticEntry[],
    // no hard set yet — pickFromStatic falls back to easier difficulties, then null
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function entryKey(q: StaticEntry): string {
  switch (q.quizType) {
    case "multiple-choice":
    case "timeline":
    case "image-quiz":
      return q.prompt;
    case "prediction":
      return `${q.scenario} ${q.prompt}`;
    case "true-false":
      return q.statement;
    case "guess-score":
      return q.fixture;
    case "guess-player":
      return q.answer;
  }
}

/**
 * Pick a question from the pre-written static banks for this sport, if any
 * exist. Returns null if we have no static set for this sport at all, so
 * the caller can fall back to AI generation or the small hardcoded bank.
 */
export function pickFromStatic(
  sport: Sport,
  difficulty: Difficulty,
  quizType?: QuizType,
  exclude: string[] = []
): Question | null {
  const bySport = STATIC_QUESTIONS[sport];
  if (!bySport) return null;

  const excluded = new Set(exclude.map((e) => e.toLowerCase()));
  const notAsked = (q: StaticEntry) => !excluded.has(entryKey(q).toLowerCase());

  // Prefer the exact difficulty, then fall back to whichever difficulties
  // we do have a file for (so e.g. missing hockey-hard still returns
  // something instead of nothing).
  const difficultiesToTry: Difficulty[] = [
    difficulty,
    ...(["medium", "easy", "hard"] as Difficulty[]).filter((d) => d !== difficulty),
  ];
  const pools = difficultiesToTry
    .map((diff) => ({ diff, pool: bySport[diff] }))
    .filter((p): p is { diff: Difficulty; pool: StaticEntry[] } => Boolean(p.pool && p.pool.length));

  if (pools.length === 0) return null;

  // Tier 1: exact difficulty + type + not-recently-asked.
  // Tier 2: same, but relax "not recently asked" (allow repeats once we run out).
  // Tier 3: relax type too — search every difficulty pool for the sport.
  // Tier 4: give up on type matching, any difficulty, any question.
  const tiers: ((p: { diff: Difficulty; pool: StaticEntry[] }) => StaticEntry[])[] = [
    ({ diff, pool }) =>
      diff === difficulty ? pool.filter((q) => (!quizType || q.quizType === quizType) && notAsked(q)) : [],
    ({ diff, pool }) => (diff === difficulty ? pool.filter((q) => !quizType || q.quizType === quizType) : []),
    ({ pool }) => pool.filter((q) => (!quizType || q.quizType === quizType) && notAsked(q)),
    ({ pool }) => pool.filter((q) => !quizType || q.quizType === quizType),
    ({ pool }) => pool,
  ];

  for (const tier of tiers) {
    for (const p of pools) {
      const candidates = tier(p);
      if (candidates.length > 0) {
        const chosen = shuffle(candidates)[0];
        return {
          ...chosen,
          id: crypto.randomUUID(),
          sport,
          difficulty: p.diff,
          source: "bank",
        } as Question;
      }
    }
  }

  return null;
}

export function hasStaticQuestions(sport: Sport): boolean {
  return Boolean(STATIC_QUESTIONS[sport]);
}
