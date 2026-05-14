"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useSubmitClaim } from "../../../src/api/hooks";
import { colors } from "../../../src/design/tokens";
import { Button } from "../../../src/ui/Button";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { Input } from "../../../src/ui/Input";

// Sumar visita — matches Paper artboard 15O-0.
export default function SumarVisitaPage() {
  const router = useRouter();
  const submit = useSubmitClaim();
  const [receipt, setReceipt] = useState("2026-0431");
  const [date, setDate] = useState("06 MAY");
  const [time, setTime] = useState("10:24");
  const [total, setTotal] = useState("4800");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The backend derives member_id from the authenticated Firebase identity.
      await submit.mutateAsync({
        receipt,
        purchase_at: `${date} ${time}`,
        amount_clp: Number(total)
      });
    } catch (error) {
      console.error("[Deriva] sumar-visita submit claim", error);
    } finally {
      setSubmitting(false);
      router.push("/sumar-visita/estado?status=pending");
    }
  }

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
      <Link href="/estudio" className="tap-target" style={{ textDecoration: "none", margin: "-10px -8px", alignSelf: "flex-start" }}>
        <Eyebrow>← Studio</Eyebrow>
      </Link>

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
        Sumar una visita anterior
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
        ¿Pasaste por Deriva y olvidaste mostrar tu código?
        <br />
        Cuéntanos del recibo y sumamos los puntos.
      </p>

      {/* Espresso card — scan QR option */}
      <button
        type="button"
        style={{
          background: colors.brown900,
          color: colors.beige100,
          borderRadius: 16,
          padding: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          border: "none",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <span
          aria-hidden
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: `1px solid ${colors.beige100}`,
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 18
          }}
        >
          ▦
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 18,
              color: colors.beige100
            }}
          >
            Escanea el QR del recibo
          </span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: colors.beige300 }}>
            La forma más rápida — se aprueba al instante.
          </span>
        </div>
        <span style={{ color: colors.beige100, fontSize: 18 }}>→</span>
      </button>

      {/* "o" divider */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 17,
            color: colors.inkMuted
          }}
        >
          o
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <span style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
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
            Ingresa a mano
          </span>
          <span style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Número de recibo"
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
          placeholder="2026-0431"
        />
        <div style={{ display: "flex", gap: 16 }}>
          <Input label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} placeholder="06 MAY" />
          <Input label="Hora" value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:24" />
        </div>
        <Input
          label="Total CLP"
          prefix="$"
          inputMode="numeric"
          value={total}
          onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
          placeholder="4.800"
        />

        <div
          style={{
            borderRadius: 8,
            border: `1px dashed ${colors.hairline}`,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: colors.inkMuted
          }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>
            ◷
          </span>
          <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 13 }}>
            Adjuntar foto del recibo · opcional
          </span>
        </div>

        <div
          style={{
            backgroundColor: "rgba(94,35,15,0.06)",
            padding: "14px 16px",
            borderRadius: 4
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: colors.brown700,
              lineHeight: "18px"
            }}
          >
            Revisamos cada recibo a mano mientras integramos SumUp. Hasta 7 días atrás · máx 3 pendientes.
          </p>
        </div>

        <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={submitting ? "state" : false}>
          {submitting ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
      </main>
    </>
  );
}
