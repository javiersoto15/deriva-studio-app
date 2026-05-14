"use client";

import { useEffect } from "react";
import { colors } from "../../src/design/tokens";
import { Button } from "../../src/ui/Button";
import { Eyebrow } from "../../src/ui/Eyebrow";

// Companion-level error boundary — catches anything thrown inside the
// (companion) route group without nuking the root layout. Recipe Rule 20
// (italic emotional anchor + Plex Mono retry caption) + Rule 8 eyebrow.
export default function CompanionError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Deriva]", error);
  }, [error]);

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
      <Eyebrow>Error</Eyebrow>

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
        Algo se demoró más de lo que esperábamos.
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
        Inténtalo en un momento. Si persiste, recarga la página.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" onClick={() => reset()}>
          Volver a intentar
        </Button>
      </div>
    </main>
  );
}
