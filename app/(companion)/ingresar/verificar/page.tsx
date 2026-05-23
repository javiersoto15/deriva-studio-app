"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient, type MemberSelfProfile } from "../../../../src/api/hooks";
import { useAuth } from "../../../../src/auth/use-auth";
import { colors } from "../../../../src/design/tokens";
import { Button } from "../../../../src/ui/Button";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { OtpGrid } from "../../../../src/ui/OtpGrid";
import { StepProgress } from "../../../../src/ui/StepProgress";

// After OTP verify, ask the backend whether this Firebase identity already has
// a member profile. Firebase verifies identity only; the Deriva-owned mapping
// lives in Postgres (`auth_identities` → `user_profiles` → `member_id`).
// /me resolves this transparently — we never see the firebase_uid client-side
// (only the bearer token), and a 200 from /me means the auth_identity already
// links to an existing member, so we skip onboarding and route to /carta.
//
// Resolves to:
//   { kind: "exists", profile } → backend returned a member profile → route to /carta
//   { kind: "new" }              → backend returned 404 → route to /ingresar/preferencias
//   { kind: "timeout" }          → /me didn't answer in time → treat as "new"
//
// The 1500ms cap is deliberately tight: returning users on a warm connection
// will be sub-300ms; anything slower and we'd rather show preferences (the
// backend ignores the body on replay) than freeze on the verify screen.
type ProbeResult =
  | { kind: "exists"; profile: MemberSelfProfile }
  | { kind: "new" }
  | { kind: "timeout" };

async function probeExistingMember(): Promise<ProbeResult> {
  const probe = apiClient.GET("/me").then<ProbeResult>(({ data, response }) => {
    if (data) return { kind: "exists", profile: data };
    if (response?.status === 404) return { kind: "new" };
    // 401/403/5xx — fall through to "new" so we don't trap the user on
    // verify. The onboarding handler's replay-as-200 path will recover.
    return { kind: "new" };
  });
  const timeout = new Promise<ProbeResult>((resolve) =>
    setTimeout(() => resolve({ kind: "timeout" }), 1500)
  );
  return Promise.race([probe, timeout]);
}

// SMS verify — matches Paper artboard 24I-0.
const LENGTH = 6;

export default function VerifyOtpPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { verifyOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(42);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const code = digits.join("");
  const ready = code.length === LENGTH;

  function onOtpChange(next: string[]) {
    if (error) setError(null);
    setDigits(next);
  }

  async function onConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await verifyOtp(code);
    if (!result.ok) {
      setSubmitting(false);
      // No silent navigation — surface failure inline beneath the code grid.
      setError(result.message || "El código no es válido o expiró. Pídenos otro.");
      return;
    }
    // Phone re-registration branch: if this Firebase identity already maps
    // to a member, skip onboarding and seed the cache so /carta paints with
    // the real profile on first frame.
    const probe = await probeExistingMember();
    setSubmitting(false);
    if (probe.kind === "exists") {
      queryClient.setQueryData(["me"], probe.profile);
      router.push("/carta");
      return;
    }
    // New phone-first user. Send through the optional email-capture step
    // first; the user can skip and continue to preferences either way.
    router.push("/ingresar/email");
  }

  const mm = Math.floor(countdown / 60);
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <main style={{ flex: 1, padding: "max(24px, calc(env(safe-area-inset-top) + 16px)) 24px max(32px, calc(env(safe-area-inset-bottom) + 24px))", display: "flex", flexDirection: "column", gap: 32 }}>
      <StepProgress current={2} total={4} backHref="/ingresar" />

      <Eyebrow>Verificación · SMS</Eyebrow>

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
        Confirma con el código
      </h1>

      <OtpGrid
        value={digits}
        onChange={onOtpChange}
        length={LENGTH}
        error={Boolean(error)}
        ariaLabel="Código de 6 dígitos enviado por SMS"
        describedById={error ? "otp-error" : undefined}
      />

      {error && (
        <div
          id="otp-error"
          role="alert"
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: colors.errorBrown
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        Enviado al +56 9 •• •• 4421
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: colors.inkMuted
        }}
      >
        Reenviar en {mm}:{ss}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={!ready ? "recoverable" : submitting ? "state" : false}
        >
          {submitting ? "Verificando…" : "Confirmar"}
        </Button>
      </div>
    </main>
  );
}
