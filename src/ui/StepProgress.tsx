import Link from "next/link";
import { type ReactNode } from "react";
import { colors } from "../design/tokens";

export type StepProgressProps = {
  current: number;
  total: number;
  backHref?: string;
  // Optional 3rd slot rendered to the right of the indicator (e.g. "Saltar").
  rightSlot?: ReactNode;
};

// Rule 14 — Step header: `← Atrás` left, `NN / NN ● ● — —` middle/right.
// When `rightSlot` is provided, layout becomes: back · indicator · slot.
export function StepProgress({ current, total, backHref, rightSlot }: StepProgressProps) {
  const dots = Array.from({ length: total }, (_, i) => (i < current ? "●" : "—"));
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        color: colors.inkMuted,
        width: "100%"
      }}
    >
      {backHref ? (
        <Link
          href={backHref}
          style={{
            color: colors.brown700,
            textDecoration: "none",
            fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: 13
          }}
        >
          ← Atrás
        </Link>
      ) : (
        <span />
      )}
      <span
        style={{
          letterSpacing: "0.08em",
          marginLeft: rightSlot ? "auto" : 0,
          marginRight: rightSlot ? 16 : 0
        }}
      >
        {pad(current)} / {pad(total)} {dots.join(" ")}
      </span>
      {rightSlot ?? null}
    </div>
  );
}
