"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { colors } from "../design/tokens";

export type ChipProps = {
  selected?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Chip({
  selected = false,
  disabled = false,
  children,
  style,
  // Default `aria-pressed` mirrors the visual selected state so non-radio uses
  // still expose toggle semantics. Callers that wrap chips in a radiogroup pass
  // role="radio" + aria-checked instead (e.g. Phase 1D D1 preferences chips).
  "aria-pressed": ariaPressed,
  role,
  ...rest
}: ChipProps) {
  const bg = selected ? colors.brown700 : "transparent";
  const fg = selected ? colors.beige100 : colors.brown700;
  const border = selected ? colors.brown700 : colors.hairline;

  const isRadio = role === "radio";

  return (
    <button
      {...rest}
      role={role}
      aria-pressed={isRadio ? undefined : ariaPressed ?? selected}
      aria-checked={isRadio ? selected : undefined}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${border}`,
        fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        whiteSpace: "nowrap",
        ...style
      }}
    >
      {children}
    </button>
  );
}
