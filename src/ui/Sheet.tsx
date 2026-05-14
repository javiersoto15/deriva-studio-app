"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { colors } from "../design/tokens";

// Bottom-anchored sheet primitive. Matches Paper EmailAddSheet (artboard 46S-1):
// handle bar, header eyebrow + close, body slot, footer slot. Backdrop and ESC
// dismiss are wired here so callers only own the open/close state + content.
//
// Not portal-rendered — fixed-position is enough for the companion app's
// non-transformed shell. If a future surface introduces transformed ancestors
// (3D scroll, etc.) this can be lifted into a portal without changing the API.

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  eyebrow: ReactNode;
  children: ReactNode;
  // Footer slot — typically the primary CTA + secondary text link. Rendered
  // pinned to the bottom of the sheet with its own padding.
  footer?: ReactNode;
};

export function Sheet({ open, onClose, ariaLabel, eyebrow, children, footer }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Body scroll lock + ESC dismiss. The cleanup must restore the prior overflow
  // so navigations don't leave the body un-scrollable.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Focus the first focusable inside the sheet when it opens, so a phone-
  // keyboard user lands directly on the input.
  useEffect(() => {
    if (!open) return;
    const node = sheetRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'input, textarea, button, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(40, 26, 18, 0.32)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center"
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "92dvh",
          backgroundColor: colors.beige100,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          boxShadow: "0 -8px 24px rgba(40, 26, 18, 0.12)",
          paddingTop: 16,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 28px)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          aria-hidden
          style={{
            alignSelf: "center",
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(94, 35, 15, 0.25)"
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px 0"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 16,
                height: 1,
                backgroundColor: colors.brown700
              }}
            />
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
              {eyebrow}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-target"
            style={{
              background: "transparent",
              border: "none",
              margin: "-10px -8px",
              cursor: "pointer",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 16,
              color: colors.inkMuted
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "20px 28px 0", flex: 1, overflowY: "auto" }}>{children}</div>
        {footer && <div style={{ padding: "20px 28px 0" }}>{footer}</div>}
      </div>
    </div>
  );
}
