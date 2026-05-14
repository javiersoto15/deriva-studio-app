"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  apiClient,
  parseIdentityConflict,
  useIdentity,
  useLinkProvider,
  useMemberProfile,
  useUnlinkProvider,
  type LinkedProvider
} from "../../../src/api/hooks";
import { useAuth } from "../../../src/auth/use-auth";
import type { SsoProvider } from "../../../src/auth/provider";
import { colors } from "../../../src/design/tokens";
import { Button } from "../../../src/ui/Button";
import { EmailAddSheet } from "../../../src/ui/EmailAddSheet";
import { Eyebrow } from "../../../src/ui/Eyebrow";
import { Input } from "../../../src/ui/Input";
import { PhoneAddSheet } from "../../../src/ui/PhoneAddSheet";
import { TopHeader } from "../../../src/ui/TopHeader";

// Estudio — matches Paper artboard 1AN-0.
type RowProps = {
  label: string;
  value: string;
  href?: string;
};

function HairlineRow({ label, value, href }: RowProps) {
  const inner = (
    <>
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
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 17,
          color: colors.ink900,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        {value}
        {href && <span style={{ color: colors.brown700, fontStyle: "normal" }}>→</span>}
      </span>
    </>
  );
  const inner2 = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
      {inner}
    </div>
  );
  return href ? (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {inner2}
    </Link>
  ) : (
    inner2
  );
}

function StackedRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "16px 0",
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
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
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 19,
          lineHeight: "26px",
          color: colors.ink900
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Provider → human label + brand mark. Keep in sync with the LinkedProvider
// enum in openapi.yaml. We intentionally do not display the raw firebase_uid;
// `subject` is the user-visible credential (normalized phone, email, or
// provider sub) sourced from auth_identities, not from Firebase.
const PROVIDER_LABELS: Record<LinkedProvider["provider"], string> = {
  phone: "Teléfono",
  "email-link": "Email",
  password: "Contraseña",
  "google.com": "Google",
  "apple.com": "Apple"
};

function maskEmail(value: string | undefined | null): string {
  if (!value) return "—";
  const [head, tail] = value.split("@");
  if (!head || !tail) return value;
  return `${head.slice(0, 4)}···@${tail}`;
}

function maskPhone(value: string | undefined | null): string {
  if (!value) return "—";
  return value.replace(/(\+56 9) ?\d{2}(\d{2}) ?(\d{4})/, "$1 ·· $2$3");
}

function shortenUserId(value: string | undefined | null): string {
  if (!value) return "—";
  if (value.length <= 12) return value;
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}

function VerifiedPill({ verified }: { verified: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: 9,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: verified ? colors.green : colors.inkMuted
      }}
    >
      {verified && (
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M2 7 L 6 11 L 12 3"
            stroke={colors.green}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
      {verified ? "Verificado" : "Sin verificar"}
    </span>
  );
}

export default function EstudioPage() {
  const { data: profile } = useMemberProfile();
  const { data: identity } = useIdentity();
  const { signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const signOutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (signOutTimeout.current) clearTimeout(signOutTimeout.current);
    };
  }, []);

  function startEditName() {
    setNameDraft(profile?.display_name ?? "");
    setEditing(true);
  }

  async function saveName() {
    const next = nameDraft.trim();
    if (!next || next === profile?.display_name) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    try {
      const { error } = await apiClient.PATCH("/me", { body: { name: next } });
      if (error) throw error;
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
      setEditing(false);
    } catch (err) {
      console.error("[Deriva] estudio name save", err);
    } finally {
      setSavingName(false);
    }
  }

  const monogram = (profile?.display_name ?? "C")[0];
  const emailVerified = Boolean(profile?.email_verified_at);
  const phoneVerified = Boolean(profile?.phone_verified_at);
  const linkedProviders = identity?.linked_providers ?? [];
  const onlyMethod = linkedProviders.length <= 1;
  const [openSheet, setOpenSheet] = useState<"email" | "phone" | null>(null);
  const auth = useAuth();
  const linkProviderMutation = useLinkProvider();
  const unlinkProviderMutation = useUnlinkProvider();
  const [methodBusy, setMethodBusy] = useState<LinkedProvider["provider"] | null>(null);
  const [methodError, setMethodError] = useState<string | null>(null);

  // SSO providers the user can connect from this surface. Phone/email are
  // added via their dedicated sheets; password is intentionally absent.
  const SSO_OPTIONS: SsoProvider[] = ["google.com", "apple.com"];
  const connectedProviders = new Set(linkedProviders.map((p) => p.provider));
  const ssoAvailable = SSO_OPTIONS.filter((p) => !connectedProviders.has(p));

  async function onConnectSso(provider: SsoProvider) {
    setMethodBusy(provider);
    setMethodError(null);
    try {
      const linkResult = await auth.linkProvider(provider);
      if (!linkResult.ok) {
        // Firebase popup failure (cancelled, blocked, etc.). No backend
        // mutation attempted yet.
        if (linkResult.code !== "auth/popup-closed-by-user" && linkResult.code !== "auth/cancelled-popup-request") {
          setMethodError(linkResult.message);
        }
        return;
      }
      // Firebase link succeeded; mirror it server-side.
      try {
        await linkProviderMutation.mutateAsync(linkResult.credential);
      } catch (err) {
        const conflict = parseIdentityConflict(err);
        if (conflict?.code === "provider_taken") {
          // Backend rejected — undo Firebase link to keep state consistent.
          await auth.unlinkFirebaseProvider(provider);
          setMethodError(conflict.message);
          return;
        }
        setMethodError("No pudimos guardar la conexión. Inténtalo otra vez.");
      }
    } finally {
      setMethodBusy(null);
    }
  }

  async function onDisconnect(provider: LinkedProvider["provider"]) {
    if (onlyMethod) {
      setMethodError("Este es tu único método de ingreso. Suma otro y vuelve.");
      return;
    }
    setMethodBusy(provider);
    setMethodError(null);
    try {
      try {
        await unlinkProviderMutation.mutateAsync(provider);
      } catch (err) {
        const conflict = parseIdentityConflict(err);
        if (conflict?.code === "last_method_cant_remove") {
          setMethodError(conflict.message);
          return;
        }
        setMethodError("No pudimos desconectar. Inténtalo otra vez.");
        return;
      }
      // Backend cleared; clean up Firebase. Failure here is non-fatal —
      // the backend is the source of truth for auth_identities; a stale
      // Firebase provider will be reconciled on next sign-in.
      if (provider === "google.com" || provider === "apple.com" || provider === "phone" || provider === "password") {
        await auth.unlinkFirebaseProvider(provider);
      }
    } finally {
      setMethodBusy(null);
    }
  }

  async function onSignOut() {
    if (!confirmingSignOut) {
      setConfirmingSignOut(true);
      if (signOutTimeout.current) clearTimeout(signOutTimeout.current);
      signOutTimeout.current = setTimeout(() => {
        setConfirmingSignOut(false);
        signOutTimeout.current = null;
      }, 4000);
      return;
    }
    if (signOutTimeout.current) {
      clearTimeout(signOutTimeout.current);
      signOutTimeout.current = null;
    }
    try {
      await signOut();
    } catch (error) {
      console.error("[Deriva] sign out", error);
    }
    router.push("/inicio");
  }

  return (
    <>
      <main
        style={{
          flex: 1,
          padding: "calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 96px)",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
        <TopHeader />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Eyebrow>Studio</Eyebrow>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              color: colors.inkMuted
            }}
          >
            v 1.0
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: colors.brown900,
              color: colors.beige100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 28
            }}
          >
            {monogram}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Tu nombre"
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={saveName}
                    disabled={savingName ? "state" : nameDraft.trim().length === 0 ? "recoverable" : false}
                  >
                    {savingName ? "Guardando…" : "Guardar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 32,
                    color: colors.ink900,
                    lineHeight: "36px",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {profile?.display_name ?? "Javier Soto"}
                </h1>
                <button
                  type="button"
                  onClick={startEditName}
                  className="tap-target"
                  aria-label="Editar nombre"
                  style={{
                    background: "transparent",
                    border: "none",
                    margin: "-10px -8px",
                    cursor: "pointer",
                    fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: colors.brown700
                  }}
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        </div>

        <section style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 8 }}>
            <Eyebrow>Contactos</Eyebrow>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                Teléfono
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 18,
                  color: colors.ink900
                }}
              >
                {maskPhone(profile?.phone)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <VerifiedPill verified={phoneVerified} />
              <button
                type="button"
                onClick={() => setOpenSheet("phone")}
                className="tap-target"
                style={{
                  background: "transparent",
                  border: "none",
                  margin: "-10px -8px",
                  cursor: "pointer",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: colors.brown700,
                  textDecoration: "underline",
                  textUnderlineOffset: 2
                }}
              >
                Cambiar
              </button>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                Email
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 18,
                  color: colors.ink900
                }}
              >
                {profile?.email ? maskEmail(profile.email) : <em style={{ color: colors.inkMuted }}>Sin email</em>}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <VerifiedPill verified={emailVerified} />
              <button
                type="button"
                onClick={() => setOpenSheet("email")}
                className="tap-target"
                style={{
                  background: "transparent",
                  border: "none",
                  margin: "-10px -8px",
                  cursor: "pointer",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: colors.brown700,
                  textDecoration: "underline",
                  textUnderlineOffset: 2
                }}
              >
                {profile?.email ? "Cambiar" : "Sumar"}
              </button>
            </div>
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 8 }}>
            <Eyebrow>Métodos de ingreso</Eyebrow>
          </div>
          {linkedProviders.length === 0 && (
            <div
              style={{
                padding: "14px 0",
                borderTop: `1px solid ${colors.hairline}`,
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 15,
                color: colors.inkMuted
              }}
            >
              Sin métodos conectados aún.
            </div>
          )}
          {linkedProviders.map((p) => (
            <div
              key={`${p.provider}:${p.subject}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderTop: `1px solid ${colors.hairline}`
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: colors.ink900
                  }}
                >
                  {PROVIDER_LABELS[p.provider]}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 14,
                    color: colors.inkMuted
                  }}
                >
                  {p.provider === "phone" ? maskPhone(p.subject) : p.subject}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDisconnect(p.provider)}
                disabled={onlyMethod || methodBusy === p.provider}
                className="tap-target"
                title={onlyMethod ? "Este es tu único método de ingreso" : undefined}
                style={{
                  background: "transparent",
                  border: "none",
                  margin: "-10px -8px",
                  cursor: onlyMethod ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: onlyMethod ? colors.inkMuted : colors.brown700,
                  textDecoration: onlyMethod ? "none" : "underline",
                  textUnderlineOffset: 2
                }}
              >
                {methodBusy === p.provider ? "…" : onlyMethod ? "Único método" : "Desconectar"}
              </button>
            </div>
          ))}
          {ssoAvailable.map((provider) => (
            <div
              key={`add:${provider}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderTop: `1px solid ${colors.hairline}`
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: colors.inkMuted
                  }}
                >
                  {PROVIDER_LABELS[provider]}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 14,
                    color: colors.inkMuted
                  }}
                >
                  Sin conectar
                </span>
              </div>
              <button
                type="button"
                onClick={() => onConnectSso(provider)}
                disabled={methodBusy === provider}
                className="tap-target"
                style={{
                  background: "transparent",
                  border: "none",
                  margin: "-10px -8px",
                  cursor: "pointer",
                  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: colors.brown700,
                  textDecoration: "underline",
                  textUnderlineOffset: 2
                }}
              >
                {methodBusy === provider ? "…" : "Conectar"}
              </button>
            </div>
          ))}
          {methodError && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderLeft: `2px solid ${colors.brown700}`,
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 14,
                color: colors.ink900,
                backgroundColor: "rgba(94, 35, 15, 0.04)"
              }}
            >
              {methodError}
            </div>
          )}
        </section>

        <section style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 8 }}>
            <Eyebrow>Lo que Deriva recuerda</Eyebrow>
          </div>
          <StackedRow label="Ritual" value={profile?.ritual ?? "—"} />
          <HairlineRow label="Bebida favorita" value={profile?.favorite_drink ?? "—"} />
          <HairlineRow label="Cumpleaños" value={profile?.birthday ?? "—"} />
        </section>

        <section style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 8 }}>
            <Eyebrow>Cuenta</Eyebrow>
          </div>
          <HairlineRow label="Idioma" value={profile?.language ?? "Español"} href="/estudio" />
          <HairlineRow label="Notificaciones" value={profile?.notifications ?? "Solo transaccionales"} href="/estudio" />
          <HairlineRow label="Recibos digitales" value={profile?.digital_receipts ? "Activados" : "Desactivados"} href="/estudio" />
          <HairlineRow label="Datos y privacidad" value="Ver y descargar" href="/privacidad" />
          {/* ID de soporte — the Deriva-owned us_xxx user id from user_profiles.id.
              Distinct from member_id (loyalty PK) and from Firebase UID (never shown).
              Surfaced only for support flows; not a primary identifier in UX. */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                ID de soporte
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 400,
                  fontSize: 12,
                  color: colors.inkMuted
                }}
              >
                {shortenUserId(identity?.user_id)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (identity?.user_id) {
                  void navigator.clipboard?.writeText(identity.user_id);
                }
              }}
              className="tap-target"
              disabled={!identity?.user_id}
              style={{
                background: "transparent",
                border: "none",
                margin: "-10px -8px",
                cursor: identity?.user_id ? "pointer" : "default",
                fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: identity?.user_id ? colors.brown700 : colors.inkMuted,
                textDecoration: identity?.user_id ? "underline" : "none",
                textUnderlineOffset: 3
              }}
            >
              Copiar
            </button>
          </div>
        </section>

        <section style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Eyebrow>Mis orígenes</Eyebrow>
            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 13,
                color: colors.inkMuted
              }}
            >
              próximamente
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 0",
              borderTop: `1px solid ${colors.hairline}`
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.green,
                display: "inline-block"
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 17,
                color: colors.ink900
              }}
            >
              Aún no has probado un origen filtrado.
            </span>
          </div>
        </section>

        <Link
          href="/sumar-visita"
          className="tap-target"
          style={{
            alignSelf: "flex-start",
            margin: "-10px -8px",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.brown700,
            textDecoration: "none"
          }}
        >
          Sumar una visita anterior →
        </Link>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
            paddingLeft: confirmingSignOut ? 12 : 0,
            borderLeft: confirmingSignOut ? `2px solid ${colors.brown700}` : "none",
            alignSelf: "center",
            transition: "padding 160ms ease"
          }}
        >
          <Button
            variant="secondary"
            onClick={onSignOut}
            aria-label={confirmingSignOut ? "Toca de nuevo para confirmar cerrar sesión" : "Cerrar sesión"}
          >
            {confirmingSignOut ? "Confirmar cerrar sesión" : "Cerrar sesión"}
          </Button>
          {confirmingSignOut && (
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: colors.inkMuted,
                letterSpacing: "0.05em"
              }}
            >
              Toca de nuevo para confirmar
            </span>
          )}
        </div>

        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: colors.inkMuted
          }}
        >
          miembro desde {profile?.member_since ?? "04 abr 2026"}
        </p>
      </main>
      <EmailAddSheet
        open={openSheet === "email"}
        onClose={() => setOpenSheet(null)}
        initialEmail={profile?.email}
      />
      <PhoneAddSheet
        open={openSheet === "phone"}
        onClose={() => setOpenSheet(null)}
        initialPhone={profile?.phone}
      />
    </>
  );
}
