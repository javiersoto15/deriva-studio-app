"use client";

// Companion Toaster — Recipe Rule 11.
// - Anchored 96 px above the tab bar (24 px inset each side on mobile).
// - 64-72 px tall (micro: 44 px pill).
// - 1 px hairline border; warn = 1 px brown-700 left rule, error = 2 px.
// - Background --beige-100, NO shadows, 14 px radius (micro: pill).
// - Slide-in 320 ms ease-soft on mount; fade-out 240 ms on dismiss.
// - role="status" for success/info/micro; role="alert" for warn/error.
// - Respects prefers-reduced-motion: reduce.
// - Max 1 visible at a time; queue auto-shifts via the store on expiry.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { colors, plexMono, cormorantItalic, poppinsTracked } from "../design/tokens";
import { useToast, type Toast, type ToastVariant } from "../lib/useToast";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function variantRole(variant: ToastVariant): "status" | "alert" {
  return variant === "warn" || variant === "error" ? "alert" : "status";
}

function variantLeftRulePx(variant: ToastVariant): number {
  if (variant === "error") return 2;
  if (variant === "warn") return 1;
  return 0;
}

function variantLabel(variant: ToastVariant): string | null {
  switch (variant) {
    case "success":
      return "SUCCESS";
    case "warn":
      return "WARN";
    case "error":
      return "ERR";
    default:
      return null;
  }
}

type ToastCardProps = {
  toast: Toast;
  reduced: boolean;
  onDismiss: () => void;
};

function ToastCard({ toast, reduced, onDismiss }: ToastCardProps) {
  const [entered, setEntered] = useState(reduced);
  const [exiting, setExiting] = useState(false);

  // Mount: trigger slide-in next frame
  useEffect(() => {
    if (reduced) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Auto-dismiss timer
  useEffect(() => {
    const ms = toast.durationMs ?? 4000;
    const handle = window.setTimeout(() => {
      if (reduced) {
        onDismiss();
      } else {
        setExiting(true);
        window.setTimeout(onDismiss, 240);
      }
    }, ms);
    return () => window.clearTimeout(handle);
  }, [toast.durationMs, onDismiss, reduced]);

  const dismissNow = () => {
    if (reduced) {
      onDismiss();
    } else {
      setExiting(true);
      window.setTimeout(onDismiss, 240);
    }
  };

  const isMicro = toast.variant === "micro";
  const leftRulePx = variantLeftRulePx(toast.variant);
  const label = variantLabel(toast.variant);
  const labelColor =
    toast.variant === "warn" || toast.variant === "error"
      ? colors.brown700
      : colors.inkMuted;

  const plex = useMemo(() => plexMono(13), []);
  const italic = useMemo(() => cormorantItalic(16), []);
  const tracked = useMemo(() => poppinsTracked(10), []);

  const transform = reduced
    ? "none"
    : exiting
      ? "translateY(0)"
      : entered
        ? "translateY(0)"
        : "translateY(16px)";

  const opacity = reduced ? 1 : exiting ? 0 : entered ? 1 : 0;

  const transition = reduced
    ? "none"
    : exiting
      ? "opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)";

  // Micro variant — centered pill
  if (isMicro) {
    return (
      <div
        role={variantRole(toast.variant)}
        onClick={dismissNow}
        style={{
          alignSelf: "center",
          width: "fit-content",
          minHeight: 44,
          padding: "10px 18px 10px 14px",
          backgroundColor: colors.beige100,
          border: `1px solid ${colors.hairline}`,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          opacity,
          transform,
          transition,
          pointerEvents: "auto"
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: colors.brown700,
            flexShrink: 0
          }}
        />
        <span style={{ ...plex, color: colors.ink900 }}>{toast.line}</span>
      </div>
    );
  }

  return (
    <div
      role={variantRole(toast.variant)}
      onClick={dismissNow}
      style={{
        width: "100%",
        minHeight: 64,
        maxHeight: 72,
        backgroundColor: colors.beige100,
        border:
          toast.variant === "warn" || toast.variant === "error"
            ? `1px solid ${colors.brown700}`
            : `1px solid ${colors.hairline}`,
        borderRadius: 14,
        display: "flex",
        alignItems: "stretch",
        padding: "12px 14px",
        gap: 12,
        cursor: "pointer",
        opacity,
        transform,
        transition,
        pointerEvents: "auto"
      }}
    >
      {leftRulePx > 0 && (
        <div
          aria-hidden
          style={{
            width: leftRulePx,
            minHeight: 36,
            alignSelf: "center",
            backgroundColor: colors.brown700,
            flexShrink: 0
          }}
        />
      )}
      {leftRulePx === 0 && (
        <div
          aria-hidden
          style={{
            width: 1,
            minHeight: 36,
            alignSelf: "center",
            backgroundColor: colors.brown700,
            flexShrink: 0
          }}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
          minWidth: 0
        }}
      >
        <span
          style={{
            ...plex,
            color: colors.ink900,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {toast.line}
        </span>
        {toast.italic && (
          <span style={{ ...italic, color: colors.inkMuted }}>
            {toast.italic}
          </span>
        )}
      </div>
      {label && (
        <span
          style={{
            ...tracked,
            color: labelColor,
            alignSelf: "center",
            flexShrink: 0
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  const pendingRedirect = useToast((s) => s.pendingRedirect);
  const setPendingRedirect = useToast((s) => s.setPendingRedirect);
  const router = useRouter();
  const reduced = usePrefersReducedMotion();

  // Bridge: non-hook error handlers set pendingRedirect; we navigate here.
  const lastRedirectRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingRedirect && pendingRedirect !== lastRedirectRef.current) {
      lastRedirectRef.current = pendingRedirect;
      router.replace(pendingRedirect);
      // Clear so subsequent identical redirects can fire
      const clearHandle = window.setTimeout(() => {
        setPendingRedirect(null);
        lastRedirectRef.current = null;
      }, 250);
      return () => window.clearTimeout(clearHandle);
    }
  }, [pendingRedirect, router, setPendingRedirect]);

  // Recipe Rule 11: max 1 visible at a time. Show head of queue.
  const active = toasts[0];

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 96,
        left: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        zIndex: 1000,
        pointerEvents: "none"
      }}
    >
      {active && (
        <ToastCard
          key={active.id}
          toast={active}
          reduced={reduced}
          onDismiss={() => dismiss(active.id)}
        />
      )}
    </div>
  );
}
