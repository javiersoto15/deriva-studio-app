"use client";

import { useEffect } from "react";
import { colors } from "../src/design/tokens";
import { Button } from "../src/ui/Button";
import { Eyebrow } from "../src/ui/Eyebrow";

// Landing-level error boundary — catches anything thrown inside the
// (landing) route group. Follows Recipe Rule 20 (italic emotional anchor
// + Plex Mono caption beneath) and Rule 8 (eyebrow tick on light surface).
export default function LandingError({
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
        minHeight: "100vh",
        background: colors.beige100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px"
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 24
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
      </div>
    </main>
  );
}
