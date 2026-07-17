"use client";

import { useMemo, useState } from "react";
import {
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  EyeIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";
import type {
  GuessPlayerQuestion,
  GuessScoreQuestion,
  MultipleChoiceQuestion,
  PredictionQuestion,
  TimelineQuestion,
  TrueFalseQuestion,
} from "@/lib/types";

/** Result reported back to the game loop when the user locks in an answer. */
export interface AnswerResult {
  correct: boolean;
  /** 0-1 credit multiplier (partial credit for score/timeline/clues). */
  credit: number;
  /** Human-readable description of what the user answered. */
  userAnswer: string;
  hintUsed?: boolean;
}

const optionBase =
  "w-full rounded-xl border px-5 py-4 text-left text-base font-medium transition-all disabled:cursor-default";
const optionIdle =
  "border-border bg-surface-2 text-paper hover:border-accent/50 hover:bg-accent/10 cursor-pointer";
const optionCorrect = "border-easy bg-easy/15 text-easy";
const optionWrong = "border-hard bg-hard/15 text-hard animate-shake";
const optionDim = "border-border-soft bg-surface text-faint";

export function MultipleChoice({
  question,
  onAnswer,
  allowHint = true,
}: {
  question: MultipleChoiceQuestion;
  onAnswer: (r: AnswerResult) => void;
  allowHint?: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const answered = picked !== null;

  function useFiftyFifty() {
    if (answered || hintUsed) return;
    const wrong = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correctIndex);
    const shuffle = [...wrong].sort(() => Math.random() - 0.5);
    setHidden(shuffle.slice(0, 2));
    setHintUsed(true);
  }

  function pick(i: number) {
    if (answered || hidden.includes(i)) return;
    setPicked(i);
    const correct = i === question.correctIndex;
    const credit = correct ? (hintUsed ? 0.75 : 1) : 0;
    onAnswer({
      correct,
      credit,
      userAnswer: question.options[i],
      hintUsed,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">
        {question.prompt}
      </h2>
      {allowHint && !answered && (
        <button
          type="button"
          onClick={useFiftyFifty}
          disabled={hintUsed}
          className="pressable focus-ring inline-flex items-center gap-1.5 self-start rounded-2xl border border-border px-3.5 py-2 text-xs font-semibold text-mute transition-colors hover:bg-surface-2 disabled:opacity-40"
        >
          50/50 hint (−25% if correct)
        </button>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          if (hidden.includes(i) && !answered) {
            return (
              <div key={i} className={`${optionBase} ${optionDim} opacity-40 line-through`}>
                <span className="mr-2 font-mono font-bold text-faint">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </div>
            );
          }
          let cls = optionIdle;
          if (answered) {
            if (i === question.correctIndex) cls = optionCorrect;
            else if (i === picked) cls = optionWrong;
            else cls = optionDim;
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`focus-ring ${optionBase} ${cls}`}
            >
              <span className="mr-2 font-mono font-bold text-faint">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TrueFalse({
  question,
  onAnswer,
}: {
  question: TrueFalseQuestion;
  onAnswer: (r: AnswerResult) => void;
}) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const answered = picked !== null;

  function pick(v: boolean) {
    if (answered) return;
    setPicked(v);
    onAnswer({
      correct: v === question.answer,
      credit: v === question.answer ? 1 : 0,
      userAnswer: v ? "True" : "False",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">
        {question.statement}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {([true, false] as const).map((v) => {
          let cls = optionIdle;
          if (answered) {
            if (v === question.answer) cls = optionCorrect;
            else if (v === picked) cls = optionWrong;
            else cls = optionDim;
          }
          return (
            <button
              key={String(v)}
              disabled={answered}
              onClick={() => pick(v)}
              className={`focus-ring ${optionBase} ${cls} flex items-center justify-center gap-2 text-center text-lg`}
            >
              {v ? <CheckIcon size={18} weight="bold" /> : <XIcon size={18} weight="bold" />}
              {v ? "True" : "False"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GuessScore({
  question,
  onAnswer,
}: {
  question: GuessScoreQuestion;
  onAnswer: (r: AnswerResult) => void;
}) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (submitted || home === "" || away === "") return;
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    setSubmitted(true);
    const exact = h === question.homeScore && a === question.awayScore;
    const realOutcome = Math.sign(question.homeScore - question.awayScore);
    const rightOutcome = Math.sign(h - a) === realOutcome;
    onAnswer({
      correct: exact,
      credit: exact ? 1 : rightOutcome ? 0.4 : 0,
      userAnswer: `${h}-${a}`,
    });
  }

  const inputCls =
    "w-20 rounded-xl border border-border bg-surface-2 py-3 text-center font-mono text-2xl font-bold text-paper outline-none transition-colors focus:border-accent/60 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-sm font-medium text-accent">Guess the score</p>
        <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">
          {question.fixture}
        </h2>
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <span className="max-w-32 text-right text-base font-semibold text-paper sm:max-w-none">
          {question.homeTeam}
        </span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={home}
          disabled={submitted}
          onChange={(e) => setHome(e.target.value)}
          className={`focus-ring ${inputCls}`}
          aria-label={`${question.homeTeam} score`}
        />
        <span className="text-xl text-faint">-</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={away}
          disabled={submitted}
          onChange={(e) => setAway(e.target.value)}
          className={`focus-ring ${inputCls}`}
          aria-label={`${question.awayTeam} score`}
        />
        <span className="max-w-32 text-base font-semibold text-paper sm:max-w-none">
          {question.awayTeam}
        </span>
      </div>
      {submitted ? (
        <p className="text-center font-mono text-lg font-bold text-paper animate-pop">
          Final score: {question.homeScore}-{question.awayScore}
        </p>
      ) : (
        <button
          onClick={submit}
          disabled={home === "" || away === ""}
          className="brand-shimmer focus-ring mx-auto rounded-full px-8 py-3 font-semibold text-accent-ink transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:animate-none disabled:bg-accent/40"
        >
          Lock in score
        </button>
      )}
      <p className="text-center text-xs text-faint">
        Exact score earns full points. Correct winner or draw earns 40%.
      </p>
    </div>
  );
}

export function GuessPlayer({
  question,
  onAnswer,
}: {
  question: GuessPlayerQuestion;
  onAnswer: (r: AnswerResult) => void;
}) {
  const [revealed, setRevealed] = useState(1);
  const [guess, setGuess] = useState("");
  const [done, setDone] = useState(false);

  // Fewer clues used = more credit: 1 clue → 100%, each extra −20%, floor 40%.
  const credit = Math.max(0.4, 1 - (revealed - 1) * 0.2);

  function submit() {
    if (done || guess.trim() === "") return;
    setDone(true);
    const normalized = guess.trim().toLowerCase();
    const correct = question.acceptableAnswers.some((a) => a === normalized);
    onAnswer({ correct, credit: correct ? credit : 0, userAnswer: guess.trim() });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-sm font-medium text-accent">Guess the player</p>
        <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">Who is this?</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {question.clues.slice(0, revealed).map((clue, i) => (
          <li
            key={i}
            className="rounded-xl border border-border-soft bg-surface-2 px-4 py-3 text-paper animate-rise"
          >
            <span className="mr-2 font-mono text-xs font-semibold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            {clue}
          </li>
        ))}
      </ul>
      {!done && revealed < question.clues.length && (
        <button
          onClick={() => setRevealed((r) => r + 1)}
          className="focus-ring inline-flex items-center gap-1.5 self-start rounded-full border border-border px-4 py-2 text-sm text-mute transition-colors hover:border-accent/50 hover:text-accent"
        >
          <EyeIcon size={15} />
          Reveal next clue (-20% points)
        </button>
      )}
      <div className="flex gap-3">
        <input
          type="text"
          value={guess}
          disabled={done}
          placeholder="Type the player's name"
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="focus-ring flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60 disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={done || guess.trim() === ""}
          className="brand-shimmer focus-ring rounded-xl px-6 py-3 font-semibold text-accent-ink transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:animate-none disabled:bg-accent/40"
        >
          Guess
        </button>
      </div>
      {done && (
        <p className="text-center text-lg font-bold text-paper animate-pop">
          The answer: {question.answer}
        </p>
      )}
      <p className="text-xs text-faint">
        Current potential: {Math.round(credit * 100)}% of full points
      </p>
    </div>
  );
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Guard against an accidental already-correct shuffle.
  if (a.every((v, i) => v === arr[i]) && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

export function Timeline({
  question,
  onAnswer,
}: {
  question: TimelineQuestion;
  onAnswer: (r: AnswerResult) => void;
}) {
  const initial = useMemo(() => shuffled(question.events), [question.events]);
  const [order, setOrder] = useState(initial);
  const [submitted, setSubmitted] = useState(false);

  function move(i: number, dir: -1 | 1) {
    if (submitted) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  }

  function submit() {
    if (submitted) return;
    setSubmitted(true);
    const correctCount = order.filter((e, i) => e === question.events[i]).length;
    const credit = correctCount / question.events.length;
    onAnswer({
      correct: credit === 1,
      credit,
      userAnswer: `${correctCount}/${question.events.length} in the right place`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-sm font-medium text-accent">Timeline</p>
        <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">
          {question.prompt}
        </h2>
      </div>
      <ol className="flex flex-col gap-2">
        {order.map((event, i) => {
          const correctHere = submitted && event === question.events[i];
          const wrongHere = submitted && !correctHere;
          return (
            <li
              key={event}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                correctHere
                  ? "border-easy/60 bg-easy/10"
                  : wrongHere
                    ? "border-hard/60 bg-hard/10"
                    : "border-border bg-surface-2"
              }`}
            >
              <span className="w-6 text-center font-mono font-bold text-faint">{i + 1}</span>
              <span className="flex-1 text-paper">{event}</span>
              {!submitted && (
                <span className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="focus-ring px-2 text-mute transition-colors hover:text-accent disabled:opacity-20"
                  >
                    <CaretUpIcon size={14} weight="bold" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label="Move down"
                    className="focus-ring px-2 text-mute transition-colors hover:text-accent disabled:opacity-20"
                  >
                    <CaretDownIcon size={14} weight="bold" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!submitted && (
        <button
          onClick={submit}
          className="brand-shimmer focus-ring mx-auto rounded-full px-8 py-3 font-semibold text-accent-ink transition-transform active:scale-[0.98]"
        >
          Lock in order
        </button>
      )}
      <p className="text-center text-xs text-faint">
        Partial credit for each event in the right position
      </p>
    </div>
  );
}

export function Prediction({
  question,
  onAnswer,
}: {
  question: PredictionQuestion;
  onAnswer: (r: AnswerResult) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    onAnswer({
      correct: i === question.correctIndex,
      credit: i === question.correctIndex ? 1 : 0,
      userAnswer: question.options[i],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-sm font-medium text-peach">What happens next?</p>
        <p className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm leading-relaxed text-mute">
          {question.scenario}
        </p>
      </div>
      <h2 className="font-display text-xl font-semibold text-paper sm:text-2xl">{question.prompt}</h2>
      <div className="grid gap-3">
        {question.options.map((opt, i) => {
          let cls = optionIdle;
          if (answered) {
            if (i === question.correctIndex) cls = optionCorrect;
            else if (i === picked) cls = optionWrong;
            else cls = optionDim;
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`focus-ring ${optionBase} ${cls}`}
            >
              <span className="mr-2 font-mono font-bold text-faint">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
