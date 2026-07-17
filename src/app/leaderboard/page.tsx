"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CrownSimpleIcon, TrophyIcon } from "@phosphor-icons/react/ssr";

interface Row {
  username: string;
  bestScore: number;
  games: number;
  xp: number;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"all" | "week">("week");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: "all" | "week") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${p}`);
      const data = (await res.json()) as { rows: Row[] };
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(period);
  }, [period, load]);

  return (
    <main className="relative z-10 flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="animate-rise">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-mute">Compete</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-paper">Global leaderboard</h1>
          <p className="mt-2 text-mute">Best single-game scores across SportIQ.</p>
        </header>

        <div className="flex gap-2">
          {(
            [
              ["week", "This week"],
              ["all", "All time"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`pressable focus-ring rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
                period === id ? "bg-brand text-accent-ink" : "border border-border bg-surface text-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="surface overflow-hidden rounded-3xl">
          {loading ? (
            <div className="space-y-3 p-6">
              <div className="h-10 animate-pulse-soft rounded-xl bg-surface-2" />
              <div className="h-10 animate-pulse-soft rounded-xl bg-surface-2" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-mute">
              No scores yet.{" "}
              <Link href="/" className="font-semibold text-accent hover:underline">
                Play a round
              </Link>{" "}
              to climb the board.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {rows.map((row, i) => (
                <li key={row.username} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 font-mono text-sm font-bold text-mute">
                      {i === 0 ? <CrownSimpleIcon size={16} weight="fill" className="text-peach" /> : i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-paper">{row.username}</p>
                      <p className="text-xs text-faint">
                        {row.games} game{row.games === 1 ? "" : "s"} · {row.xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-paper">{row.bestScore.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <Link
          href="/"
          className="pressable focus-ring inline-flex items-center gap-2 self-start rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-paper"
        >
          <TrophyIcon size={16} weight="fill" className="text-brand" />
          Back to quiz
        </Link>
      </div>
    </main>
  );
}
