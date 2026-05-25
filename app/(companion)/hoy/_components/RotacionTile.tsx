import { colors } from "../../../../src/design/tokens";
import type { Origin } from "../../../../src/data/today/types";

export function RotacionTile({ origins }: { origins: ReadonlyArray<Origin> }) {
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
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8
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
          Rotación
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
          {origins.length + 1} orígenes
        </span>
      </div>
      {origins.map((origin, i) => {
        const numeral = String(i + 2).padStart(2, "0");
        return (
          <div key={origin.name} style={{ display: "flex", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 500,
                color: colors.brown700,
                width: 16,
                flexShrink: 0,
                paddingTop: 3
              }}
            >
              {numeral}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap"
                }}
              >
                <span
                  style={{
                    fontFamily:
                      "var(--font-display), 'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: 17,
                    lineHeight: "20px",
                    color: colors.ink900
                  }}
                >
                  {origin.name}.
                </span>
                {origin.flags?.includes("sin-cafeina") ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      backgroundColor: colors.beige200,
                      fontFamily:
                        "var(--font-mono), 'IBM Plex Mono', monospace",
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: colors.brown700
                    }}
                  >
                    Sin cafeína
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: "16px",
                  color: colors.inkMuted
                }}
              >
                {origin.finca ? `${origin.finca} · ` : ""}
                {origin.proceso}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
