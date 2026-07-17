import Link from "next/link";
import { SwordIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { DIFFICULTY_META } from "@/lib/sports";
import { DIFFICULTIES, type Difficulty } from "@/lib/types";

export default async function ChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; score?: string; difficulty?: string; length?: string }>;
}) {
  const params = await searchParams;
  const from = (params.from || "A friend").slice(0, 40);
  const score = Number(params.score) || 0;
  const difficulty: Difficulty = DIFFICULTIES.includes(params.difficulty as Difficulty)
    ? (params.difficulty as Difficulty)
    : "medium";
  const parsedLength = Number(params.length);
  const length = Number.isFinite(parsedLength) && parsedLength >= 0 ? Math.min(parsedLength, 50) : 10;
  const meta = DIFFICULTY_META[difficulty];

  const quizHref = `/quiz?difficulty=${difficulty}&length=${length}&challengeFrom=${encodeURIComponent(
    from
  )}&challengeScore=${score}`;

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="surface w-full max-w-md rounded-3xl p-8 text-center animate-rise">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <SwordIcon size={28} weight="fill" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-mute">You&apos;ve been challenged</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-paper sm:text-3xl">
          {from} scored{" "}
          <span className="font-mono text-accent">{score.toLocaleString()}</span> pts
        </h1>
        <p className="mt-3 text-mute">
          Beat it on{" "}
          <span className="font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </span>{" "}
          difficulty, {length === 0 ? "endless mode" : `${length} questions`}.
        </p>
        <Link
          href={quizHref}
          className="brand-shimmer focus-ring mt-6 inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-accent-ink transition-transform active:scale-[0.98]"
        >
          <TrophyIcon size={18} weight="fill" />
          Accept the challenge
        </Link>
        <p className="mt-4 text-xs text-faint">
          <Link href="/" className="font-semibold text-mute hover:text-accent">
            Not now, take me home
          </Link>
        </p>
      </div>
    </main>
  );
}
