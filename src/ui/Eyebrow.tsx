import { type ReactNode } from "react";
import { colors } from "../design/tokens";

export type EyebrowProps = {
  children: ReactNode;
  // Rule 22 — "date" renders a 48×1 hairline-opacity tick + brown-700 label;
  // distinct from the 24×1 solid brown-700 mark of the default (Rule 8).
  variant?: "default" | "date";
  // Surface tone — "light" (default) for cream grounds, "dark" for espresso ground.
  // On dark, label color flips to beige-300 and the mark uses beige-100.
  tone?: "light" | "dark";
};

// Rule 8 — Universal mark: 24×1 brown-700 tick + Poppins 600 / 10px / +0.22em uppercase.
// Rule 22 — Date variant: 48×1 hairline tick + brown-700 label color.
export function Eyebrow({ children, variant = "default", tone = "light" }: EyebrowProps) {
  const isDate = variant === "date";
  const isDark = tone === "dark";
  const labelColor = isDark ? colors.beige300 : isDate ? colors.brown700 : colors.inkMuted;
  const markColor = isDark
    ? colors.beige100
    : isDate
      ? colors.hairline
      : colors.brown700;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: labelColor
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: isDate ? 48 : 24,
          height: 1,
          backgroundColor: markColor
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase"
        }}
      >
        {children}
      </span>
    </div>
  );
}
