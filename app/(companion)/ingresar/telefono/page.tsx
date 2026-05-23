"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "../../../../src/auth/use-auth";
import { colors } from "../../../../src/design/tokens";
import { OtpGrid } from "../../../../src/ui/OtpGrid";

// SSO-first signup step 2 of N — mandatory phone capture.
//
// The user has just authenticated via Google/Apple/email-link. Firebase has
// a user record but Postgres does not yet — no auth_identity, no member.
// We drive Firebase linkWithPhoneNumber against the current user so the
// resulting ID token carries a verified phone_number claim. The subsequent
// POST /members in /ingresar/consentimiento then creates the user_profile
// with both providers (SSO + phone) and a populated phone_verified_at.
//
// We deliberately do NOT call POST /me/phone or POST /me/phone/confirm here
// — those endpoints assume an existing Deriva user_profile. For first-time
// signup, all provider claims ride in on the bearer for the /members call.

const OTP_LENGTH = 6;

type Stage =
  | { kind: "phone_input" }
  | { kind: "sending" }
  | { kind: "otp"; phone: string; error: string | null }
  | { kind: "confirming" };

export default function TelefonoCapturePage() {
  const router = useRouter();
  const { linkPhone, verifyLinkOtp } = useAuth();
  const [digits, setDigits] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [stage, setStage] = useState<Stage>({ kind: "phone_input" });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function onSubmitPhone(event: FormEvent) {
    event.preventDefault();
    if (digits.length !== 8) return;
    const phone = `+569${digits}`;
    setStage({ kind: "sending" });
    setPhoneError(null);
    const result = await linkPhone(phone);
    if (!result.ok) {
      setStage({ kind: "phone_input" });
      setPhoneError(result.message);
      return;
    }
    setOtp(Array(OTP_LENGTH).fill(""));
    setStage({ kind: "otp", phone, error: null });
  }

  async function onSubmitOtp(event: FormEvent) {
    event.preventDefault();
    if (stage.kind !== "otp") return;
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;
    setStage({ kind: "confirming" });
    const result = await verifyLinkOtp(code);
    if (!result.ok) {
      setStage({ ...stage, error: result.message });
      return;
    }
    // Firebase token now carries verified phone_number. Continue to the
    // existing onboarding sequence; POST /members at the consent step will
    // bind phone+SSO to the new user_profile.
    router.push("/ingresar/preferencias");
  }

  const onOtpStage = stage.kind === "otp" || stage.kind === "confirming";

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding:
          "max(48px, calc(env(safe-area-inset-top) + 24px)) 28px max(32px, calc(env(safe-area-inset-bottom) + 24px))",
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
          {onOtpStage ? "Paso 2 · Confirma el código" : "Paso 2 · Tu teléfono"}
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
          {onOtpStage ? "Te llegó" : "Suma tu"}
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
          {onOtpStage ? "un código." : "teléfono."}
        </span>
      </h1>

      {!onOtpStage && (
        <>
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
            Para que la barra te encuentre cuando llegues.{" "}
            <span style={{ color: colors.inkMuted }}>Te mandamos un código por SMS.</span>
          </p>

          <form onSubmit={onSubmitPhone} style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
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
                Tu teléfono
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 12,
                borderBottom: `1px solid ${colors.brown700}`
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 24,
                  letterSpacing: "0.01em",
                  color: colors.inkMuted
                }}
              >
                +56 9
              </span>
              <input
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="•••• ••••"
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
                aria-label="Número de teléfono"
                style={{
                  flex: 1,
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
            {phoneError && (
              <div role="alert" style={errorStyle}>
                {phoneError}
              </div>
            )}
            <button
              type="submit"
              disabled={digits.length !== 8 || stage.kind === "sending"}
              style={ctaStyle(digits.length === 8 && stage.kind !== "sending")}
            >
              <span>{stage.kind === "sending" ? "Enviando…" : "Mándame el código"}</span>
              <ArrowRight />
            </button>
          </form>

          <div style={{ marginTop: "auto", paddingTop: 36, textAlign: "center" }}>
            <button
              type="button"
              title="Lo necesitamos para encontrarte en la barra y registrar tus rondas."
              style={whyButtonStyle}
            >
              ¿Por qué pedimos esto?
            </button>
            <p style={whyExplainerStyle}>
              Tu email ya está conectado. Solo falta el teléfono.
            </p>
          </div>
        </>
      )}

      {onOtpStage && (
        <>
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
            Enviado al <span style={{ color: colors.brown700 }}>+56 9 {digits.slice(0, 4)} {digits.slice(4)}</span>.{" "}
            <span style={{ color: colors.inkMuted }}>Ingresa los 6 dígitos.</span>
          </p>
          <form onSubmit={onSubmitOtp} style={{ marginTop: 36 }}>
            <OtpGrid
              value={otp}
              onChange={(next) => {
                setOtp(next);
                if (stage.kind === "otp" && stage.error) {
                  setStage({ ...stage, error: null });
                }
              }}
              length={OTP_LENGTH}
              error={stage.kind === "otp" && Boolean(stage.error)}
              ariaLabel="Código de 6 dígitos enviado por SMS"
            />
            {stage.kind === "otp" && stage.error && (
              <div role="alert" style={{ ...errorStyle, marginTop: 12 }}>
                {stage.error}
              </div>
            )}
            <button
              type="submit"
              disabled={otp.join("").length !== OTP_LENGTH || stage.kind === "confirming"}
              style={{
                ...ctaStyle(otp.join("").length === OTP_LENGTH && stage.kind !== "confirming"),
                marginTop: 24
              }}
            >
              <span>{stage.kind === "confirming" ? "Confirmando…" : "Confirmar"}</span>
              <ArrowRight />
            </button>
          </form>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => {
                setStage({ kind: "phone_input" });
                setOtp(Array(OTP_LENGTH).fill(""));
              }}
              style={whyButtonStyle}
            >
              Cambiar número
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function ArrowRight() {
  return (
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

const whyButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: colors.brown700,
  textDecoration: "underline",
  textUnderlineOffset: 3
};

const whyExplainerStyle: React.CSSProperties = {
  marginTop: 8,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 13,
  color: colors.inkMuted,
  maxWidth: 280,
  marginInline: "auto",
  textAlign: "center"
};
