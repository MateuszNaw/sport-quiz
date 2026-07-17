import Link from "next/link";
import { ArrowRightIcon, InfinityIcon, TrophyIcon } from "@phosphor-icons/react/ssr";
import { DIFFICULTY_META, QUIZ_TYPE_META, SPORT_META } from "@/lib/sports";
import { DIFFICULTIES, QUIZ_TYPES, SPORTS } from "@/lib/types";

export default function Home() {
  return (
    <main className="relative z-10 flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-16">
        {/* Hero */}
        <header className="flex flex-col gap-6 animate-rise">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-mute shadow-[0_1px_2px_rgba(11,45,114,0.04)]">
            <TrophyIcon size={14} weight="fill" className="text-accent" />
            SportIQ
            <span className="mx-1 h-3 w-px bg-border" />
            <span className="text-accent-2">powered by Sportradar</span>
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Sports trivia,{" "}
            <span className="brand-gradient-text">never the same round twice.</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-mute sm:text-lg">
            Pick from three random sports each round and answer AI-written
            questions across five formats and three difficulty levels.
          </p>
        </header>

        {/* Difficulty selection */}
        <section className="flex flex-col gap-5 animate-rise" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-paper">Choose your difficulty</h2>
            <span className="text-xs font-medium text-faint">10 questions · pick one to start</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {DIFFICULTIES.map((d, i) => {
              const meta = DIFFICULTY_META[d];
              const DifficultyIcon = meta.icon;
              return (
                <Link
                  key={d}
                  href={`/quiz?difficulty=${d}&length=10`}
                  className="difficulty-card focus-ring group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-surface p-6 animate-rise"
                  style={{ "--difficulty-color": meta.color, animationDelay: `${0.05 + i * 0.07}s` } as React.CSSProperties}
                >
                  <span className="difficulty-glow" aria-hidden="true" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ backgroundColor: "color-mix(in srgb, var(--difficulty-color) 16%, transparent)", color: meta.color }}
                    >
                      <DifficultyIcon size={24} weight="fill" />
                    </span>
                    <span className="flex gap-1">
                      {[1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full transition-colors"
                          style={{ backgroundColor: dot <= meta.intensity ? meta.color : "var(--color-border)" }}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <span className="font-display text-xl font-semibold text-paper">{meta.label}</span>
                    <p className="mt-1 text-sm text-mute">{meta.description}</p>
                  </div>
                  <div className="relative z-10 mt-auto flex items-center justify-between border-t border-border-soft pt-3.5 text-xs font-medium text-faint">
                    <span>{meta.points} pts / correct</span>
                    <span className="flex items-center gap-1 font-semibold opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color: meta.color }}>
                      Start
                      <ArrowRightIcon size={12} weight="bold" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link
            href="/quiz?difficulty=medium&length=0"
            className="card-interactive focus-ring group inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-paper hover:-translate-y-0.5 hover:border-accent/40"
          >
            <InfinityIcon size={18} className="text-accent" />
            Endless mode, questions until you quit
          </Link>
        </section>

        {/* Coverage */}
        <section
          className="grid gap-4 sm:grid-cols-2 animate-rise"
          style={{ animationDelay: "0.16s" }}
        >
          <div className="card-interactive rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold text-paper">Nine sports covered</h3>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const meta = SPORT_META[s];
                const SportIcon = meta.icon;
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-2 px-3 py-1.5 text-sm text-mute transition-colors hover:bg-cream/60"
                  >
                    <SportIcon size={15} weight="duotone" style={{ color: meta.color }} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="card-interactive rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold text-paper">Five quiz formats</h3>
            <div className="flex flex-wrap gap-2">
              {QUIZ_TYPES.map((t) => {
                const meta = QUIZ_TYPE_META[t];
                const TypeIcon = meta.icon;
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-2 px-3 py-1.5 text-sm text-mute transition-colors hover:bg-cream/60"
                  >
                    <TypeIcon size={15} className="text-accent" />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="text-sm text-faint">
          Questions are generated live by Claude when an API key is configured,
          with a built-in fallback bank otherwise.
        </footer>
      </div>
    </main>
  );
}
