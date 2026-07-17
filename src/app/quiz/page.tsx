import QuizGame from "@/components/QuizGame";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{
    difficulty?: string;
    length?: string;
    challengeFrom?: string;
    challengeScore?: string;
  }>;
}) {
  const params = await searchParams;
  const difficulty: Difficulty = DIFFICULTIES.includes(params.difficulty as Difficulty)
    ? (params.difficulty as Difficulty)
    : "medium";
  const parsed = Number(params.length);
  const length = Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 50) : 10;
  const challengeScore = Number(params.challengeScore);

  return (
    <QuizGame
      difficulty={difficulty}
      length={length}
      challengeFrom={params.challengeFrom}
      challengeScore={params.challengeFrom && Number.isFinite(challengeScore) ? challengeScore : undefined}
    />
  );
}
