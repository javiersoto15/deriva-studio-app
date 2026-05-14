"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "../../../src/auth/use-auth";
import { colors } from "../../../src/design/tokens";

// Firebase action-code landing.
//
// The user clicks a verification or sign-in-link in their inbox; Firebase
// routes them here with `mode` + `oobCode` URL params. Three Firebase modes
// can land:
//
//   * mode=signIn       → Firebase email-link sign-in. Use signInWithEmailLink
//                          via AuthProvider.completeEmailLink.
//   * mode=verifyEmail  → Firebase pure verify-email. Use applyActionCode.
//                          The backend's email_verified_at reconciler picks
//                          it up on next /me/identity.
//   * unrecognized      → expired/already-consumed link.
//
// Three terminal surfaces match Paper artboards 49M-1 / 49N-1 / 49O-1:
//   - success
//   - expired (link no longer valid; offer "Mándame otro enlace")
//   - already-verified

type Stage =
  | { kind: "checking" }
  | { kind: "success"; mode: "signIn" | "verifyEmail" }
  | { kind: "expired" }
  | { kind: "already_verified" };

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { completeEmailLink, applyActionCode } = useAuth();
  const [stage, setStage] = useState<Stage>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");
    if (!oobCode) {
      setStage({ kind: "expired" });
      return;
    }

    async function run() {
      if (mode === "signIn") {
        const result = await completeEmailLink(window.location.href);
        if (cancelled) return;
        if (result.ok) {
          setStage({ kind: "success", mode: "signIn" });
        } else if (result.code === "auth/invalid-action-code" || result.code === "auth/invalid-email-link") {
          setStage({ kind: "expired" });
        } else {
          // Already-signed-in users that hit a stale link get auth/...; surface
          // as already-verified since the practical outcome is "we already
          // know who you are."
          setStage({ kind: "already_verified" });
        }
        return;
      }
      // Default: treat as verifyEmail (or revoke). applyActionCode handles
      // both; failure indicates expired or already-consumed.
      const result = await applyActionCode(oobCode!);
      if (cancelled) return;
      if (result.ok) {
        setStage({ kind: "success", mode: "verifyEmail" });
      } else if (result.code === "auth/invalid-action-code" || result.code === "auth/expired-action-code") {
        setStage({ kind: "expired" });
      } else {
        setStage({ kind: "already_verified" });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [params, completeEmailLink, applyActionCode]);

  return <Surface stage={stage} onContinue={() => router.push("/carta")} />;
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={<Surface stage={{ kind: "checking" }} onContinue={() => undefined} />}
    >
      <VerifyEmailInner />
    </Suspense>
  );
}

function Surface({ stage, onContinue }: { stage: Stage; onContinue: () => void }) {
  const config = surfaceConfig(stage);
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
          marginTop: 36,
          alignSelf: "flex-start",
          transform: "rotate(-3deg)",
          backgroundColor: config.stickerBg,
          padding: "8px 14px 9px",
          boxShadow: `3px 4px 0 ${config.stickerShadow}`,
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <span
          aria-hidden
          style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: colors.beige100 }}
        />
        <span
          style={{
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.18em",
            color: colors.beige100,
            textTransform: "uppercase"
          }}
        >
          {config.eyebrow}
        </span>
      </div>

      <h1
        style={{
          margin: "44px 0 0",
          fontFamily: "var(--font-display), serif",
          letterSpacing: "-0.025em"
        }}
      >
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 56,
            lineHeight: "56px",
            color: colors.brown900
          }}
        >
          {config.headLead}
        </span>
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 56,
            lineHeight: "60px",
            color: config.headAccentColor
          }}
        >
          {config.headAccent}
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
        {config.body}
      </p>

      <div style={{ marginTop: "auto", paddingTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
        {stage.kind === "expired" ? (
          <>
            <Link href="/estudio" style={{ textDecoration: "none" }}>
              <button type="button" style={ctaStyle(true)}>
                <span>Volver a Estudio</span>
                <ArrowRight />
              </button>
            </Link>
            <Link
              href="/inicio"
              style={{
                alignSelf: "center",
                fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: colors.inkMuted,
                textDecoration: "underline",
                textUnderlineOffset: 3
              }}
            >
              Volver al inicio
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            disabled={stage.kind === "checking"}
            style={ctaStyle(stage.kind !== "checking")}
          >
            <span>{stage.kind === "checking" ? "Verificando…" : "Continuar a Deriva"}</span>
            <ArrowRight />
          </button>
        )}
      </div>
    </main>
  );
}

function surfaceConfig(stage: Stage) {
  switch (stage.kind) {
    case "checking":
      return {
        stickerBg: colors.inkMuted,
        stickerShadow: "rgba(94, 35, 15, 0.12)",
        eyebrow: "Confirmando…",
        headLead: "Un momento.",
        headAccent: "Estamos confirmando.",
        headAccentColor: colors.brown700,
        body: "Verificando tu enlace con Deriva. Esto toma un segundo."
      };
    case "success":
      return {
        stickerBg: colors.green,
        stickerShadow: "rgba(0, 49, 31, 0.18)",
        eyebrow: "Email verificado",
        headLead: "Listo.",
        headAccent: "Email confirmado.",
        headAccentColor: colors.green,
        body:
          stage.mode === "signIn"
            ? "Te dejamos dentro. Tu email queda enlazado a tu cuenta y empezamos a mandarte comprobantes."
            : "Tu email queda enlazado a tu cuenta. Empezamos a mandarte comprobantes y rondas nuevas."
      };
    case "expired":
      return {
        stickerBg: colors.brown700,
        stickerShadow: "rgba(94, 35, 15, 0.18)",
        eyebrow: "Enlace caducado",
        headLead: "Este enlace",
        headAccent: "ya descansa.",
        headAccentColor: colors.green,
        body:
          "Caducó o alguien lo abrió antes que tú. Pide otro enlace desde Estudio cuando quieras."
      };
    case "already_verified":
      return {
        stickerBg: colors.inkMuted,
        stickerShadow: "rgba(94, 35, 15, 0.12)",
        eyebrow: "Ya estaba listo",
        headLead: "Este email",
        headAccent: "ya está dentro.",
        headAccentColor: colors.green,
        body: "Tu email ya está verificado y conectado a tu cuenta. No tienes que hacer nada más."
      };
  }
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
