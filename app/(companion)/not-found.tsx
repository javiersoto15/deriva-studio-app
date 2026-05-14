import Link from "next/link";
import { colors } from "../../src/design/tokens";
import { Eyebrow } from "../../src/ui/Eyebrow";

// Companion-level 404 — Recipe Rule 20 (italic anchor + mono caption)
// + Rule 8 eyebrow tick on light surface. Ghost-styled link returns home.
export default function CompanionNotFound() {
  return (
    <main
      style={{
        flex: 1,
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        minHeight: "100vh",
        background: colors.beige100
      }}
    >
      <Eyebrow>404</Eyebrow>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 36,
          lineHeight: "42px",
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        No encontramos lo que buscas.
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          lineHeight: "17px",
          color: colors.inkMuted
        }}
      >
        Vuelve al inicio cuando quieras.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          href="/inicio"
          style={{
            padding: "8px 0",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.brown700,
            textDecoration: "none",
            border: "none",
            background: "transparent"
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
