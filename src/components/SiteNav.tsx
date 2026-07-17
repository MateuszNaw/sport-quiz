"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrophyIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import AccountMenu from "./AccountMenu";

/**
 * Slim top nav shown on every page except /quiz, which already renders its
 * own sticky HUD (score, streak, difficulty) that would otherwise duplicate
 * this bar.
 */
export default function SiteNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/quiz")) return null;

  return (
    <div className="relative z-20 mx-auto flex w-full max-w-4xl items-center justify-between px-6 pt-6 sm:px-8">
      <Link
        href="/"
        className="focus-ring flex items-center gap-2 rounded-lg font-display text-base font-semibold text-paper transition-colors hover:text-accent"
      >
        <TrophyIcon size={18} weight="fill" className="text-accent" />
        SportIQ
      </Link>
      <div className="flex items-center gap-2.5">
        <Link
          href="/leagues"
          className="focus-ring hidden items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-paper transition-colors hover:border-accent/40 sm:inline-flex"
        >
          <UsersThreeIcon size={15} className="text-accent" />
          Leagues
        </Link>
        <AccountMenu />
      </div>
    </div>
  );
}
