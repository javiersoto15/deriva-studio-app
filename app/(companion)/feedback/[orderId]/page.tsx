"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useSubmitFeedback } from "../../../../src/api/hooks";
import { colors } from "../../../../src/design/tokens";
import { Button } from "../../../../src/ui/Button";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { RatingScale } from "../../../../src/ui/RatingScale";

// Feedback — matches Paper artboard 2BD-0.
export default function FeedbackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const submit = useSubmitFeedback(orderId);
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await submit.mutateAsync({ rating, note });
    } catch (error) {
      console.error("[Deriva] feedback submit", error);
    } finally {
      setSubmitting(false);
      router.push("/cartera");
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
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <Link
          href="/actividad"
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 15,
            color: colors.brown700,
            textDecoration: "none"
          }}
        >
          ← Actividad
        </Link>
        <Link
          href="/cartera"
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 15,
            color: colors.brown700,
            textDecoration: "none"
          }}
        >
          Saltar
        </Link>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          Sobre tu visita
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 22,
              color: colors.ink900
            }}
          >
            Flat white + medialuna
          </span>
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
            Jueves · 09 May
          </span>
        </div>
      </section>

      <Eyebrow>Valoración</Eyebrow>

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
        ¿Cómo estuvo?
      </h1>

      <RatingScale value={rating} onChange={setRating} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="feedback-note"
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.inkMuted
          }}
        >
          Una nota (opcional)
        </label>
        <textarea
          id="feedback-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Cuéntanos algo si quieres…"
          rows={3}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${colors.hairline}`,
            padding: "8px 0",
            outline: "none",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            color: colors.ink900,
            resize: "none"
          }}
        />
      </div>

      <div style={{ marginTop: "auto" }}>
        <Button
          variant="primary"
          onClick={onSubmit}
          style={{ width: "100%" }}
          disabled={!rating ? "recoverable" : submitting ? "state" : false}
        >
          {submitting ? "Enviando…" : "Enviar"}
        </Button>
      </div>
      </main>
    </>
  );
}
