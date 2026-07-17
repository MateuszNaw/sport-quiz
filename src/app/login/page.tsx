"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LockKeyIcon, SignInIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { useAuth } from "@/components/AuthProvider";

type Mode = "login" | "register";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";
  const { setUser } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { user?: unknown; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setUser(data.user as never);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand">
            {mode === "login" ? <SignInIcon size={26} weight="bold" /> : <UserPlusIcon size={26} weight="bold" className="text-mint" />}
          </div>
          <h1 className="font-display text-2xl font-semibold text-paper">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-mute">
            Just a username and password — no email required.
          </p>
        </div>

        <div className="mb-5 flex rounded-full border border-border bg-surface p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`focus-ring flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                mode === m ? "brand-shimmer text-accent-ink" : "text-mute hover:text-paper"
              }`}
            >
              {m === "login" ? "Sign in" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="surface flex flex-col gap-4 rounded-2xl p-6">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-paper">Username</span>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. goal_machine_99"
              className="focus-ring rounded-xl border border-border bg-surface-2 px-4 py-3 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-paper">Password</span>
            <div className="relative">
              <LockKeyIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-peach" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Anything works"
                className="focus-ring w-full rounded-xl border border-border bg-surface-2 py-3 pl-11 pr-4 text-paper outline-none transition-colors placeholder:text-faint focus:border-accent/60"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-xl border border-hard/40 bg-hard/10 px-4 py-2.5 text-sm text-hard">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="brand-shimmer focus-ring mt-1 rounded-full px-6 py-3 font-bold text-accent-ink transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:animate-none disabled:bg-accent/40 disabled:opacity-60"
          >
            {submitting ? "One sec…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-faint">
          <Link href="/" className="focus-ring font-semibold text-mute hover:text-accent">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
