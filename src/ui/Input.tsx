"use client";

import { type InputHTMLAttributes, useId, useState, type ReactNode } from "react";
import { colors } from "../design/tokens";

type InputState = "resting" | "hover" | "focus" | "error" | "disabled";

export type InputProps = {
  label?: ReactNode;
  prefix?: ReactNode;
  caption?: ReactNode;
  error?: boolean;
  variant?: "hairline-bottom";
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  prefix,
  caption,
  error = false,
  disabled = false,
  variant = "hairline-bottom",
  style,
  onFocus,
  onBlur,
  id,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  // Phase 1D D1 — connect the visual label to the input via htmlFor/id so
  // screen readers announce it. Caller can pass an explicit id; we generate
  // one otherwise.
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const captionId = caption ? `${inputId}-caption` : undefined;

  const state: InputState = disabled
    ? "disabled"
    : error
      ? "error"
      : focused
        ? "focus"
        : "resting";

  const borderColor =
    state === "focus" || state === "error"
      ? colors.brown700
      : state === "disabled"
        ? colors.hairlineLight
        : colors.hairline;

  const borderStyle: React.CSSProperties =
    state === "disabled"
      ? { borderBottom: `1px dashed ${borderColor}`, opacity: 0.4 }
      : {
          borderBottom: `${state === "focus" || state === "error" ? 2 : 1}px solid ${borderColor}`
        };

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: state === "focus" || state === "error" ? colors.brown700 : colors.inkMuted,
            marginBottom: 8
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 8,
          ...borderStyle
        }}
      >
        {prefix && (
          <span
            style={{
              // Prefix uses the same display family as the typed value so
              // "+56 9 1234 4421" reads as one number, not two fonts. Muted
              // color keeps the prefix supportive rather than equal-weight
              // with the user-entered value.
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 20,
              letterSpacing: "0.01em",
              color: colors.inkMuted
            }}
          >
            {prefix}
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          aria-describedby={captionId ?? rest["aria-describedby"]}
          disabled={disabled}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            flex: 1,
            fontFamily: variant === "hairline-bottom" ? "var(--font-mono), monospace" : "inherit",
            fontSize: 16,
            color: colors.ink900,
            padding: 0,
            ...style
          }}
        />
      </div>
      {caption && (
        <div
          id={captionId}
          style={{
            marginTop: 8,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: state === "error" ? colors.brown700 : colors.inkMuted
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
