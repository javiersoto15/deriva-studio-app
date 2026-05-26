import Link from "next/link";
import { colors } from "../design/tokens";

export type MenuRowProps = {
  href: string;
  name: string;
  spec?: string;
  priceClp?: number;
  priceLabel?: string;
  available?: boolean;
};

// Rule 24 — Multi-line menu row.
// Title: Cormorant Garamond regular (not italic) 22px / 1.2 / ink
// Spec line: Poppins 400 13px ink-muted, 4-6px below title
// Price: Plex Mono 12px ink, right-aligned, baseline-aligned with title
//
// Unavailable state — name/spec rendered at reduced opacity with a 3px blur
// (legible-but-obscured, signals "not now"); price slot replaced with a mono
// "Próximamente" pill; row rendered as a <div> (no Link) so it's not tappable
// and doesn't deep-link into a detail page for an item we can't serve.
export function MenuRow({
  href,
  name,
  spec,
  priceClp,
  priceLabel,
  available = true
}: MenuRowProps) {
  const titleNode = (
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
  );

  const specNode = spec ? (
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
  ) : null;

  const rightSlot = available ? (
    <span
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 12,
        color: colors.ink900,
        whiteSpace: "nowrap",
        marginTop: 4
      }}
    >
      {priceLabel ?? (typeof priceClp === "number" ? `$ ${priceClp.toLocaleString("es-CL")}` : "")}
    </span>
  ) : (
    <span
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: colors.inkMuted,
        border: `1px solid ${colors.hairline}`,
        borderRadius: 999,
        padding: "3px 8px",
        whiteSpace: "nowrap",
        marginTop: 4
      }}
    >
      Próximamente
    </span>
  );

  const body = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        filter: available ? undefined : "blur(3px)",
        opacity: available ? 1 : 0.55,
        userSelect: available ? undefined : "none"
      }}
      aria-hidden={available ? undefined : true}
    >
      {titleNode}
      {specNode}
    </div>
  );

  const rowStyle = {
    display: "flex",
    alignItems: "flex-start" as const,
    gap: 16,
    padding: "16px 0",
    borderTop: `1px solid ${colors.hairline}`,
    textDecoration: "none"
  };

  if (!available) {
    return (
      <div
        style={{ ...rowStyle, cursor: "default" }}
        aria-disabled
        aria-label={`${name} — próximamente`}
      >
        {body}
        {rightSlot}
      </div>
    );
  }

  return (
    <Link href={href} style={rowStyle}>
      {body}
      {rightSlot}
    </Link>
  );
}
