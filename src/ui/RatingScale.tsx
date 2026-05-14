"use client";

import { colors } from "../design/tokens";

export type RatingScaleProps = {
  value: number; // 0 = none, 1..5
  onChange: (next: number) => void;
  labels?: [string, string]; // left/right anchor
  // Optional aria-label for the radiogroup; defaults to "Valoración".
  ariaLabel?: string;
};

// 5 hairline circles. Selected fills brown-700, others outline only.
// Phase 1D D1 — exposes role="radiogroup" + role="radio"/aria-checked per circle.
export function RatingScale({
  value,
  onChange,
  labels = ["FLOJO", "RITUAL"],
  ariaLabel = "Valoración de 1 a 5"
}: RatingScaleProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`Valoración ${n} de 5`}
              tabIndex={active || (value === 0 && n === 1) ? 0 : -1}
              onClick={() => onChange(n)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: `1px solid ${colors.brown700}`,
                backgroundColor: active ? colors.brown700 : "transparent",
                cursor: "pointer",
                padding: 0
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  );
}
