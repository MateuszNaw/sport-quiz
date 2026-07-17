"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FireIcon,
  FlagCheckeredIcon,
  GraduationCapIcon,
  LockKeyIcon,
  MedalIcon,
  ShareNetworkIcon,
  SignInIcon,
  SparkleIcon,
  SwordIcon,
  TargetIcon,
  TrophyIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react/ssr";
import { useAuth } from "./AuthProvider";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { DIFFICULTY_META, QUIZ_TYPE_META, SPORT_META } from "@/lib/sports";
import { SPORTS, type Difficulty, type Question, type QuizType, type Sport } from "@/lib/types";
import {
  GuessPlayer,
  GuessScore,
  MultipleChoice,
  Timeline,
  TrueFalse,
  type AnswerResult,
} from "./QuestionRenderers";

type Phase = "pick-category" | "loading" | "question" | "finished";

interface RoundRecord {
  sport: Sport;
  quizType: QuizType;
  correct: boolean;
  credit: number;
  points: number;
}

interface UnlockedAchievement {
  id: string;
  label: string;
  description: string;
}

const LAST_RESULT_KEY = "sportiq:lastResult";

function randomThreeSports(): Sport[] {
  const pool = [...SPORTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

function questionKey(q: Question): string {
  switch (q.quizType) {
    case "multiple-choice":
    case "timeline":
      return q.prompt;
    case "true-false":
      return q.statement;
    case "guess-score":
      return q.fixture;
    case "guess-player":
      return q.answer;
  }
}

export default function QuizGame({
  difficulty,
  length,
  challengeFrom,
  challengeScore,
}: {
  difficulty: Difficulty;
  length: number; // 0 = endless
  challengeFrom?: string;
  challengeScore?: number;
}) {
  const { user, refresh } = useAuth();
  const endless = length === 0;
  const [phase, setPhase] = useState<Phase>("pick-category");
  // Deterministic placeholder on first render (server and client must match);
  // the real random pick happens client-side once mounted, see effect below.
  const [categories, setCategories] = useState<Sport[]>(() => SPORTS.slice(0, 3));
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<(AnswerResult & { points: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UnlockedAchievement[]>([]);
  const [shareStatus, setShareStatus] = useState<"idle" | "share-copied" | "challenge-copied">("idle");
  const askedRef = useRef<string[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    // Randomize once on the client only; Math.random() during the initial
    // render would mismatch between server and client HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(randomThreeSports());
  }, []);

  const basePoints = DIFFICULTY_META[difficulty].points;
  const streakBonus = Math.min(streak, 5) * 0.1;

  const fetchQuestion = useCallback(
    async (sport: Sport) => {
      setPhase("loading");
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/question", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sport, difficulty, exclude: askedRef.current }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { question: Question };
        askedRef.current = [...askedRef.current.slice(-19), questionKey(data.question)];
        setQuestion(data.question);
        setPhase("question");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setPhase("pick-category");
      }
    },
    [difficulty]
  );

  function handleAnswer(r: AnswerResult) {
    if (!question) return;
    const multiplier = 1 + (r.correct ? streakBonus : 0);
    const points = Math.round(basePoints * r.credit * multiplier);
    setScore((s) => s + points);
    setStreak((s) => (r.correct ? s + 1 : 0));
    setHistory((h) => [
      ...h,
      { sport: question.sport, quizType: question.quizType, correct: r.correct, credit: r.credit, points },
    ]);
    setResult({ ...r, points });
  }

  function finishNow() {
    setPhase("finished");
  }

  function nextRound() {
    if (!endless && round >= length) {
      setPhase("finished");
      return;
    }
    setRound((r) => r + 1);
    setQuestion(null);
    setResult(null);
    setCategories(randomThreeSports());
    setPhase("pick-category");
  }

  // Keyboard shortcut: Enter advances after answering.
  useEffect(() => {
    if (!result) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") nextRound();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const correctCount = history.filter((h) => h.correct).length;
  const accuracy = history.length ? correctCount / history.length : 0;

  // Record the finished game: save locally for league posting, and (if
  // signed in) submit to the server to update stats/history/achievements.
  useEffect(() => {
    if (phase !== "finished" || history.length === 0 || submittedRef.current) return;
    submittedRef.current = true;

    try {
      window.localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ score, difficulty }));
    } catch {
      // ignore
    }

    if (!user) return;

    (async () => {
      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            difficulty,
            score,
            rounds: history.map((h) => ({
              sport: h.sport,
              quizType: h.quizType,
              correct: h.correct,
              credit: h.credit,
            })),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { newlyUnlocked?: UnlockedAchievement[] };
        setNewlyUnlocked(data.newlyUnlocked ?? []);
        await refresh();
      } catch {
        // best-effort — a failed save shouldn't block the results screen
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function resetGame() {
    setRound(1);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setNewlyUnlocked([]);
    submittedRef.current = false;
    askedRef.current = [];
    setCategories(randomThreeSports());
    setPhase("pick-category");
  }

  async function shareScore() {
    const text = `I scored ${score.toLocaleString()} pts on SportIQ (${DIFFICULTY_META[difficulty].label} difficulty)! 🏆`;
    const shareData = { title: "SportIQ", text, url: typeof window !== "undefined" ? window.location.origin : undefined };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareData.url ?? ""}`.trim());
      setShareStatus("share-copied");
      setTimeout(() => setShareStatus("idle"), 1800);
    } catch {
      // ignore
    }
  }

  async function challengeFriend() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/challenge?from=${encodeURIComponent(user?.username ?? "A friend")}&score=${score}&difficulty=${difficulty}&length=${length}`;
    const shareData = { title: "Beat my SportIQ score!", text: `Can you beat my score of ${score} pts?`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("challenge-copied");
      setTimeout(() => setShareStatus("idle"), 1800);
    } catch {
      // ignore
    }
  }

  const beatChallenge = challengeScore !== undefined ? score > challengeScore : null;

  return (
    <main className="relative z-10 flex flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6">
        {/* HUD */}
        <div className="hud-glass sticky top-4 z-20 flex items-center justify-between rounded-2xl px-5 py-3 text-sm">
          <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg font-display font-semibold text-paper transition-colors hover:text-accent">
            <TrophyIcon size={16} weight="fill" className="text-accent" />
            SportIQ
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden text-mute sm:inline">
              {endless ? `Round ${round}` : `${Math.min(round, length)} / ${length}`}
            </span>
            <span className="font-semibold" style={{ color: DIFFICULTY_META[difficulty].color }}>
              {DIFFICULTY_META[difficulty].label}
            </span>
            {streak >= 2 && (
              <span className="flex items-center gap-1 font-semibold text-[#e8752e] animate-pop">
                <FireIcon size={15} weight="fill" />
                {streak}
              </span>
            )}
            <span className="font-mono font-bold text-paper">{score.toLocaleString()}</span>
            {endless && history.length > 0 && phase === "pick-category" && (
              <button
                onClick={finishNow}
                className="focus-ring hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-mute transition-colors hover:border-accent/40 hover:text-accent sm:inline-flex"
              >
                <FlagCheckeredIcon size={13} />
                Finish
              </button>
            )}
            <Link
              href={user ? "/profile" : "/login"}
              aria-label={user ? "Your profile" : "Sign in"}
              className="focus-ring text-mute transition-colors hover:text-accent"
            >
              {user ? <UserCircleIcon size={19} weight="fill" /> : <SignInIcon size={18} />}
            </Link>
          </div>
        </div>

        {/* Category pick */}
        {phase === "pick-category" && (
          <div className="flex flex-1 flex-col justify-center gap-6 animate-rise">
            {error && (
              <p className="rounded-xl border border-hard/40 bg-hard/10 px-4 py-3 text-sm text-hard">
                {error}. Pick a category to try again.
              </p>
            )}
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-paper">Pick your category</h2>
              <p className="mt-1.5 text-sm text-mute">
                Three random sports every round. Choose wisely.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {categories.map((s, i) => {
                const meta = SPORT_META[s];
                const SportIcon = meta.icon;
                return (
                  <button
                    key={s}
                    onClick={() => fetchQuestion(s)}
                    className="card-interactive focus-ring group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 hover:-translate-y-1 hover:bg-surface-2 hover:border-[var(--sport-color)]/45 animate-rise"
                    style={{ "--sport-color": meta.color, animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                  >
                    <SportIcon
                      size={40}
                      weight="duotone"
                      style={{ color: meta.color }}
                      className="transition-transform group-hover:scale-110"
                    />
                    <span className="font-display text-base font-semibold text-paper">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading: skeleton matching the question layout, not a spinner */}
        {phase === "loading" && (
          <div className="flex flex-1 flex-col justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-6 w-24 animate-pulse-soft rounded-full bg-surface-2" />
              <span className="h-6 w-28 animate-pulse-soft rounded-full bg-surface-2" />
            </div>
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <span className="h-6 w-3/4 animate-pulse-soft rounded-md bg-surface-2" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-14 animate-pulse-soft rounded-xl bg-surface-2"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-mute">Writing your next question</p>
          </div>
        )}

        {/* Question */}
        {phase === "question" && question && (
          <div className="flex flex-1 flex-col justify-center gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-mute">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-2 px-3 py-1">
                {(() => {
                  const SportIcon = SPORT_META[question.sport].icon;
                  return (
                    <SportIcon
                      size={13}
                      weight="duotone"
                      style={{ color: SPORT_META[question.sport].color }}
                    />
                  );
                })()}
                {SPORT_META[question.sport].label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-2 px-3 py-1">
                {(() => {
                  const TypeIcon = QUIZ_TYPE_META[question.quizType].icon;
                  return <TypeIcon size={13} className="text-accent" />;
                })()}
                {QUIZ_TYPE_META[question.quizType].label}
              </span>
              {question.source === "ai" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-accent">
                  <SparkleIcon size={13} weight="fill" />
                  AI generated
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 animate-rise">
              {question.quizType === "multiple-choice" && (
                <MultipleChoice question={question} onAnswer={handleAnswer} />
              )}
              {question.quizType === "true-false" && (
                <TrueFalse question={question} onAnswer={handleAnswer} />
              )}
              {question.quizType === "guess-score" && (
                <GuessScore question={question} onAnswer={handleAnswer} />
              )}
              {question.quizType === "guess-player" && (
                <GuessPlayer question={question} onAnswer={handleAnswer} />
              )}
              {question.quizType === "timeline" && (
                <Timeline question={question} onAnswer={handleAnswer} />
              )}
            </div>

            {/* Feedback */}
            {result && (
              <div
                className={`flex flex-col gap-3 rounded-2xl border bg-surface p-5 animate-pop ${
                  result.correct
                    ? "border-easy/40"
                    : result.points > 0
                      ? "border-medium/40"
                      : "border-hard/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-base font-semibold text-paper">
                    {result.correct ? (
                      <CheckCircleIcon size={20} weight="fill" className="text-easy" />
                    ) : result.points > 0 ? (
                      <TargetIcon size={20} weight="fill" className="text-medium" />
                    ) : (
                      <XCircleIcon size={20} weight="fill" className="text-hard" />
                    )}
                    {result.correct ? "Correct" : result.points > 0 ? "Close" : "Not quite"}
                  </span>
                  <span className={`font-mono font-bold ${result.points > 0 ? "text-accent" : "text-faint"}`}>
                    +{result.points}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-mute">{question.explanation}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-faint">Press Enter to continue</span>
                  <button
                    onClick={nextRound}
                    className="brand-shimmer focus-ring inline-flex items-center gap-1.5 self-end rounded-full px-6 py-2.5 text-sm font-bold text-accent-ink transition-transform active:scale-[0.98]"
                  >
                    {!endless && round >= length ? "See results" : "Next question"}
                    <ArrowRightIcon size={15} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finished */}
        {phase === "finished" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-rise">
            {accuracy >= 0.7 ? (
              <TrophyIcon size={56} weight="duotone" className="text-accent" />
            ) : accuracy >= 0.4 ? (
              <MedalIcon size={56} weight="duotone" className="text-medium" />
            ) : (
              <GraduationCapIcon size={56} weight="duotone" className="text-mute" />
            )}
            <div>
              <h2 className="font-display text-3xl font-semibold text-paper">Quiz complete</h2>
              <p className="mt-2 text-mute">
                You got <span className="font-semibold text-paper">{correctCount}</span> of{" "}
                {history.length} fully correct on{" "}
                <span style={{ color: DIFFICULTY_META[difficulty].color }}>
                  {DIFFICULTY_META[difficulty].label}
                </span>{" "}
                difficulty.
              </p>
            </div>
            <p className="font-mono text-4xl font-bold text-accent">{score.toLocaleString()} pts</p>

            {challengeFrom && challengeScore !== undefined && (
              <p
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  beatChallenge ? "bg-easy/10 text-easy" : "bg-medium/10 text-medium"
                }`}
              >
                {beatChallenge
                  ? `🎉 You beat ${challengeFrom}'s score of ${challengeScore.toLocaleString()}!`
                  : `${challengeFrom} is still ahead with ${challengeScore.toLocaleString()} pts — try again!`}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-1.5">
              {history.map((h, i) => {
                const SportIcon = SPORT_META[h.sport].icon;
                return (
                  <span
                    key={i}
                    title={`${SPORT_META[h.sport].label}: +${h.points}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      h.correct ? "bg-easy/15" : h.points > 0 ? "bg-medium/15" : "bg-hard/15"
                    }`}
                  >
                    <SportIcon size={16} weight="duotone" style={{ color: SPORT_META[h.sport].color }} />
                  </span>
                );
              })}
            </div>

            {newlyUnlocked.length > 0 && (
              <div className="surface w-full max-w-md rounded-2xl p-5 animate-pop">
                <p className="mb-3 text-sm font-semibold text-paper">🎉 New achievement{newlyUnlocked.length > 1 ? "s" : ""} unlocked!</p>
                <div className="flex flex-col gap-2">
                  {newlyUnlocked.map((a) => {
                    const full = ACHIEVEMENTS.find((x) => x.id === a.id);
                    const AchievementIcon = full?.icon ?? MedalIcon;
                    return (
                      <div key={a.id} className="flex items-center gap-3 rounded-xl bg-accent/10 px-3 py-2.5 text-left">
                        <AchievementIcon size={18} weight="fill" className="text-accent" />
                        <div>
                          <p className="text-sm font-semibold text-paper">{a.label}</p>
                          <p className="text-xs text-mute">{a.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!user && (
              <p className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm text-mute">
                <LockKeyIcon size={14} />
                <Link href="/login" className="font-semibold text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to save your stats and unlock achievements.
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={shareScore}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent/40"
              >
                <ShareNetworkIcon size={15} />
                {shareStatus === "share-copied" ? "Copied!" : "Share score"}
              </button>
              <button
                onClick={challengeFriend}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent/40"
              >
                <SwordIcon size={15} />
                {shareStatus === "challenge-copied" ? "Link copied!" : "Challenge a friend"}
              </button>
              {user && (
                <Link
                  href="/leagues"
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent/40"
                >
                  <MedalIcon size={15} />
                  Post to a league
                </Link>
              )}
            </div>

            <div className="mt-1 flex gap-3">
              <button
                onClick={resetGame}
                className="brand-shimmer focus-ring rounded-full px-7 py-3 font-bold text-accent-ink transition-transform active:scale-[0.98]"
              >
                Play again
              </button>
              <Link
                href="/"
                className="focus-ring rounded-full border border-border px-7 py-3 font-semibold text-paper transition-colors hover:border-accent/40"
              >
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
