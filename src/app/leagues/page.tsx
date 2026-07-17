"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRightIcon, PlusIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { useAuth } from "@/components/AuthProvider";
import type { LeagueRecord } from "@/lib/models";

export default function LeaguesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [leagues, setLeagues] = useState<LeagueRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadLeagues = useCallback(async () => {
    const res = await fetch("/api/leagues");
    const data = (await res.json()) as { leagues: LeagueRecord[] };
    setLeagues(data.leagues);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/leagues");
      return;
    }
    // Initial sync with the server (external system) once we know who's signed in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadLeagues();
  }, [loading, user, router, loadLeagues]);

  async function createLeague(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json()) as { league?: LeagueRecord; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create league");
      setName("");
      router.push(`/leagues/${data.league!.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function joinLeague(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/leagues/${joinCode.trim().toUpperCase()}/join`, { method: "POST" });
      const data = (await res.json()) as { league?: LeagueRecord; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not join league");
      router.push(`/leagues/${data.league!.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="relative z-10 flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="animate-rise">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
            <UsersThreeIcon size={14} weight="fill" className="text-lavender" />
            Private leagues
          </div>
          <h1 className="font-display text-3xl font-semibold text-paper">Play together, climb together.</h1>
          <p className="mt-1.5 max-w-lg text-mute">
            Create a private league, share the invite link, and compete on a shared leaderboard.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 animate-rise" style={{ animationDelay: "0.06s" }}>
          <form onSubmit={createLeague} className="surface flex flex-col gap-3 rounded-2xl p-5">
            <span className="text-sm font-semibold text-paper">Create a league</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Office Champions"
              className="focus-ring rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="brand-shimmer focus-ring inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <PlusIcon size={15} weight="bold" />
              Create league
            </button>
          </form>
          <form onSubmit={joinLeague} className="surface flex flex-col gap-3 rounded-2xl p-5">
            <span className="text-sm font-semibold text-paper">Join with an invite code</span>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB12CD"
              className="focus-ring rounded-xl border border-border bg-surface-2 px-4 py-2.5 font-mono uppercase text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-accent/40 disabled:opacity-50"
            >
              Join league
              <ArrowRightIcon size={14} weight="bold" className="text-brand" />
            </button>
          </form>
        </section>

        {error && (
          <p className="rounded-xl border border-hard/40 bg-hard/10 px-4 py-3 text-sm text-hard">{error}</p>
        )}

        <section className="animate-rise" style={{ animationDelay: "0.1s" }}>
          <h2 className="mb-4 text-lg font-semibold text-paper">Your leagues</h2>
          {fetching ? (
            <span className="block h-16 animate-pulse-soft rounded-2xl bg-surface-2" />
          ) : leagues.length === 0 ? (
            <div className="surface rounded-2xl p-6 text-center text-sm text-mute">
              You haven&apos;t joined a league yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {leagues.map((l) => (
                <Link
                  key={l.code}
                  href={`/leagues/${l.code}`}
                  className="card-interactive focus-ring flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4"
                >
                  <div>
                    <p className="font-display font-semibold text-paper">{l.name}</p>
                    <p className="text-xs text-faint">
                      {l.members.length} member{l.members.length === 1 ? "" : "s"} · code {l.code}
                    </p>
                  </div>
                  <ArrowRightIcon size={16} weight="bold" className="text-peach" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
