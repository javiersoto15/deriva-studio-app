"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { readDraft, writeDraft } from "../../../../src/lib/onboardingDraft";
import { colors } from "../../../../src/design/tokens";

// Optional email-capture step in phone-first signup. Slots between
// /ingresar/verificar (phone OTP success) and /ingresar/preferencias.
//
// We don't queue the Firebase verification action link here — the user has
// no Deriva user_profile yet, so POST /me/email would 404. Instead the email
// is captured into the onboarding draft and shipped inside the POST /members
// body at the consent step. After member creation succeeds, the consent
// page calls POST /me/email to trigger the backend's Firebase-action-link
// + Resend pipeline.
//
// Skip is a first-class action: the user can always add email later from
// /estudio via EmailAddSheet.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IngresarEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState(readDraft().email ?? "");
  const [error, setError] = useState<string | null>(null);

  function onContinue(event: FormEvent) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Revisa que el email esté bien escrito.");
      return;
    }
    writeDraft({ email: value });
    router.push("/ingresar/preferencias");
  }

  function onSkip() {
    // Clear any half-typed email to avoid an accidentally-stored value
    // arriving at /members POST.
    writeDraft({ email: undefined });
    router.push("/ingresar/preferencias");
  }

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "48px 28px 32px",
        maxWidth: 480,
        width: "100%",
        marginInline: "auto"
      }}
    >
      <Image
        src="/brand/logo-con-isotipo.svg"
        alt="Deriva Coffee Studio"
        width={148}
        height={50}
        priority
      />

      <div
        style={{
          marginTop: 28,
          alignSelf: "flex-start",
          transform: "rotate(-3deg)",
          backgroundColor: colors.brown700,
          padding: "8px 14px 9px",
          boxShadow: "3px 4px 0 rgba(94, 35, 15, 0.18)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <span
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: colors.beige100 }}
        />
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.18em",
            color: colors.beige100,
            textTransform: "uppercase"
          }}
        >
          Paso 2 · Tu email
        </span>
      </div>

      <h1
        style={{
          margin: "32px 0 0",
          fontFamily: "var(--font-display), serif",
          letterSpacing: "-0.025em"
        }}
      >
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 64,
            lineHeight: "64px",
            color: colors.brown900
          }}
        >
          Suma tu
        </span>
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 64,
            lineHeight: "68px",
            color: colors.green
          }}
        >
          email.
        </span>
      </h1>

      <p
        style={{
          margin: "20px 0 0",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 19,
          lineHeight: "28px",
          color: colors.brown900,
          maxWidth: 320
        }}
      >
        Para mandarte tu carta, tus rondas y el comprobante por sorbo.{" "}
        <span style={{ color: colors.inkMuted }}>Lo verificamos por email en un toque.</span>
      </p>

      <form
        onSubmit={onContinue}
        style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 1, backgroundColor: colors.brown700 }} />
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              color: colors.brown900,
              textTransform: "uppercase"
            }}
          >
            Tu email
          </span>
        </div>
        <div style={{ paddingBottom: 12, borderBottom: `1px solid ${colors.brown700}` }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 24,
              color: colors.brown900
            }}
          />
        </div>
        {error && (
          <div role="alert" style={errorStyle}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={!EMAIL_RE.test(email.trim())}
          style={ctaStyle(EMAIL_RE.test(email.trim()))}
        >
          <span>Continuar</span>
          <svg width="20" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
            <path
              d="M1 7 H 20 M 14 1 L 20 7 L 14 13"
              stroke={colors.beige100}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </form>

      <div style={{ marginTop: "auto", paddingTop: 36, textAlign: "center" }}>
        <button type="button" onClick={onSkip} style={skipButtonStyle}>
          Saltar por ahora
        </button>
        <p style={skipExplainerStyle}>Puedes sumarlo después en Estudio.</p>
      </div>
    </main>
  );
}

function ctaStyle(enabled: boolean): React.CSSProperties {
  return {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    padding: "0 24px",
    width: "100%",
    height: 56,
    backgroundColor: colors.brown700,
    color: colors.beige100,
    border: "none",
    borderRadius: 999,
    boxShadow: "4px 5px 0 rgba(94, 35, 15, 0.2)",
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  };
}

const errorStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderLeft: `2px solid ${colors.brown700}`,
  backgroundColor: "rgba(94, 35, 15, 0.04)",
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 14,
  color: colors.brown900
};

const skipButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: colors.inkMuted,
  textDecoration: "underline",
  textUnderlineOffset: 3
};

const skipExplainerStyle: React.CSSProperties = {
  marginTop: 6,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 13,
  color: colors.inkMuted,
  maxWidth: 280,
  marginInline: "auto",
  textAlign: "center"
};
