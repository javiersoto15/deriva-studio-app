"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { TabBar, type TabKey } from "./TabBar";

// Routes that show the bottom tab bar, and which tab is active for each.
// Sub-routes (e.g. /carta/espresso) inherit their parent's active key via
// startsWith() matching below. Keep keys sorted by specificity — the first
// match wins.
const ROUTE_TABS: ReadonlyArray<{ prefix: string; tab: TabKey }> = [
  { prefix: "/favoritos", tab: "carta" },
  { prefix: "/feedback", tab: "carta" },
  { prefix: "/actividad", tab: "cartera" },
  { prefix: "/sumar-visita", tab: "cartera" },
  { prefix: "/carta", tab: "carta" },
  { prefix: "/cartera", tab: "cartera" },
  { prefix: "/codigo", tab: "codigo" },
  { prefix: "/estudio", tab: "estudio" }
];

// Routes that explicitly hide the tab bar even though they live inside the
// (companion) group — fullscreen surfaces (espresso /codigo), auth flows,
// onboarding, offline, etc.
const HIDDEN_PREFIXES: ReadonlyArray<string> = [
  "/codigo",
  "/ingresar",
  "/inicio",
  "/offline",
  "/canjear"
];

function activeTabFor(pathname: string): TabKey | null {
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  const match = ROUTE_TABS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match?.tab ?? null;
}

// Tier 5 — Routes worth pre-warming the moment the user lands on any companion
// page. Tab switches should hit a warm RSC cache and feel near-instant.
const PREFETCH_TARGETS = ["/carta", "/codigo", "/cartera", "/estudio"];

// Persistent TabBar — rendered once at the companion layout level so it
// survives client-side navigation between tabs. Eliminates the unmount /
// remount flash that made tab transitions feel choppy.
//
// Also handles cross-tab prefetching: as soon as the layout mounts we warm
// the RSC cache for every top-level tab so the *next* tap is near-instant.
// Sub-routes (e.g. /actividad, /favoritos) inherit warm cache for their
// parent tab automatically because Next caches per-route-segment.
export function PersistentTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const active = activeTabFor(pathname ?? "");

  useEffect(() => {
    // Run prefetch on the next idle frame so it doesn't fight the current
    // page's first paint. Falls back to setTimeout for browsers without
    // requestIdleCallback (Safari < 18).
    const schedule =
      typeof window !== "undefined" &&
      typeof (window as unknown as { requestIdleCallback?: unknown })
        .requestIdleCallback === "function"
        ? (cb: () => void) =>
            (window as unknown as {
              requestIdleCallback: (cb: () => void) => number;
            }).requestIdleCallback(cb)
        : (cb: () => void) => window.setTimeout(cb, 250);

    const id = schedule(() => {
      for (const href of PREFETCH_TARGETS) {
        router.prefetch(href);
      }
    });
    return () => {
      if (typeof window !== "undefined") {
        const cancel = (
          window as unknown as { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback;
        if (cancel && typeof id === "number") cancel(id);
        else if (typeof id === "number") window.clearTimeout(id);
      }
    };
  }, [router]);

  if (!active) return null;
  return <TabBar active={active} />;
}
