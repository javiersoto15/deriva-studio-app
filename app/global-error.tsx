"use client";

import { useEffect } from "react";

// Top-level fallback — catches errors that may have broken the root layout.
// Per Next.js convention, this file MUST render its own <html> + <body>.
// Inline styles only — design tokens may not be available here.
export default function GlobalError({
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
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#F4EDE6",
          color: "#1A1410",
          fontFamily: "ui-serif, Georgia, serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24
        }}
      >
        <main
          style={{
            maxWidth: 520,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 24
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#5E5348"
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 1,
                backgroundColor: "#5E230F"
              }}
            />
            <span
              style={{
                fontFamily:
                  "ui-sans-serif, system-ui, 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase"
              }}
            >
              Error
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 32,
              lineHeight: "38px",
              letterSpacing: "-0.01em",
              color: "#1A1410"
            }}
          >
            Algo se demoró más de lo que esperábamos.
          </p>

          <p
            style={{
              margin: 0,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12,
              lineHeight: "17px",
              color: "#5E5348"
            }}
          >
            Inténtalo en un momento. Si persiste, recarga la página.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "16px 24px",
                borderRadius: 999,
                fontFamily:
                  "ui-sans-serif, system-ui, 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                backgroundColor: "#5E230F",
                color: "#F4EDE6",
                border: "none"
              }}
            >
              Volver a intentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
