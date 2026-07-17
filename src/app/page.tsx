import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  InfinityIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import { DIFFICULTY_META, QUIZ_TYPE_META, SPORT_META } from "@/lib/sports";
import { DIFFICULTIES, QUIZ_TYPES, SPORTS } from "@/lib/types";

export default function Home() {
  return (
    <main className="relative z-10 flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-14">
        <header className="flex flex-col gap-5 animate-rise">
          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-border bg-surface-2/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
            <TrophyIcon size={14} weight="fill" className="text-brand" />
            <span className="text-paper">SportIQ</span>
            <span className="mx-1 h-3 w-px bg-border" />
            <span className="text-mute normal-case tracking-normal">powered by Sportradar</span>
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-paper sm:text-5xl">
            Sports trivia,{" "}
            <span className="brand-gradient-text">never the same round twice.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-mute sm:text-lg">
            Pick from three random sports each round and answer questions across
            six formats and three difficulty levels.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/quiz?mode=daily"
              className="brand-shimmer pressable focus-ring inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-accent-ink"
            >
              <CalendarBlankIcon size={18} weight="fill" />
              Today&apos;s daily challenge
            </Link>
            <Link
              href="/leaderboard"
              className="pressable focus-ring inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-paper"
            >
              <TrophyIcon size={18} weight="fill" className="text-peach" />
              Leaderboard
            </Link>
          </div>
        </header>

        <section
          className="surface-cream flex flex-col gap-5 rounded-[1.75rem] p-5 sm:p-6 animate-rise"
          style={{ animationDelay: "0.06s" }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-paper">Choose your difficulty</h2>
            <span className="text-xs font-medium text-mute">10 questions · pick one to start</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {DIFFICULTIES.map((d, i) => {
              const meta = DIFFICULTY_META[d];
              const DifficultyIcon = meta.icon;
              return (
                <Link
                  key={d}
                  href={`/quiz?difficulty=${d}&length=10`}
                  className="difficulty-card pressable focus-ring group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-surface p-5 stagger-item"
                  style={
                    {
                      "--difficulty-color": meta.color,
                      animationDelay: `${i * 45}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className="difficulty-glow" aria-hidden="true" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--difficulty-color) 14%, transparent)",
                        color: meta.color,
                      }}
                    >
                      <DifficultyIcon size={22} weight="fill" />
                    </span>
                    <span className="flex gap-1">
                      {[1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: dot <= meta.intensity ? meta.color : "var(--color-border)",
                          }}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <span className="font-display text-xl font-semibold text-paper">{meta.label}</span>
                    <p className="mt-1 text-sm text-mute">{meta.description}</p>
                  </div>
                  <div className="relative z-10 mt-auto flex items-center justify-between border-t border-border-soft pt-3 text-xs font-medium text-faint">
                    <span>{meta.points} pts / correct</span>
                    <span
                      className="flex items-center gap-1 font-semibold opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:opacity-100"
                      style={{ color: meta.color }}
                    >
                      Start
                      <ArrowRightIcon size={12} weight="bold" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link
            href="/quiz?difficulty=medium&length=0&mode=endless"
            className="pressable focus-ring group inline-flex items-center gap-2.5 self-start rounded-2xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-paper"
          >
            <InfinityIcon size={18} weight="bold" className="text-lavender" />
            Endless mode, questions until you quit
          </Link>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 animate-rise" style={{ animationDelay: "0.12s" }}>
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-paper">Nine sports covered</h3>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const meta = SPORT_META[s];
                const SportIcon = meta.icon;
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border-soft bg-surface-2/70 px-3 py-1.5 text-sm text-mute"
                  >
                    <SportIcon size={15} weight="duotone" style={{ color: meta.color }} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="mb-3 text-sm font-semibold text-paper">Six quiz formats</h3>
            <div className="flex flex-wrap gap-2">
              {QUIZ_TYPES.map((t) => {
                const meta = QUIZ_TYPE_META[t];
                const TypeIcon = meta.icon;
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border-soft bg-ink/60 px-3 py-1.5 text-sm text-mute"
                  >
                    <TypeIcon size={15} weight="duotone" style={{ color: meta.color }} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="text-sm text-faint">
          Questions come from the curated bank first; AI generation is an optional fallback when a key is configured.
        </footer>
      </div>
    </main>
  );
}
