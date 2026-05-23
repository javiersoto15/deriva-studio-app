"use client";

import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { apiClient, type MemberSelfProfile } from "../../../src/api/hooks";
import { useAuth } from "../../../src/auth/use-auth";
import { colors } from "../../../src/design/tokens";

// §3.5 — campaign-token deep-link reader. Persists ?ct=<token> from the
// Apertura email into sessionStorage so the consent step can call
// /me/redeem-campaign-token after signup. Renders nothing.
function CampaignTokenCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const token = params.get("ct");
    if (!token) return;
    try {
      sessionStorage.setItem("derivaCampaignToken", token);
    } catch {
      // Storage unavailable (private mode, etc.) — silently no-op.
    }
  }, [params]);
  return null;
}

// After a fresh Firebase identity is established, probe /me to learn whether
// it already maps to a Deriva user_profile. Returning users skip onboarding;
// new SSO users still need to capture a phone (Deriva loyalty is phone-bound
// at the counter).
type ProbeResult =
  | { kind: "exists"; profile: MemberSelfProfile }
  | { kind: "new" };

async function probeMember(): Promise<ProbeResult> {
  const probe = apiClient.GET("/me").then<ProbeResult>(({ data, response }) => {
    if (data) return { kind: "exists", profile: data };
    if (response?.status === 404) return { kind: "new" };
    return { kind: "new" };
  });
  const timeout = new Promise<ProbeResult>((resolve) =>
    setTimeout(() => resolve({ kind: "new" }), 1500)
  );
  return Promise.race([probe, timeout]);
}

export default function IngresarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signInWithPhone, signInWithGoogle, signInWithApple } = useAuth();
  const [digits, setDigits] = useState("");
  const [submitting, setSubmitting] = useState<"phone" | "google.com" | "apple.com" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPhoneSubmit(event: FormEvent) {
    event.preventDefault();
    if (digits.length < 8) return;
    setSubmitting("phone");
    setError(null);
    const result = await signInWithPhone(`+569${digits}`);
    setSubmitting(null);
    if (!result.ok) {
      setError(result.message || "No pudimos enviar el código. Revisa tu número.");
      return;
    }
    router.push("/ingresar/verificar");
  }

  async function onSso(provider: "google.com" | "apple.com") {
    setSubmitting(provider);
    setError(null);
    const result =
      provider === "google.com" ? await signInWithGoogle() : await signInWithApple();
    if (!result.ok) {
      setSubmitting(null);
      if (result.code !== "auth/popup-closed-by-user" && result.code !== "auth/cancelled-popup-request") {
        setError(result.message);
      }
      return;
    }
    const probe = await probeMember();
    setSubmitting(null);
    if (probe.kind === "exists") {
      queryClient.setQueryData(["me"], probe.profile);
      router.push("/carta");
      return;
    }
    // New SSO identity — Deriva needs a phone before the loyalty surfaces are
    // useful at the counter.
    router.push("/ingresar/telefono");
  }

  const phoneReady = digits.length === 8;
  const busy = submitting !== null;

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
        marginInline: "auto",
        position: "relative"
      }}
    >
      <Suspense fallback={null}>
        <CampaignTokenCapture />
      </Suspense>

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
          Tu ingreso · Tres formas
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
          Hola.
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
          Empecemos.
        </span>
      </h1>

      <form
        onSubmit={onPhoneSubmit}
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
            Con tu teléfono
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
              letterSpacing: "0.01em",
              color: colors.brown900,
              padding: 0
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!phoneReady || busy}
          style={{
            marginTop: 8,
            position: "relative",
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
            opacity: !phoneReady ? 0.5 : 1,
            cursor: !phoneReady || busy ? "not-allowed" : "pointer",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase"
          }}
        >
          <span>{submitting === "phone" ? "Enviando…" : "Mándame el código"}</span>
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

      <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(94, 35, 15, 0.25)" }} />
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 18,
            color: colors.inkMuted
          }}
        >
          o
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: "rgba(94, 35, 15, 0.25)" }} />
      </div>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <SsoButton provider="google.com" onClick={() => onSso("google.com")} loading={submitting === "google.com"} />
        <SsoButton provider="apple.com" onClick={() => onSso("apple.com")} loading={submitting === "apple.com"} disabled />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 24,
            padding: "10px 14px",
            borderLeft: `2px solid ${colors.brown700}`,
            backgroundColor: "rgba(94, 35, 15, 0.04)",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: 14,
            color: colors.brown900
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14
        }}
      >
        <p
          style={{
            margin: 0,
            maxWidth: 300,
            textAlign: "center",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: 14,
            lineHeight: "20px",
            color: colors.inkMuted
          }}
        >
          Al continuar aceptas nuestros{" "}
          <a href="/privacidad" style={{ color: colors.brown700, textUnderlineOffset: 2 }}>
            términos
          </a>{" "}
          y la{" "}
          <a href="/privacidad" style={{ color: colors.brown700, textUnderlineOffset: 2 }}>
            privacidad
          </a>
          .
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: "0.06em",
              color: colors.inkMuted
            }}
          >
            ¿Vienes de la lista?
          </span>
          <span
            style={{
              fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: "0.22em",
              color: colors.brown700,
              textTransform: "uppercase",
              textDecoration: "underline",
              textUnderlineOffset: 3
            }}
            title="Abre el enlace del correo de Apertura para activar tu cuenta automáticamente."
          >
            Activa tu Deriva
          </span>
        </div>
      </div>
    </main>
  );
}

function SsoButton({
  provider,
  onClick,
  loading,
  disabled = false
}: {
  provider: "google.com" | "apple.com";
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  const isGoogle = provider === "google.com";
  const bg = isGoogle ? colors.beige100 : colors.brown900;
  const fg = isGoogle ? colors.brown900 : colors.beige100;
  const border = isGoogle ? colors.brown700 : colors.brown900;
  const inactive = disabled || loading;
  const label = disabled
    ? isGoogle
      ? "Google · Próximamente"
      : "Apple · Próximamente"
    : loading
      ? "Conectando…"
      : isGoogle
        ? "Continuar con Google"
        : "Continuar con Apple";
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={inactive}
      aria-disabled={disabled || undefined}
      title={disabled ? "Próximamente — por ahora ingresa con tu teléfono" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        height: 52,
        width: "100%",
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 999,
        boxShadow: disabled ? "none" : `3px 4px 0 ${isGoogle ? "rgba(94, 35, 15, 0.12)" : "rgba(40, 26, 18, 0.18)"}`,
        cursor: inactive ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : loading ? 0.7 : 1,
        filter: disabled ? "grayscale(1)" : "none",
        fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.18em",
        color: fg,
        textTransform: "uppercase"
      }}
    >
      {isGoogle ? <GoogleMark /> : <AppleMark color={fg} />}
      <span>{label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.95 10.71A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.17.29-1.71V4.95H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.96 4.05l2.99-2.34z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleMark({ color }: { color: string }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill={color} aria-hidden>
      <path d="M13.07 10.62c-.02-2.35 1.92-3.48 2.01-3.54-1.1-1.6-2.81-1.82-3.41-1.85-1.45-.15-2.84.85-3.58.85-.75 0-1.89-.83-3.11-.81-1.6.02-3.07.93-3.9 2.36-1.66 2.88-.42 7.13 1.2 9.46.79 1.13 1.73 2.41 2.96 2.36 1.19-.05 1.63-.77 3.07-.77 1.44 0 1.84.77 3.1.74 1.28-.02 2.09-1.16 2.87-2.29.9-1.32 1.27-2.6 1.29-2.67-.03-.01-2.48-.95-2.5-3.84zM10.7 3.71c.65-.79 1.09-1.89.97-2.98-.94.04-2.07.62-2.74 1.41-.6.7-1.13 1.82-.99 2.89 1.04.08 2.11-.53 2.76-1.32z" />
    </svg>
  );
}
