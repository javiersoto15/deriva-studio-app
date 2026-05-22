import type { Metadata } from "next";
import Link from "next/link";

import { getOriginCard } from "../../../../../src/api/server";
import { colors } from "../../../../../src/design/tokens";
import { OriginCtas, OriginHeaderActions } from "./_components/OriginActions";

// Origin Card detail — matches Paper artboard 11G-0. Single green moment (Rule 5).
// Phase 2B.5 — Converted to RSC. Spec sheet, barista note, and the hex+pin
// glyph are server-rendered. The favorite/share buttons and the bottom CTA
// pair are the only client island.
// Phase 2B.6 — generateMetadata sets <title> to the origin name for SEO + share.

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const origin = await getOriginCard(id);
  if (!origin) return { title: "Origen" };
  // The UI breaks the headline across two lines (`name_a` + `name_b`); for
  // <title> we join them with a comma + space.
  const name_a = origin.name_a?.replace(/,?\s*$/, "");
  const title = [name_a, origin.name_b].filter(Boolean).join(", ");
  return { title: title.length > 0 ? title : "Origen" };
}

export default async function OriginCardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Returns null on backend failure; fall through to the placeholder content
  // so the route still renders.
  const data = await getOriginCard(id);

  // Fallback values mirror the current House Blend rotation so the route still
  // reads correctly when the backend is unreachable at prerender time.
  const specRows = [
    { label: "país", value: data?.country ?? "Nicaragua · Colombia · Kenia" },
    { label: "región", value: data?.region ?? "Mezcla de origen · DACH" },
    { label: "productor", value: data?.producer ?? "DACH" },
    { label: "variedad", value: data?.variety ?? "Atuai, Castillo, Caturra, Batian" },
    { label: "proceso", value: data?.process ?? "Lavado y Natural" },
    { label: "método", value: data?.method ?? "Espresso · 18g / 36g" }
  ];

  return (
    <main
      style={{
        flex: 1,
        padding: "24px 24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link
          href="/carta"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.brown700,
            textDecoration: "none"
          }}
        >
          ← Carta
        </Link>
        <OriginHeaderActions originId={id} />
      </header>

      {/* Single green moment: hex+pin glyph + eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span aria-hidden style={{ color: colors.green, fontSize: 18, lineHeight: 1 }}>
          ⬢
        </span>
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.green
          }}
        >
          Origen en barra
        </span>
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 44,
          lineHeight: "50px",
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        {data?.name_a ?? "House Blend,"}
        <br />
        {data?.name_b ?? "DACH"}
      </h1>

      <p
        style={{
          margin: 0,
          fontFamily: "Poppins, sans-serif",
          fontSize: 14,
          lineHeight: "21px",
          color: colors.ink900
        }}
      >
        {data?.body ??
          "Blend de la casa de DACH — Nicaragua, Colombia y Kenia, cosecha 2024-2025 a 1.850 msnm promedio. Chocolate, fruta tropical y caramelo sobre un cuerpo redondo y cremoso."}
      </p>

      {/* Spec sheet — hairline rows */}
      <section style={{ display: "flex", flexDirection: "column" }}>
        {specRows.map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: colors.inkMuted,
                textTransform: "lowercase"
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 400,
                fontSize: 15,
                color: colors.ink900,
                textAlign: "right"
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ marginBottom: 4 }}>
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
            Nota del barista
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 17,
            lineHeight: "26px",
            color: colors.ink900
          }}
        >
          {data?.barista_note ??
            "\"Es nuestro caballito de batalla — equilibrado, dulce, perdona pequeños cambios de receta sin perder carácter.\""}
        </p>
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
          — {data?.barista_attrib ?? "BARRA DERIVA · 14 MAY"}
        </span>
      </section>

      <OriginCtas originId={id} />
    </main>
  );
}
