"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Member } from "../../../../src/api/hooks";
import { RedeemCampaignTokenError, useAddEmail, useRedeemCampaignToken } from "../../../../src/api/hooks";
import { setEmailVerificationReturn } from "../../../../src/lib/emailVerificationReturn";
import { useAuth } from "../../../../src/auth/use-auth";
import { colors } from "../../../../src/design/tokens";
import type { MemberWithFirstName } from "../../../../src/lib/member";
import { clearDraft, readDraft } from "../../../../src/lib/onboardingDraft";
import { Button } from "../../../../src/ui/Button";
import { Eyebrow } from "../../../../src/ui/Eyebrow";
import { StepProgress } from "../../../../src/ui/StepProgress";
import { ToggleRow } from "../../../../src/ui/Toggle";

const STORAGE_KEY = "derivaCampaignToken";

function readToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function clearToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Consent — matches Paper artboard 25P-0.
export default function ConsentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getIdToken } = useAuth();
  const redeemCampaignToken = useRedeemCampaignToken();
  const addEmail = useAddEmail();
  const [marketing, setMarketing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function attemptRedeem(token: string, attempt = 0): Promise<void> {
    try {
      const result = await redeemCampaignToken.mutateAsync({ token });
      // §3.5 success — seed the cached Member with the reconciled email +
      // first_name so /carta can greet the customer by name without waiting
      // for the next /me roundtrip.
      clearToken();
      queryClient.setQueryData<MemberWithFirstName | undefined>(["me"], (prev) => {
        const base: Partial<Member> = prev ?? {};
        return {
          ...(base as Member),
          email: result.email,
          first_name: result.first_name
        } as MemberWithFirstName;
      });
    } catch (err) {
      if (err instanceof RedeemCampaignTokenError) {
        // Terminal errors — clear and proceed silently. No error UI per spec.
        if (err.status === 410 || err.status === 404 || err.status === 409) {
          if (err.status === 409) {
            // eslint-disable-next-line no-console
            console.warn("[redeem-campaign-token] email conflict (409); proceeding without reconciliation");
          }
          clearToken();
          return;
        }
      }
      // Network / 5xx — retry once with exponential backoff, then give up.
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        return attemptRedeem(token, attempt + 1);
      }
      clearToken();
    }
  }

  async function createAccount() {
    setSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("missing Firebase ID token");
      }
      const now = new Date().toISOString();
      // Pull the full onboarding draft (name + preferences captured on step 3)
      // and send everything in one envelope. Backend's Onboarding flow honors
      // profile.Name when set and persists profile.Preferences via insertMemberTx.
      const draft = readDraft();
      const res = await fetch(`${base}/members`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: draft.name || undefined,
          // Optional captured email — backend persists with
          // email_verified_at=null. We trigger the verification action link
          // separately after the member row exists (see post-creation block
          // below). The phone is already on the Firebase bearer (with a
          // verified phone_number claim), so the backend reads it from
          // there — no need to include it in this body.
          email: draft.email || undefined,
          preferences: {
            favorite_drink: draft.favorite_drink,
            milk: draft.milk,
            dietary_notes: draft.note
          },
          notification_prefs: {
            transactional: true,
            marketing
          },
          consent_timestamps: {
            terms_accepted_at: now,
            marketing_at: marketing ? now : undefined,
            transactional_at: now
          }
        })
      });
      if (!res.ok) {
        throw new Error(`POST /members failed: ${res.status}`);
      }
      // Capture the email before clearing the draft so we can kick off the
      // verification action link after the member row exists.
      const capturedEmail = draft.email?.trim();
      // Member row exists now — draft has served its purpose.
      clearDraft();
      // Prime the /me cache from the response so /carta renders the new
      // identity without waiting for a refetch.
      try {
        const created = (await res.json()) as Member;
        queryClient.setQueryData(["me"], created);
      } catch {
        // body parse failure is non-fatal; React Query will refetch
      }

      // §3.5 — if the user arrived from an Apertura deep-link, redeem the
      // campaign token now that a Firebase-backed member exists.
      const token = readToken();
      if (token) {
        await attemptRedeem(token);
      }

      // If the user supplied an email during onboarding, queue the
      // Firebase action-link verification now that user_profile + member
      // exist. Failures here are non-fatal — the user can resend from
      // /estudio. We swallow conflicts (email_taken would be very rare
      // here since /members just accepted it) to avoid blocking the
      // splash transition.
      if (capturedEmail) {
        try {
          setEmailVerificationReturn("/carta");
          await addEmail.mutateAsync({ email: capturedEmail });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("[Deriva] email verification queue failed", err);
        }
      }
    } catch (error) {
      console.error("[Deriva] consentimiento submit", error);
    } finally {
      router.push("/carta");
    }
  }

  return (
    <main style={{ flex: 1, padding: "max(24px, calc(env(safe-area-inset-top) + 16px)) 24px max(32px, calc(env(safe-area-inset-bottom) + 24px))", display: "flex", flexDirection: "column", gap: 32 }}>
      <StepProgress current={4} total={4} backHref="/ingresar/preferencias" />

      <Eyebrow>Permisos · Último paso</Eyebrow>

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
        Antes de empezar
      </h1>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <ToggleRow
          label="Marketing · Tandas y eventos"
          description="Quiero saber de nuevas tandas y eventos"
          checked={marketing}
          onChange={setMarketing}
        />
        <ToggleRow
          label="Analítica · Datos anónimos"
          description="Ayúdanos a mejorar con datos anónimos"
          checked={analytics}
          onChange={setAnalytics}
        />
      </div>

      <Link
        href="/privacidad"
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.brown700,
          textDecoration: "none"
        }}
      >
        Política de privacidad · términos
      </Link>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" onClick={createAccount} disabled={submitting ? "state" : false}>
          {submitting ? "Creando…" : "Crear cuenta"}
        </Button>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: colors.inkMuted,
          margin: 0
        }}
      >
        Responsable de datos: Nucleo Studio Group SpA.
      </p>
    </main>
  );
}
