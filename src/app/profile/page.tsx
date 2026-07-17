"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  FireIcon,
  LockSimpleIcon,
  MedalIcon,
  PercentIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useAuth } from "@/components/AuthProvider";
import { DIFFICULTY_META, SPORT_META } from "@/lib/sports";
import { SPORTS, type Sport } from "@/lib/types";

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card-interactive flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <span className="font-display text-2xl font-semibold text-paper">{value}</span>
      <span className="text-xs font-medium text-mute">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [favoriteSport, setFavoriteSport] = useState<Sport | "">("");
  const [favoriteClub, setFavoriteClub] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Seed the editable form fields once the external session data arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavoriteSport(user.profile.favoriteSport ?? "");
    setFavoriteClub(user.profile.favoriteClub ?? "");
    setFavoritePlayer(user.profile.favoritePlayer ?? "");
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/profile");
  }, [loading, user, router]);

  const accuracy = useMemo(() => {
    if (!user || user.stats.questionsAnswered === 0) return 0;
    return Math.round((user.stats.correctAnswers / user.stats.questionsAnswered) * 100);
  }, [user]);

  async function saveFavorites(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ favoriteSport: favoriteSport || null, favoriteClub, favoritePlayer }),
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="relative z-10 flex flex-1 flex-col px-6 py-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <span className="h-8 w-48 animate-pulse-soft rounded-full bg-surface-2" />
          <span className="h-40 w-full animate-pulse-soft rounded-2xl bg-surface-2" />
        </div>
      </main>
    );
  }

  const unlockedSet = new Set(user.achievements);
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="relative z-10 flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        {/* Header */}
        <header className="flex flex-wrap items-center gap-4 animate-rise">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-accent-ink">
            {user.username.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-paper sm:text-3xl">{user.username}</h1>
            <p className="text-sm text-mute">Playing SportIQ since {joined}</p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 animate-rise sm:grid-cols-4" style={{ animationDelay: "0.05s" }}>
          <StatCard icon={<TrophyIcon size={18} weight="fill" />} label="Games played" value={String(user.stats.gamesPlayed)} />
          <StatCard icon={<PercentIcon size={18} weight="bold" />} label="Accuracy" value={`${accuracy}%`} />
          <StatCard icon={<FireIcon size={18} weight="fill" />} label="Best answer streak" value={String(user.stats.bestAnswerStreak)} />
          <StatCard icon={<CalendarCheckIcon size={18} weight="bold" />} label="Day streak" value={String(user.stats.dayStreak)} />
        </section>

        {/* Favorites */}
        <section className="animate-rise" style={{ animationDelay: "0.1s" }}>
          <h2 className="mb-4 text-lg font-semibold text-paper">Your favorites</h2>
          <form onSubmit={saveFavorites} className="surface grid gap-4 rounded-2xl p-6 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-paper">Favorite sport</span>
              <select
                value={favoriteSport}
                onChange={(e) => setFavoriteSport(e.target.value as Sport | "")}
                className="focus-ring rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-paper outline-none transition-colors focus:border-accent/60"
              >
                <option value="">Not set</option>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {SPORT_META[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-paper">Favorite club</span>
              <input
                value={favoriteClub}
                onChange={(e) => setFavoriteClub(e.target.value)}
                placeholder="e.g. Real Madrid"
                className="focus-ring rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-paper">Favorite player</span>
              <input
                value={favoritePlayer}
                onChange={(e) => setFavoritePlayer(e.target.value)}
                placeholder="e.g. Serena Williams"
                className="focus-ring rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
              />
            </label>
            <div className="col-span-full flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="brand-shimmer focus-ring rounded-full px-6 py-2.5 text-sm font-bold text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save favorites"}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-easy animate-pop">
                  <CheckCircleIcon size={16} weight="fill" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Achievements */}
        <section className="animate-rise" style={{ animationDelay: "0.15s" }}>
          <h2 className="mb-4 flex items-center justify-between text-lg font-semibold text-paper">
            Achievements
            <span className="text-sm font-medium text-mute">
              {unlockedSet.size} / {ACHIEVEMENTS.length} unlocked
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedSet.has(a.id);
              const AchievementIcon = a.icon;
              return (
                <div
                  key={a.id}
                  className={`card-interactive flex flex-col gap-2.5 rounded-2xl border p-5 ${
                    unlocked ? "border-accent/30 bg-accent/5" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      unlocked ? "bg-accent text-accent-ink" : "bg-surface-2 text-faint"
                    }`}
                  >
                    {unlocked ? <AchievementIcon size={20} weight="fill" /> : <LockSimpleIcon size={18} />}
                  </span>
                  <span className={`font-display text-base font-semibold ${unlocked ? "text-paper" : "text-mute"}`}>
                    {a.label}
                  </span>
                  <span className="text-xs text-faint">{a.description}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* History */}
        <section className="animate-rise" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-4 text-lg font-semibold text-paper">Recent games</h2>
          {user.history.length === 0 ? (
            <div className="surface rounded-2xl p-6 text-center text-sm text-mute">
              No games recorded yet.{" "}
              <Link href="/" className="font-semibold text-accent hover:underline">
                Play a round
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <div className="surface flex flex-col divide-y divide-border rounded-2xl">
              {user.history.slice(0, 12).map((h) => (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: DIFFICULTY_META[h.difficulty].color,
                        backgroundColor: "var(--color-surface-2)",
                      }}
                    >
                      {DIFFICULTY_META[h.difficulty].label}
                    </span>
                    <span className="flex gap-1">
                      {h.sports.slice(0, 4).map((s) => {
                        const SportIcon = SPORT_META[s].icon;
                        return <SportIcon key={s} size={15} weight="duotone" style={{ color: SPORT_META[s].color }} />;
                      })}
                    </span>
                    <span className="text-faint">{new Date(h.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-mute">
                      {h.correct}/{h.total} correct
                    </span>
                    <span className="font-mono font-bold text-paper">{h.score.toLocaleString()} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/leagues"
            className="brand-shimmer focus-ring inline-flex items-center gap-1.5 rounded-full px-6 py-3 text-sm font-bold text-accent-ink"
          >
            <MedalIcon size={16} weight="fill" />
            View your leagues
            <ArrowRightIcon size={14} weight="bold" />
          </Link>
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-paper hover:border-accent/40"
          >
            <ShieldCheckIcon size={16} className="text-accent" />
            Play another round
          </Link>
        </div>
      </div>
    </main>
  );
}
