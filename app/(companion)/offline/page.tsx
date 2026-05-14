"use client";

// Phase 2A.2 — /offline fallback. Reached when a navigation request fails and
// the service worker serves this precached page. Per Recipe Rule 19 + Rule 20.
//
// No header, no tab bar, no network dependencies at render time — must work
// fully offline. The reload button defers to window.location.reload().

import { Button } from "../../../src/ui/Button";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { colors } from "../../../src/design/tokens";

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.beige100,
        color: colors.ink900,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center"
      }}
    >
      <div style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
        <Eyebrow>Sin conexión</Eyebrow>
        <p
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: 32,
            lineHeight: "36px",
            letterSpacing: "-0.01em",
            margin: 0,
            color: colors.brown700
          }}
        >
          Estamos esperando que vuelvas.
        </p>
        <p
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontWeight: 400,
            fontSize: 13,
            lineHeight: "20px",
            letterSpacing: "0.04em",
            margin: 0,
            color: colors.inkMuted
          }}
        >
          Vuelve cuando tu conexión se restablezca.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          Volver a intentar
        </Button>
      </div>
    </main>
  );
}
