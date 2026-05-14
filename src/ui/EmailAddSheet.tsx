"use client";

import { type FormEvent, useEffect, useState } from "react";
import { parseIdentityConflict, useAddEmail, type IdentityConflict } from "../api/hooks";
import { colors } from "../design/tokens";
import { Button } from "./Button";
import { Input } from "./Input";
import { Sheet } from "./Sheet";

// Add or change the member's email. Wires POST /me/email and handles the
// canonical 409 IdentityConflict body inline per the email_taken Paper mock
// (artboard 47H-1). Queues a Firebase verification action server-side; the
// user sees a "Mándame el enlace" CTA followed by a success state with the
// resend hint. Caller controls open/close; we own the form state.

export type EmailAddSheetProps = {
  open: boolean;
  onClose: () => void;
  // Optional initial value — used when the user picks "Cambiar" from a row
  // that already has an email so the field starts pre-populated.
  initialEmail?: string;
};

type SheetState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "queued"; email: string }
  | { kind: "conflict"; body: IdentityConflict; email: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailAddSheet({ open, onClose, initialEmail }: EmailAddSheetProps) {
  const addEmail = useAddEmail();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [state, setState] = useState<SheetState>({ kind: "idle" });

  // Reset state every time the sheet opens so a previous conflict or queued
  // success doesn't bleed into the next session.
  useEffect(() => {
    if (open) {
      setEmail(initialEmail ?? "");
      setState({ kind: "idle" });
    }
  }, [open, initialEmail]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return;
    setState({ kind: "submitting" });
    try {
      await addEmail.mutateAsync({ email: value });
      setState({ kind: "queued", email: value });
    } catch (err) {
      const conflict = parseIdentityConflict(err);
      if (conflict) {
        setState({ kind: "conflict", body: conflict, email: value });
        return;
      }
      // Non-conflict error already surfaced via global toast; back to idle.
      setState({ kind: "idle" });
    }
  }

  // Conflict resolution surface — matches Paper artboard 47H-1.
  if (state.kind === "conflict") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="Conflicto al sumar email"
        eyebrow="Email · Conflicto"
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Button
              variant="primary"
              onClick={() => {
                // TODO(auth): wire email-link sign-in when AuthProvider grows
                // signInWithEmailLink. For now, surface the recommended action
                // by closing the sheet so the user can use the email path on
                // /ingresar (once it ships).
                onClose();
              }}
            >
              Iniciar sesión con email
            </Button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="tap-target"
              style={{
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
              }}
            >
              Usar otro email
            </button>
          </div>
        }
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            letterSpacing: "-0.025em"
          }}
        >
          <span
            style={{
              display: "block",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 44,
              lineHeight: "44px",
              color: colors.ink900
            }}
          >
            Este email
          </span>
          <span
            style={{
              display: "block",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 44,
              lineHeight: "48px",
              color: colors.green
            }}
          >
            ya tiene cuenta.
          </span>
        </h2>
        <p
          style={{
            margin: "20px 0 0",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: "24px",
            color: colors.ink900,
            maxWidth: 300
          }}
        >
          {state.body.message}{" "}
          <span style={{ color: colors.inkMuted }}>O usa otro email aquí.</span>
        </p>
        <div style={{ marginTop: 28 }}>
          <Input
            label="Email en conflicto"
            value={state.email}
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

  // Success state — verification link queued.
  if (state.kind === "queued") {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        ariaLabel="Email enviado"
        eyebrow="Email · Pendiente de verificar"
        footer={
          <Button variant="primary" onClick={onClose}>
            Listo
          </Button>
        }
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            letterSpacing: "-0.025em"
          }}
        >
          <span
            style={{
              display: "block",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 44,
              lineHeight: "44px",
              color: colors.ink900
            }}
          >
            Revisa tu
          </span>
          <span
            style={{
              display: "block",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 44,
              lineHeight: "48px",
              color: colors.green
            }}
          >
            bandeja.
          </span>
        </h2>
        <p
          style={{
            margin: "20px 0 0",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: "24px",
            color: colors.ink900,
            maxWidth: 320
          }}
        >
          Te mandamos un enlace a <span style={{ color: colors.brown700 }}>{state.email}</span>.{" "}
          <span style={{ color: colors.inkMuted }}>
            Toca el enlace para confirmar; queda enlazado a tu cuenta.
          </span>
        </p>
      </Sheet>
    );
  }

  // Idle / submitting form.
  const validEmail = EMAIL_RE.test(email.trim());
  const submitting = state.kind === "submitting";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel="Sumar tu email"
      eyebrow="Sumar tu email"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Button
            type="submit"
            variant="primary"
            disabled={!validEmail ? "recoverable" : submitting ? "state" : false}
            onClick={(e) => {
              // Sheet form lives outside Button — forward the click into the
              // form's submit path so disabled/recoverable styling stays in
              // sync with the validation predicate.
              const form = (e.currentTarget as HTMLButtonElement).closest("form");
              form?.requestSubmit();
            }}
          >
            {submitting ? "Enviando…" : "Mándame el enlace"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="tap-target"
            style={{
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
            }}
          >
            Ahora no
          </button>
        </div>
      }
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display), serif",
          letterSpacing: "-0.025em"
        }}
      >
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 44,
            lineHeight: "44px",
            color: colors.ink900
          }}
        >
          Tu email,
        </span>
        <span
          style={{
            display: "block",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 44,
            lineHeight: "48px",
            color: colors.green
          }}
        >
          verificado.
        </span>
      </h2>
      <p
        style={{
          margin: "20px 0 0",
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 17,
          lineHeight: "24px",
          color: colors.ink900,
          maxWidth: 300
        }}
      >
        Te mandamos un enlace para confirmarlo.{" "}
        <span style={{ color: colors.inkMuted }}>
          Una vez verificado, llegan tus comprobantes y rondas.
        </span>
      </p>
      <form onSubmit={onSubmit} style={{ marginTop: 28 }}>
        <Input
          label="Tu email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
