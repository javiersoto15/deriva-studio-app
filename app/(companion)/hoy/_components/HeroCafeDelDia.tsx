import Link from "next/link";
import { colors } from "../../../../src/design/tokens";
import type { DestacadoOrigin } from "../../../../src/data/today/types";

export function HeroCafeDelDia({ origin }: { origin: DestacadoOrigin }) {
  return (
    <div
      style={{
        margin: "10px 14px 0",
        backgroundColor: colors.brown900,
        color: colors.beige100,
        padding: "14px 18px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative"
      }}
    >
      {/* Kicker row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: colors.beige100
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: colors.beige100
            }}
          >
            Café del día
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(244, 237, 230, 0.66)"
          }}
        >
          01 · destacado
        </span>
      </div>

      {/* Type moment — origin name */}
      <h2
        style={{
          margin: "2px 0 0",
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 36,
          lineHeight: "38px",
          letterSpacing: "-0.015em",
          color: colors.beige100
        }}
      >
        {origin.name}.
      </h2>

      {/* Origin · proceso */}
      <div
        style={{
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontWeight: 400,
          fontSize: 15,
          lineHeight: "20px",
          color: colors.beige100
        }}
      >
        {origin.finca ? `${origin.finca} — ` : ""}
        {origin.proceso}.
      </div>

      {/* Notes */}
      <div
        style={{
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 13,
          lineHeight: "18px",
          color: "rgba(244, 237, 230, 0.76)",
          maxWidth: 300
        }}
      >
        {origin.notes}
      </div>

      {/* Hairline on dark */}
      <div
        style={{
          height: 1,
          backgroundColor: colors.hairlineOnDark,
          marginTop: 4,
          marginBottom: 2
        }}
      />

      {/* Footer row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
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
            color: "rgba(244, 237, 230, 0.76)"
          }}
        >
          {origin.brew}
        </span>
        <Link
          href="/carta"
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: colors.beige100,
            textDecoration: "none"
          }}
        >
          ver carta →
        </Link>
      </div>
    </div>
  );
}
