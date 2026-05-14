"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  parseIdentityConflict,
  useAddPhone,
  useConfirmPhone,
  type IdentityConflict,
  type LinkedProvider
} from "../api/hooks";
import { useAuth } from "../auth/use-auth";
import { colors } from "../design/tokens";
import { Button } from "./Button";
import { Input } from "./Input";
import { OtpGrid } from "./OtpGrid";
import { Sheet } from "./Sheet";

// Add or change the member's phone. The new contract is two-step:
//
//   1. POST /me/phone        — preflight uniqueness; backend returns
//                              202 { ready: true } or 409 IdentityConflict.
//   2. Firebase linkPhone     — frontend drives Firebase phone OTP against
//                              the *current* (already-authed) user via
//                              linkWithPhoneNumber, so the user's primary
//                              session is preserved.
//   3. verifyLinkOtp          — confirms the code AND force-refreshes the
//                              Firebase ID token so the next request carries
//                              the new verified phone_number claim.
//   4. POST /me/phone/confirm — backend reads phone_number off the bearer
//                              token, binds the phone to user_profiles,
//                              sets phone_verified_at, returns LinkedProvider.
//
// 403 on confirm = token lacks verified phone_number (shouldn't happen since
// verifyLinkOtp forced a refresh, but we treat it as a retry-able error).
// 409 on either backend call = IdentityConflict (phone_taken / provider_taken
// / last_method_cant_remove) — surfaced inline via parseIdentityConflict.

export type PhoneAddSheetProps = {
  open: boolean;
  onClose: () => void;
  initialPhone?: string;
};

type SheetState =
  | { kind: "idle" }
  | { kind: "preflighting" }
  | { kind: "otp_input"; phone: string; error: string | null }
  | { kind: "confirming"; phone: string }
  | { kind: "linked"; provider: LinkedProvider }
  | { kind: "conflict"; body: IdentityConflict; phone: string }
  | { kind: "firebase_error"; phone: string; message: string };

function normalizeToE164(digits: string): string {
  const trimmed = digits.replace(/\D/g, "").slice(0, 8);
  return `+569${trimmed}`;
}

function formatPhonePretty(e164: string): string {
  // +569XXXXXXXX → "+56 9 XXXX XXXX"
  const m = /^\+569(\d{4})(\d{4})$/.exec(e164);
  if (!m) return e164;
  return `+56 9 ${m[1]} ${m[2]}`;
}

const OTP_LENGTH = 6;

export function PhoneAddSheet({ open, onClose, initialPhone }: PhoneAddSheetProps) {
  const auth = useAuth();
  const addPhone = useAddPhone();
  const confirmPhone = useConfirmPhone();
  const seed = (initialPhone ?? "").replace(/^\+?56\s?9?\s?/, "").replace(/\D/g, "").slice(0, 8);
  const [digits, setDigits] = useState(seed);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [state, setState] = useState<SheetState>({ kind: "idle" });

  useEffect(() => {
    if (open) {
      setDigits(seed);
      setOtp(Array(OTP_LENGTH).fill(""));
      setState({ kind: "idle" });
    }
  }, [open, seed]);

  // Step 1 + 2: preflight → start Firebase OTP.
  async function onSubmitPhone(e: FormEvent) {
    e.preventDefault();
    if (digits.length < 8) return;
    const phone = normalizeToE164(digits);
    setState({ kind: "preflighting" });
    try {
      await addPhone.mutateAsync({ phone });
    } catch (err) {
      const conflict = parseIdentityConflict(err);
      if (conflict) {
        setState({ kind: "conflict", body: conflict, phone });
        return;
      }
      setState({ kind: "firebase_error", phone, message: "No pudimos verificar tu número. Inténtalo en un momento." });
      return;
    }
    // Preflight OK → drive Firebase phone link on the current user.
    const result = await auth.linkPhone(phone);
    if (!result.ok) {
      setState({ kind: "firebase_error", phone, message: result.message });
      return;
    }
    setOtp(Array(OTP_LENGTH).fill(""));
    setState({ kind: "otp_input", phone, error: null });
  }

  // Step 3 + 4: verify OTP + force-refresh token + call backend confirm.
  async function onSubmitOtp(e: FormEvent) {
    e.preventDefault();
    if (state.kind !== "otp_input") return;
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;
    const verifyResult = await auth.verifyLinkOtp(code);
    if (!verifyResult.ok) {
      setState({ ...state, error: verifyResult.message });
      return;
    }
    setState({ kind: "confirming", phone: state.phone });
    try {
      const provider = await confirmPhone.mutateAsync();
      // provider is LinkedProvider with verified_at set.
      setState({ kind: "linked", provider });
    } catch (err) {
      const conflict = parseIdentityConflict(err);
      if (conflict) {
        setState({ kind: "conflict", body: conflict, phone: state.phone });
        return;
      }
      // 403 lands here (token missing phone_number despite refresh — rare).
      setState({
        kind: "otp_input",
        phone: state.phone,
        error: "No pudimos vincular el teléfono. Pide otro código."
      });
    }
  }

  // ---- Conflict state (phone_taken / provider_taken / last_method).
  if (state.kind === "conflict") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="Conflicto al sumar teléfono"
        eyebrow="Teléfono · Conflicto"
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button
              variant="primary"
              onClick={() => {
                // TODO(auth): wire alternative-method sign-in once
                // AuthProvider grows it. For now, close and let the user
                // navigate to /ingresar.
                onClose();
              }}
            >
              Iniciar sesión con teléfono
            </Button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="tap-target"
              style={ghostLinkStyle}
            >
              Usar otro número
            </button>
          </div>
        }
      >
        <ConflictHead message={state.body.message} />
        <div style={{ marginTop: 28 }}>
          <Input
            label="Número en conflicto"
            value={formatPhonePretty(state.phone)}
            readOnly
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontSize: 20,
              textDecoration: "line-through",
              textDecorationColor: "rgba(94,35,15,0.4)",
              color: colors.inkMuted
            }}
          />
        </div>
      </Sheet>
    );
  }

  // ---- Linked success — phone confirmed.
  if (state.kind === "linked") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="Teléfono verificado"
        eyebrow="Teléfono · Verificado"
        footer={
          <Button variant="primary" onClick={onClose}>
            Listo
          </Button>
        }
      >
        <PosterHead lead="Listo." accent="Teléfono verificado." />
        <p style={subheadStyle}>
          {formatPhonePretty(state.provider.subject)}{" "}
          <span style={{ color: colors.inkMuted }}>queda enlazado a tu cuenta.</span>
        </p>
      </Sheet>
    );
  }

  // ---- OTP grid (after Firebase code sent).
  if (state.kind === "otp_input") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="Confirma el código por SMS"
        eyebrow="Teléfono · Confirma el código"
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button
              type="submit"
              variant="primary"
              disabled={otp.join("").length !== OTP_LENGTH ? "recoverable" : false}
              onClick={(e) => {
                const form = (e.currentTarget as HTMLButtonElement).closest("form");
                form?.requestSubmit();
              }}
            >
              Confirmar
            </Button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="tap-target"
              style={ghostLinkStyle}
            >
              Cambiar número
            </button>
          </div>
        }
      >
        <PosterHead lead="Te llegó" accent="un código." />
        <p style={subheadStyle}>
          Enviado al <span style={{ color: colors.brown700 }}>{formatPhonePretty(state.phone)}</span>.{" "}
          <span style={{ color: colors.inkMuted }}>Ingresa los 6 dígitos.</span>
        </p>
        <form onSubmit={onSubmitOtp} style={{ marginTop: 28 }}>
          <OtpGrid value={otp} onChange={setOtp} />
          {state.error && (
            <div role="alert" style={{ marginTop: 12, fontFamily: "var(--font-mono), monospace", fontSize: 11, color: colors.brown700 }}>
              {state.error}
            </div>
          )}
        </form>
      </Sheet>
    );
  }

  // ---- Generic firebase error (recoverable) — show in idle frame.
  if (state.kind === "firebase_error") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="No pudimos sumar tu teléfono"
        eyebrow="Teléfono · Algo se interrumpió"
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button variant="primary" onClick={() => setState({ kind: "idle" })}>
              Inténtalo otra vez
            </Button>
            <button type="button" onClick={onClose} className="tap-target" style={ghostLinkStyle}>
              Ahora no
            </button>
          </div>
        }
      >
        <PosterHead lead="Algo se" accent="interrumpió." />
        <p style={subheadStyle}>
          {state.message}{" "}
          <span style={{ color: colors.inkMuted }}>Te mandamos un código de nuevo si lo pides.</span>
        </p>
      </Sheet>
    );
  }

  // ---- Idle / preflighting form.
  const valid = digits.length === 8;
  const submitting = state.kind === "preflighting" || state.kind === "confirming";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel="Sumar tu teléfono"
      eyebrow="Sumar tu teléfono"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button
            type="submit"
            variant="primary"
            disabled={!valid ? "recoverable" : submitting ? "state" : false}
            onClick={(e) => {
              const form = (e.currentTarget as HTMLButtonElement).closest("form");
              form?.requestSubmit();
            }}
          >
            {submitting ? "Enviando…" : "Mándame el código"}
          </Button>
          <button type="button" onClick={onClose} className="tap-target" style={ghostLinkStyle}>
            Ahora no
          </button>
        </div>
      }
    >
      <PosterHead lead="Tu teléfono," accent="verificado." />
      <p style={subheadStyle}>
        Para que la barra te encuentre cuando llegues.{" "}
        <span style={{ color: colors.inkMuted }}>Te mandamos un código por SMS.</span>
      </p>
      <form onSubmit={onSubmitPhone} style={{ marginTop: 28 }}>
        <Input
          label="Tu teléfono"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="•••• ••••"
          prefix="+56 9"
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 8))}
          disabled={submitting}
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: 20,
            color: colors.ink900
          }}
        />
      </form>
    </Sheet>
  );
}

// ---- Local style atoms (kept inline so the file stays self-contained).

const ghostLinkStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  margin: "-10px -8px",
  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: colors.inkMuted,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  alignSelf: "center"
};

const subheadStyle: React.CSSProperties = {
  margin: "20px 0 0",
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 17,
  lineHeight: "24px",
  color: colors.ink900,
  maxWidth: 320
};

function PosterHead({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h2 style={{ margin: 0, fontFamily: "var(--font-display), serif", letterSpacing: "-0.025em" }}>
      <span style={{ display: "block", fontStyle: "italic", fontWeight: 300, fontSize: 44, lineHeight: "44px", color: colors.ink900 }}>
        {lead}
      </span>
      <span style={{ display: "block", fontStyle: "italic", fontWeight: 500, fontSize: 44, lineHeight: "48px", color: colors.green }}>
        {accent}
      </span>
    </h2>
  );
}

function ConflictHead({ message }: { message: string }) {
  return (
    <>
      <PosterHead lead="Este número" accent="ya tiene cuenta." />
      <p style={subheadStyle}>
        {message} <span style={{ color: colors.inkMuted }}>O usa otro número aquí.</span>
      </p>
    </>
  );
}
