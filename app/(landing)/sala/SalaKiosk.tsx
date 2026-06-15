"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Kiosk helper for the /sala TV display. Renders nothing.
//
// 1) SOFT refresh instead of a hard <meta refresh>. A full document reload
//    makes the Fire TV Silk browser re-show its toolbar every cycle; a
//    router.refresh() re-runs the server render (new date → edition + Menu
//    Ejecutivo time-gates update, live menu re-fetched) WITHOUT navigating,
//    so the chrome stays hidden between refreshes.
// 2) Best-effort fullscreen on the first remote press / tap — on TV browsers
//    that honor the Fullscreen API this drops the toolbar entirely. Silent
//    no-op where unsupported.

const REFRESH_MS = 10 * 60 * 1000;

function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) void el.requestFullscreen();
    else if (el.webkitRequestFullscreen) void el.webkitRequestFullscreen();
  } catch {
    /* unsupported on this browser — ignore */
  }
}

export function SalaKiosk() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  useEffect(() => {
    const onGesture = () => requestFullscreen();
    const opts = { once: true } as const;
    window.addEventListener("keydown", onGesture, opts);
    window.addEventListener("pointerdown", onGesture, opts);
    return () => {
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("pointerdown", onGesture);
    };
  }, []);

  return null;
}
