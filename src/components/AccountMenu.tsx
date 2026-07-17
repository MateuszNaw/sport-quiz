"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CaretDownIcon,
  SignInIcon,
  SignOutIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { useAuth } from "./AuthProvider";

export default function AccountMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) {
    return <span className="inline-block h-9 w-24 animate-pulse-soft rounded-2xl bg-surface-2" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="pressable focus-ring inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-paper transition-[border-color,background-color] duration-200 ease hover:bg-surface-2/50"
      >
        <SignInIcon size={15} />
        Sign in
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="pressable focus-ring inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-paper transition-[border-color,background-color] duration-200 ease hover:bg-surface-2/50"
      >
        <UserCircleIcon size={18} className="text-mute" />
        {user.username}
        <CaretDownIcon
          size={12}
          weight="bold"
          className={`text-faint transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="surface absolute right-0 top-full z-30 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl p-1.5 animate-pop">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-paper transition-colors duration-150 ease hover:bg-surface-2/70"
          >
            <UserCircleIcon size={16} className="text-mute" />
            Profile
          </Link>
          <Link
            href="/leagues"
            onClick={() => setOpen(false)}
            className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-paper transition-colors duration-150 ease hover:bg-surface-2/70"
          >
            <UsersThreeIcon size={16} className="text-mute" />
            Leagues
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-hard transition-colors duration-150 ease hover:bg-hard/10"
          >
            <SignOutIcon size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
