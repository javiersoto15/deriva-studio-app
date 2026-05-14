import { colors } from "../../src/design/tokens";

// Companion-level suspense fallback.
//
// Tier 2 — Delayed-appearance skeleton. The previous full-screen 3-row
// skeleton flashed for ~50–100ms on every tab change even when the new RSC
// arrived almost instantly, which read as "chop". Now the skeleton starts
// fully transparent and fades in only after a 320ms grace window — fast
// navs (including the "use client" Studio page that has to hydrate React
// Query state) never paint it; slow navs still get a polite shimmer.
//
// The TabBar is rendered at the companion layout level (a sibling of the
// children slot), so it stays visible behind this fallback automatically.
export default function CompanionLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{
        flex: 1,
        padding:
          "calc(env(safe-area-inset-top) + 48px) 24px calc(env(safe-area-inset-bottom) + 96px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minHeight: "100dvh",
        background: colors.beige100,
        opacity: 0,
        animation: "deriva-loading-fade-in 220ms ease-out 320ms forwards"
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: 16,
            borderBottom: `1px solid ${colors.hairline}`
          }}
        >
          <div
            style={{
              width: "40%",
              height: 10,
              backgroundColor: colors.beige300,
              opacity: 0.6
            }}
          />
          <div
            style={{
              width: "80%",
              height: 18,
              backgroundColor: colors.beige300,
              opacity: 0.5
            }}
          />
          <div
            style={{
              width: "60%",
              height: 12,
              backgroundColor: colors.beige300,
              opacity: 0.4
            }}
          />
        </div>
      ))}
    </main>
  );
}
