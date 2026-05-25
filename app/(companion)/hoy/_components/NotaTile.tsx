import { colors } from "../../../../src/design/tokens";
import type { Nota } from "../../../../src/data/today/types";

// Splits the quote on the em-dash and renders that single dash in green —
// the page's editorial accent (per Recipe Rule 5, single green moment).
function renderBody(body: string) {
  const idx = body.indexOf("—");
  if (idx === -1) return <>{body}</>;
  const before = body.slice(0, idx);
  const after = body.slice(idx + 1);
  return (
    <>
      {before}
      <span style={{ color: colors.green }}>—</span>
      {after}
    </>
  );
}

export function NotaTile({ nota }: { nota: Nota }) {
  return (
    <div
      style={{
        margin: "16px 16px 0",
        backgroundColor: colors.beige50,
        padding: "16px 22px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}
    >
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
              display: "inline-block",
              width: 14,
              height: 1,
              backgroundColor: colors.brown700
            }}
          />
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
            Nota de la casa
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: "0.10em",
            color: colors.inkMuted
          }}
        >
          firma · {nota.initials}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 18,
          lineHeight: "26px",
          color: colors.ink900,
          maxWidth: 320
        }}
      >
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 24,
            color: colors.brown700,
            marginRight: 6,
            verticalAlign: "-2px"
          }}
        >
          “
        </span>
        {renderBody(nota.body)}
      </p>
    </div>
  );
}
