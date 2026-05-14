import { colors } from "../../../../src/design/tokens";

// Tier 3 — Lightweight in-page fallback while CartaMenu streams. Shares the
// page's flex column so the layout stays stable (no jump when content
// replaces the placeholder). Delayed-appearance via the loading-fade
// keyframe so fast streams never paint it.
export function CartaMenuFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        opacity: 0,
        animation: "deriva-loading-fade-in 220ms ease-out 320ms forwards"
      }}
    >
      <div
        style={{
          width: "55%",
          height: 10,
          backgroundColor: colors.beige300,
          opacity: 0.5
        }}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          paddingTop: 8
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 14,
              borderBottom: `1px solid ${colors.hairlineLight}`
            }}
          >
            <div
              style={{
                width: `${60 - i * 8}%`,
                height: 14,
                backgroundColor: colors.beige300,
                opacity: 0.45
              }}
            />
            <div
              style={{
                width: 48,
                height: 12,
                backgroundColor: colors.beige300,
                opacity: 0.4
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
