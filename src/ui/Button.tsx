"use client";

import { type ButtonHTMLAttributes, type ReactNode, useState } from "react";
import { colors } from "../design/tokens";

type Variant = "primary" | "secondary" | "ghost";
type Disabled = false | "recoverable" | "state";
type Size = "md" | "sm";

export type ButtonProps = {
  variant?: Variant;
  disabled?: Disabled;
  size?: Size;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export function Button({
  variant = "primary",
  disabled = false,
  size = "md",
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const [hover, setHover] = useState(false);

  const padding = size === "sm" ? "12px 20px" : "16px 24px";

  const base: React.CSSProperties = {
    padding,
    borderRadius: 999,
    fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 160ms ease, color 160ms ease, opacity 160ms ease",
    outlineOffset: 3
  };

  let variantStyle: React.CSSProperties;
  if (variant === "primary") {
    variantStyle = {
      backgroundColor: hover && !disabled ? colors.brown900 : colors.brown700,
      color: colors.beige100,
      border: "none"
    };
  } else if (variant === "secondary") {
    variantStyle = {
      backgroundColor: "transparent",
      color: colors.brown700,
      border: `1px solid ${colors.brown700}`
    };
  } else {
    variantStyle = {
      backgroundColor: "transparent",
      color: colors.brown700,
      border: "none",
      padding: "8px 0",
      letterSpacing: "0.22em"
    };
  }

  let disabledStyle: React.CSSProperties = {};
  if (disabled === "recoverable") {
    disabledStyle = {
      border: `1px dashed ${colors.brown700}`,
      backgroundColor: "transparent",
      color: colors.brown700,
      opacity: 0.6
    };
  } else if (disabled === "state") {
    disabledStyle = { opacity: 0.4 };
  }

  return (
    <button
      {...rest}
      disabled={disabled !== false}
      style={{ ...base, ...variantStyle, ...disabledStyle, ...style }}
      onMouseEnter={(event) => {
        setHover(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHover(false);
        onMouseLeave?.(event);
      }}
    >
      {children}
    </button>
  );
}
