"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  CopySimpleIcon,
  CrownSimpleIcon,
  PaperPlaneTiltIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { useAuth } from "@/components/AuthProvider";
import { computeLeaderboard, type LeagueRecord } from "@/lib/models";
import { DIFFICULTY_META } from "@/lib/sports";
import type { Difficulty } from "@/lib/types";

const REACTIONS = ["🔥", "👏", "😮", "💪"];
const LAST_RESULT_KEY = "sportiq:lastResult";

interface LastResult {
  score: number;
  difficulty: Difficulty;
}

export default function LeagueDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [league, setLeague] = useState<LeagueRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/leagues/${code}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = (await res.json()) as { league: LeagueRecord };
    setLeague(data.league);
  }, [code]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=/leagues/${code}`);
      return;
    }
    // Initial sync with the server (external system) once we know who's signed in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load();
  }, [loading, user, router, load, code]);

  useEffect(() => {
    // One-time read of a client-only external store (localStorage) on mount.
    try {
      const raw = window.localStorage.getItem(LAST_RESULT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLastResult(JSON.parse(raw) as LastResult);
    } catch {
      // ignore
    }
  }, []);

  const leaderboard = useMemo(() => (league ? computeLeaderboard(league) : []), [league]);
  const isMember = league && user ? league.members.includes(user.username) : false;

  async function join() {
    setBusy(true);
    try {
      const res = await fetch(`/api/leagues/${code}/join`, { method: "POST" });
      const data = (await res.json()) as { league?: LeagueRecord };
      if (data.league) setLeague(data.league);
    } finally {
      setBusy(false);
    }
  }

  async function postLastResult() {
    if (!lastResult) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/leagues/${code}/score`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(lastResult),
      });
      const data = (await res.json()) as { league?: LeagueRecord };
      if (data.league) setLeague(data.league);
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/leagues/${code}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: comment.trim() }),
      });
      const data = (await res.json()) as { league?: LeagueRecord };
      if (data.league) setLeague(data.league);
      setComment("");
    } finally {
      setBusy(false);
    }
  }

  async function toggleReaction(targetUsername: string, emoji: string) {
    const res = await fetch(`/api/leagues/${code}/reactions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUsername, emoji }),
    });
    const data = (await res.json()) as { league?: LeagueRecord };
    if (data.league) setLeague(data.league);
  }

  function copyInviteLink() {
    const url = `${window.location.origin}/leagues/${code}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading || !user) return null;

  if (notFound) {
    return (
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-paper">League not found</p>
        <Link href="/leagues" className="focus-ring font-semibold text-accent hover:underline">
          Back to leagues
        </Link>
      </main>
    );
  }

  if (!league) {
    return (
      <main className="relative z-10 flex-1 px-6 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <span className="block h-40 animate-pulse-soft rounded-2xl bg-surface-2" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <Link href="/leagues" className="focus-ring inline-flex items-center gap-1.5 self-start text-sm font-semibold text-mute hover:text-accent">
          <ArrowLeftIcon size={14} weight="bold" />
          All leagues
        </Link>

        <header className="animate-rise">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
            <UsersThreeIcon size={14} weight="fill" className="text-accent" />
            {league.members.length} member{league.members.length === 1 ? "" : "s"}
          </div>
          <h1 className="font-display text-3xl font-semibold text-paper">{league.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-paper transition-colors hover:border-accent/40"
            >
              {copied ? <CheckIcon size={14} weight="bold" className="text-easy" /> : <CopySimpleIcon size={14} />}
              {copied ? "Link copied" : "Copy invite link"}
            </button>
            <span className="rounded-full bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-mute">
              Code: {league.code}
            </span>
            {!isMember && (
              <button
                onClick={join}
                disabled={busy}
                className="brand-shimmer focus-ring rounded-full px-4 py-2 text-sm font-bold text-accent-ink"
              >
                Join league
              </button>
            )}
          </div>
        </header>

        {isMember && lastResult && (
          <div className="surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 animate-rise" style={{ animationDelay: "0.05s" }}>
            <p className="text-sm text-paper">
              Post your latest result —{" "}
              <span className="font-mono font-bold text-accent">{lastResult.score.toLocaleString()} pts</span> on{" "}
              <span style={{ color: DIFFICULTY_META[lastResult.difficulty].color }}>
                {DIFFICULTY_META[lastResult.difficulty].label}
              </span>
              .
            </p>
            <button
              onClick={postLastResult}
              disabled={busy}
              className="brand-shimmer focus-ring inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-60"
            >
              <PaperPlaneTiltIcon size={15} weight="bold" />
              Post to league
            </button>
          </div>
        )}

        {/* Leaderboard */}
        <section className="animate-rise" style={{ animationDelay: "0.1s" }}>
          <h2 className="mb-4 text-lg font-semibold text-paper">Leaderboard</h2>
          <div className="surface flex flex-col divide-y divide-border rounded-2xl">
            {leaderboard.map((row, i) => {
              const reactionCounts = REACTIONS.map((emoji) => ({
                emoji,
                count: league.reactions.filter((r) => r.targetUsername === row.username && r.emoji === emoji).length,
                mine: league.reactions.some(
                  (r) => r.targetUsername === row.username && r.emoji === emoji && r.author === user.username
                ),
              }));
              return (
                <div key={row.username} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          i === 0 ? "bg-cream text-paper" : "bg-surface-2 text-mute"
                        }`}
                      >
                        {i === 0 ? <CrownSimpleIcon size={16} weight="fill" /> : i + 1}
                      </span>
                      <span className="font-semibold text-paper">
                        {row.username}
                        {row.username === user.username && <span className="ml-1.5 text-xs text-faint">(you)</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-paper">{row.bestScore.toLocaleString()} pts</span>
                  </div>
                  <div className="flex gap-1.5 pl-11">
                    {reactionCounts.map(({ emoji, count, mine }) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(row.username, emoji)}
                        className={`focus-ring rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          mine ? "border-accent/50 bg-accent/10" : "border-border-soft bg-surface-2 hover:border-accent/30"
                        }`}
                      >
                        {emoji} {count > 0 && count}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Comments */}
        <section className="animate-rise" style={{ animationDelay: "0.15s" }}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-paper">
            <ChatCircleDotsIcon size={18} className="text-accent" />
            Comments
          </h2>
          <form onSubmit={submitComment} className="mb-4 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Say something to the league…"
              maxLength={280}
              className="focus-ring flex-1 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
            <button
              type="submit"
              disabled={busy || !comment.trim()}
              className="brand-shimmer focus-ring rounded-xl px-4 py-2.5 text-sm font-bold text-accent-ink disabled:opacity-50"
            >
              Post
            </button>
          </form>
          <div className="flex flex-col gap-2.5">
            {league.comments.length === 0 && <p className="text-sm text-faint">No comments yet — be the first.</p>}
            {[...league.comments].reverse().map((c) => (
              <div key={c.id} className="surface-soft rounded-xl px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-paper">{c.author}</span>
                  <span className="text-faint">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-mute">{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
