"use client";

import { type ChangeEvent, type KeyboardEvent, useRef } from "react";
import { colors } from "../design/tokens";

// Reusable N-digit OTP grid. Originally inlined in PhoneAddSheet and the
// /ingresar/verificar route; extracted here so both flows share the same
// keyboard semantics (digit-only, auto-advance on input, backspace jumps
// back, single tap target per box) and so future OTP-bearing flows can
// reuse it without re-implementing.

export type OtpGridProps = {
  value: string[];
  onChange: (next: string[]) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  ariaLabel?: string;
  describedById?: string;
};

export function OtpGrid({
  value,
  onChange,
  length = 6,
  disabled,
  error,
  ariaLabel,
  describedById
}: OtpGridProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const borderColor = error ? colors.brown700 : colors.hairline;
  const borderWidth = error ? 2 : 1;

  function onDigit(i: number, e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = v;
    onChange(next);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? `Código de ${length} dígitos`}
      aria-describedby={describedById}
      aria-invalid={error || undefined}
      style={{ display: "flex", gap: 10, justifyContent: "space-between" }}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => onDigit(i, e)}
          onKeyDown={(e) => onKey(i, e)}
          disabled={disabled}
          aria-label={`Dígito ${i + 1} de ${length}`}
          style={{
            width: 40,
            height: 48,
            textAlign: "center",
            border: "none",
            borderBottom: `${borderWidth}px solid ${borderColor}`,
            background: "transparent",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 24,
            color: colors.ink900,
            outline: "none"
          }}
        />
      ))}
    </div>
  );
}
