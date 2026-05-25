import { colors } from "../../../../src/design/tokens";
import type { Barista } from "../../../../src/data/today/types";

export function BarraTile({ barista }: { barista: Barista }) {
  const initial = barista.name.charAt(0).toUpperCase();
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colors.beige50,
        padding: "16px 16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        La barra
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          aria-hidden
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: colors.brown700,
            color: colors.beige100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontWeight: 500,
            fontSize: 18,
            flexShrink: 0
          }}
        >
          {initial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 18,
              lineHeight: "20px",
              color: colors.ink900
            }}
          >
            {barista.name}.
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: colors.inkMuted
            }}
          >
            {barista.turnoUntil}
          </span>
        </div>
      </div>

      {barista.note ? (
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 13,
            lineHeight: "18px",
            color: colors.inkMuted
          }}
        >
          “{barista.note}”
        </div>
      ) : null}
    </div>
  );
}
