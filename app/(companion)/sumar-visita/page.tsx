"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useSubmitReceiptClaim } from "../../../src/api/hooks";
import { colors } from "../../../src/design/tokens";
import { Button } from "../../../src/ui/Button";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { Input } from "../../../src/ui/Input";

// Sumar visita — POST /me/receipt-claims. Backend verifies the SumUp
// transaction server-side, derives time + CLP amount, and awards points
// when the transaction is successful and unclaimed.
//
// Error → inline copy mapping is intentional: the global QueryProvider
// toast is silenced (meta.silent) on this mutation so receipt-specific
// reasons surface where the customer is reading.
function messageForStatus(status: number | null, body: unknown): string {
  const bodyMsg =
    body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
      ? ((body as { message: string }).message)
      : null;
  switch (status) {
    case 400:
      return bodyMsg ?? "Revisa el código. La transacción debe ser válida y reciente.";
    case 401:
      return "Tu sesión expiró. Vuelve a ingresar.";
    case 403:
      return "Tu cuenta aún no está habilitada para sumar visitas.";
    case 404:
      return "No encontramos una transacción con ese código.";
    case 502:
      return "No pudimos verificar la transacción con SumUp. Inténtalo en un momento.";
    case 503:
      return "El verificador de recibos está en pausa. Vuelve a intentarlo más tarde.";
    default:
      return bodyMsg ?? "No pudimos procesar el código. Inténtalo otra vez.";
  }
}

export default function SumarVisitaPage() {
  const router = useRouter();
  const submit = useSubmitReceiptClaim();
  const [code, setCode] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText(null);
    const trimmed = code.trim();
    if (trimmed.length === 0) {
      setErrorText("Ingresa el código de la transacción.");
      return;
    }
    try {
      const result = await submit.mutateAsync({ transaction_code: trimmed });
      const points = result.ledger_entry?.points ?? 0;
      const params = new URLSearchParams({
        status: "approved",
        points: String(points),
        receipt: trimmed
      });
      router.push(`/sumar-visita/estado?${params.toString()}`);
    } catch (err) {
      const status =
        err && typeof err === "object" && typeof (err as { status?: unknown }).status === "number"
          ? ((err as { status: number }).status)
          : null;
      const body = err && typeof err === "object" ? (err as { body?: unknown }).body : null;
      setErrorText(messageForStatus(status, body));
    }
  }

  const submitting = submit.isPending;

  return (
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
      <Link
        href="/cartera"
        className="tap-target"
        style={{ textDecoration: "none", margin: "-10px -8px", alignSelf: "flex-start" }}
      >
        <Eyebrow>← Cartera</Eyebrow>
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
        ¿Olvidaste mostrar tu código en la barra?
        <br />
        Ingresa el código de la transacción que aparece en tu recibo y sumamos los puntos.
      </p>

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Código de transacción"
          value={code}
          onChange={(e) => {
            setErrorText(null);
            setCode(e.target.value);
          }}
          placeholder="TEYW7E8GR4"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />

        {errorText && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontFamily: "Poppins, sans-serif",
              fontSize: 13,
              lineHeight: "20px",
              color: colors.brown700
            }}
          >
            {errorText}
          </p>
        )}

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
            Verificamos cada recibo con SumUp · sólo transacciones aprobadas en los últimos días.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          style={{ width: "100%" }}
          disabled={submitting ? "state" : false}
        >
          {submitting ? "Verificando…" : "Sumar puntos"}
        </Button>
      </form>
    </main>
  );
}
