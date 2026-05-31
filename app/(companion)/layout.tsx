import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { QueryProvider } from "../../src/api/QueryProvider";
import { CompanionLocaleProvider } from "../../src/i18n/CompanionLocaleProvider";
import { AuthProvider } from "../../src/auth/provider";
import { RequireAuth } from "../../src/auth/RequireAuth";
import { colors } from "../../src/design/tokens";
import { OfflineStrip } from "../../src/ui/OfflineStrip";
import { PersistentTabBar } from "../../src/ui/PersistentTabBar";
import { ServiceWorkerRegistrar } from "../../src/ui/ServiceWorkerRegistrar";
import { Toaster } from "../../src/ui/Toaster";
import "../../src/design/tokens.css";

// Phase 1E — companion routes are private (signed-in only) so search engines
// must not index them. The host-aware robots.ts already disallows app.* hosts;
// this is the second layer (per-route meta) for safety on shared hosts.
export const metadata: Metadata = {
  title: {
    default: "Tu Deriva",
    template: "%s · Deriva"
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false }
  }
};

export default function CompanionLayout({ children }: { children: ReactNode }) {
  return (
    <CompanionLocaleProvider>
      <QueryProvider>
      <AuthProvider>
        {/* Auth guard — when Firebase status flips to "anonymous" on a
            protected route (background token-refresh failure, refresh-token
            expiry, account deleted, manual signOut from another tab), this
            clears the React Query cache and redirects to /inicio. Renders
            nothing. Wrapped in <Suspense> so its usePathname() use doesn't
            block PPR. */}
        <Suspense fallback={null}>
          <RequireAuth />
        </Suspense>
        {/* Phase 2A.3 — Persistent offline strip (Recipe Rule 19). Rendered
            above the skip-to-content link so it sits at the very top of the
            companion body subtree. Self-mounts only when navigator.onLine flips. */}
        <OfflineStrip />
        <ServiceWorkerRegistrar />
        {/* Skip-to-content — visually hidden until focused. Phase 1D D7. */}
        <a href="#main-content" className="sr-only-focusable">
          Saltar al contenido
        </a>
        <div
          id="main-content"
          style={{
            minHeight: "100dvh",
            backgroundColor: colors.beige100,
            color: colors.ink900,
            display: "flex",
            flexDirection: "column",
            // Horizontal safe-area only — vertical insets are owned by each
            // page's <main> so the page bg paints edge-to-edge into the notch
            // and home-indicator zones (no body-bg leak as "shade stripes").
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)"
          }}
        >
          {children}
          {/* Persistent tab bar — rendered at the layout level so it survives
              client-side navigation between tabs (no unmount/remount flash).
              Hides itself on routes that don't surface tabs (e.g. /codigo).
              Wrapped in <Suspense> because it reads usePathname(), which is
              dynamic; without the boundary, cacheComponents would mark the
              entire layout as a Blocking Route and abort PPR. */}
          <Suspense fallback={null}>
            <PersistentTabBar />
          </Suspense>
          <Toaster />
        </div>
      </AuthProvider>
      </QueryProvider>
    </CompanionLocaleProvider>
  );
}
