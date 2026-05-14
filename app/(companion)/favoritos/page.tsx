"use client";

import Link from "next/link";
import { useFavorites } from "../../../src/api/hooks";
import { colors } from "../../../src/design/tokens";
import { Eyebrow } from "../../../src/ui/Eyebrow";

// Favoritos — matches Paper artboard 28E-0.
export default function FavoritosPage() {
  const { data } = useFavorites();

  return (
    <>
      <main
        style={{
          flex: 1,
          padding:
            "calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 96px)",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
      <Link href="/carta" className="tap-target" style={{ textDecoration: "none", margin: "-10px -8px", alignSelf: "flex-start" }}>
        <Eyebrow>← Carta</Eyebrow>
      </Link>
      <Eyebrow>Mi Usual</Eyebrow>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h1
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
          Tus favoritos.
        </h1>
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          {data?.saved.length ?? 0} guardados
        </span>
      </div>

      <section style={{ display: "flex", flexDirection: "column" }}>
        {data && data.saved.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "20px 0",
              borderTop: `1px solid ${colors.hairlineLight}`
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 19,
                lineHeight: "26px",
                color: colors.inkMuted
              }}
            >
              Aún no has guardado un usual. Mantén pulsado un ítem en la carta para guardarlo.
            </span>
            <Link
              href="/carta"
              style={{
                alignSelf: "flex-start",
                fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: colors.brown700,
                textDecoration: "none"
              }}
            >
              Ir a la carta →
            </Link>
          </div>
        )}
        {(data?.saved ?? []).map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <span aria-hidden style={{ color: colors.brown700, fontSize: 16, width: 18 }}>
              ♥
            </span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 20,
                  color: colors.ink900
                }}
              >
                {f.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: colors.inkMuted,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase"
                }}
              >
                {f.sub}
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 13,
                color: colors.ink900
              }}
            >
              $ {f.price_clp.toLocaleString("es-CL")}
            </span>
          </div>
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 8 }}>
          <Eyebrow>Sugerencias basadas en tu actividad</Eyebrow>
        </div>
        {(data?.suggestions ?? []).map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <span aria-hidden style={{ color: colors.brown700, fontSize: 16, width: 18 }}>
              +
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 20,
                  color: colors.ink900
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: colors.inkMuted
                }}
              >
                {s.sub}
              </span>
            </div>
          </div>
        ))}
      </section>
      </main>
    </>
  );
}
