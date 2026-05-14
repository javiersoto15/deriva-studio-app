"use client";

import { colors } from "../design/tokens";

export type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
};

// Rule 6 — hairline-grade pill toggle, brown-700 chrome.
export function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        // Stop propagation so when nested inside a tappable ToggleRow div,
        // the parent's onClick does not fire a second onChange.
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        border: `1px solid ${colors.brown700}`,
        backgroundColor: checked ? colors.brown700 : "transparent",
        position: "relative",
        transition: "background 160ms ease",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: checked ? 17 : 1,
          width: 16,
          height: 16,
          borderRadius: 999,
          backgroundColor: checked ? colors.beige100 : colors.brown700,
          transition: "left 160ms ease",
          display: "block"
        }}
      />
    </button>
  );
}

export type ToggleRowProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  // Single-line uses `label` only. Rule 25 — 2-line variant adds `description`:
  // label renders as tracked uppercase eyebrow; description as Cormorant italic body.
  label: string;
  description?: string;
};

// Rule 25 — ToggleRow 2-line variant. When `description` is provided, the row
// stacks an Eyebrow-style label over a Cormorant italic subtitle, with the
// Toggle right-aligned.
// NOTE: the row wrapper is a <div>, not a <button>. The actual interactive
// element is the inner <Toggle> which is itself a <button role="switch">.
// Nested buttons are invalid HTML (causes a hydration error in React 19).
// The outer div exposes a large mouse tap target via onClick — keyboard users
// focus the inner switch directly, which already has native Space/Enter handling.
export function ToggleRow({ checked, onChange, label, description }: ToggleRowProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "16px 0",
        borderTop: `1px solid ${colors.hairline}`,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        width: "100%"
      }}
    >
      {description ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
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
              fontSize: 18,
              lineHeight: "24px",
              letterSpacing: "-0.01em",
              color: colors.ink900
            }}
          >
            {description}
          </span>
        </div>
      ) : (
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 18,
            letterSpacing: "-0.01em",
            color: colors.ink900,
            flex: 1
          }}
        >
          {label}
        </span>
      )}
      <Toggle checked={checked} onChange={onChange} ariaLabel={description ?? label} />
    </div>
  );
}
