"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sportiq:intro-seen";
const AUTO_DISMISS_MS = 2800;
const FADE_MS = 450;

/**
 * Full-screen welcome animation shown once per browser, on first visit.
 * Reads/writes localStorage only on the client to avoid hydration mismatch.
 */
export default function FirstVisitIntro() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // One-time sync with an external store (localStorage) on mount; the
    // overlay is intentionally absent from the server-rendered HTML so the
    // entrance animation always plays for first-time visitors on the client.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode etc.) — skip the intro silently.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(close, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  function close() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }, FADE_MS);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to SportIQ"
      onClick={close}
      className={`intro-overlay fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center ${
        closing ? "intro-overlay-out" : ""
      }`}
    >
      <span className="intro-blob intro-blob-a" aria-hidden="true" />
      <span className="intro-blob intro-blob-b" aria-hidden="true" />
      <span className="intro-blob intro-blob-c" aria-hidden="true" />

      <div className="intro-logo relative z-10 rounded-2xl shadow-2xl">
        <Image
          src="/sportradar-logo.png"
          alt="Sportradar — Sports Technology. Reimagined."
          width={756}
          height={406}
          priority
          className="w-64 sm:w-80"
        />
      </div>
      <p className="intro-tag relative z-10 max-w-sm text-base font-semibold text-paper sm:text-lg">
        Welcome to <span className="font-display text-brand">SportIQ</span> — trivia built on
        Sportradar-grade sports data.
      </p>
      <p className="intro-hint relative z-10 text-xs uppercase tracking-[0.25em] text-mute">
        Tap anywhere to start
      </p>
    </div>
  );
}
