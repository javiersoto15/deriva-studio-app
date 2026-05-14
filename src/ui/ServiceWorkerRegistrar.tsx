"use client";

// Phase 2A.1 — Service-worker registration for the Companion app.
// Mounted only in the companion layout so we don't register on landing/staff/admin.
// Idempotent; the browser deduplicates registrations against the same scope.

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Swallow — SW failure must never block the app. Sentry will see the
        // unhandled rejection if anything bubbles up elsewhere.
        console.warn("[sw] registration failed", err);
      }
    };

    // Defer to after first paint so we never compete with the initial render.
    if ("requestIdleCallback" in window) {
      const id = (window as Window & {
        requestIdleCallback: (cb: () => void) => number;
      }).requestIdleCallback(() => {
        void register();
      });
      return () => {
        (window as Window & {
          cancelIdleCallback?: (id: number) => void;
        }).cancelIdleCallback?.(id);
      };
    }
    const t = setTimeout(() => {
      void register();
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  return null;
}
