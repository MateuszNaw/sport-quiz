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
        className="pressable focus-ring flex items-center gap-2 rounded-lg font-display text-base font-semibold text-brand"
      >
        <TrophyIcon size={18} weight="fill" className="text-brand" />
        SportIQ
      </Link>
      <div className="flex items-center gap-2.5">
        <Link
          href="/leagues"
          className="pressable focus-ring hidden items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-paper transition-[border-color,background-color] duration-200 ease hover:bg-surface-2/50 sm:inline-flex"
        >
          <UsersThreeIcon size={15} className="text-mute" />
          Leagues
        </Link>
        <AccountMenu />
      </div>
    </div>
  );
}
