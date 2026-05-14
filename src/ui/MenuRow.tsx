import Link from "next/link";
import { colors } from "../design/tokens";

export type MenuRowProps = {
  href: string;
  name: string;
  spec?: string;
  priceClp: number;
};

// Rule 24 — Multi-line menu row.
// Title: Cormorant Garamond regular (not italic) 22px / 1.2 / ink
// Spec line: Poppins 400 13px ink-muted, 4-6px below title
// Price: Plex Mono 12px ink, right-aligned, baseline-aligned with title
export function MenuRow({ href, name, spec, priceClp }: MenuRowProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 0",
        borderTop: `1px solid ${colors.hairline}`,
        textDecoration: "none"
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: 22,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: colors.ink900
          }}
        >
          {name}
        </span>
        {spec && (
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              fontSize: 13,
              lineHeight: "18px",
              color: colors.inkMuted
            }}
          >
            {spec}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: colors.ink900,
          whiteSpace: "nowrap",
          marginTop: 4
        }}
      >
        $ {priceClp.toLocaleString("es-CL")}
      </span>
    </Link>
  );
}
