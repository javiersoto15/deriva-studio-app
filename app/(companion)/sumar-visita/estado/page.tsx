"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useClaims } from "../../../../src/api/hooks";
import { colors } from "../../../../src/design/tokens";
import Link from "next/link";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { TabBar } from "../../../../src/ui/TabBar";

// Missing Points status triptych — matches Paper artboard 2A4-0.
// Renders one of three states based on ?status= or shows all three (default).
type Status = "pending" | "approved" | "rejected" | "all";

function StatusPanel({
  index,
  label,
  receipt,
  headline,
  body,
  isGreenMoment,
  points
}: {
  index: string;
  label: string;
  receipt: string;
  headline: string;
  body: string;
  isGreenMoment?: boolean;
  points?: number;
}) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "20px 0",
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isGreenMoment && (
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: colors.green,
                display: "inline-block"
              }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 15,
              color: colors.inkMuted
            }}
          >
            {index} · {label}
          </span>
        </div>
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
          Recibo {receipt}
        </span>
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 24,
          lineHeight: "30px",
          letterSpacing: "-0.01em",
          color: colors.ink900
        }}
      >
        {isGreenMoment ? (
          <>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontStyle: "normal", fontSize: 28, color: colors.green }}>
              +{points ?? 0} pts
            </span>{" "}
            sumados a tu actividad.
          </>
        ) : (
          headline
        )}
      </h2>

      <span
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.brown700
        }}
      >
        {body}
      </span>

      {label === "rechazada" && (
        <p
          style={{
            margin: 0,
            fontFamily: "Poppins, sans-serif",
            fontSize: 13,
            color: colors.ink900,
            lineHeight: "20px"
          }}
        >
          Si crees que es un error, escríbenos a hola@derivastudio.cl con el recibo a mano.
        </p>
      )}
    </section>
  );
}

const PANELS = {
  pending: { index: "i", label: "pendiente", receipt: "2026-0431", headline: "Tu solicitud está en revisión.", body: "Te avisamos en menos de 24h" },
  approved: { index: "ii", label: "aprobada", receipt: "2026-0408", headline: "+48 pts sumados a tu actividad.", body: "Aprobado por · Camila R" },
  rejected: { index: "iii", label: "rechazada", receipt: "2026-0372", headline: "No pudimos validar este recibo.", body: "Motivo · No coincide con una venta registrada" }
} as const;

export default function ClaimStatusPage() {
  return (
    <Suspense fallback={<main style={{ flex: 1, padding: 24 }} />}>
      <ClaimStatusInner />
    </Suspense>
  );
}

function ClaimStatusInner() {
  const params = useSearchParams();
  const status = (params.get("status") as Status) ?? "all";
  const pointsParam = Number(params.get("points") ?? "");
  const awardedPoints = Number.isFinite(pointsParam) && pointsParam > 0 ? pointsParam : undefined;
  const receiptParam = params.get("receipt")?.trim() || undefined;
  const { data } = useClaims();
  const isEmpty = status === "all" && data !== undefined && data.entries.length === 0;

  const list: Array<keyof typeof PANELS> = isEmpty
    ? []
    : status === "all"
    ? ["pending", "approved", "rejected"]
    : [status as keyof typeof PANELS];

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
      <Link href="/cartera" className="tap-target" style={{ textDecoration: "none", margin: "-10px -8px", alignSelf: "flex-start" }}>
        <Eyebrow>← Cartera</Eyebrow>
      </Link>
      <Eyebrow>Solicitudes · Estados</Eyebrow>

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
          Tus reclamos.
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
          {list.length} {list.length === 1 ? "reciente" : "recientes"}
        </span>
      </div>

      {isEmpty && (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "20px 0",
            borderTop: `1px solid ${colors.hairline}`
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
            Aún no has enviado solicitudes. Pídelas desde Sumar visita.
          </span>
          <Link
            href="/sumar-visita"
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
            + Sumar visita →
          </Link>
        </section>
      )}

      {list.map((key) => {
        const p = PANELS[key];
        const isApproved = key === "approved";
        return (
          <StatusPanel
            key={key}
            index={p.index}
            label={p.label}
            receipt={isApproved && receiptParam ? receiptParam : p.receipt}
            headline={p.headline}
            body={p.body}
            isGreenMoment={isApproved}
            points={isApproved ? awardedPoints : undefined}
          />
        );
      })}
      </main>
    </>
  );
}
