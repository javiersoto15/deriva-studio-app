"use client";

import { colors } from "../design/tokens";

export type TopHeaderLang = "es" | "en";

export type TopHeaderProps = {
  lang?: TopHeaderLang;
  onLangChange?: (lang: TopHeaderLang) => void;
};

// Rule 23 — Tabbed-surface top header: "Deriva" wordmark left, ES | EN toggle right.
// Active lang in brown-700, inactive in ink-muted. Plex Mono 11px / +0.08em.
export function TopHeader({ lang = "es", onLangChange }: TopHeaderProps) {
  const langButton = (target: TopHeaderLang, label: string) => (
    <button
      type="button"
      onClick={() => onLangChange?.(target)}
      aria-pressed={lang === target}
      style={{
        background: "transparent",
        border: "none",
        // Phantom hit area: 44pt minimum without altering the visual mark.
        // The text stays inline-flex centered inside the tap zone.
        minHeight: 44,
        minWidth: 44,
        padding: "12px 6px",
        margin: "-12px -6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        color: lang === target ? colors.brown700 : colors.inkMuted
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: colors.beige100,
        paddingTop: 8,
        paddingBottom: 8,
        marginTop: -8,
        marginBottom: -8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%"
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 20,
          letterSpacing: "-0.01em",
          color: colors.brown700
        }}
      >
        Deriva
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {langButton("es", "ES")}
        <span
          aria-hidden
          style={{
            color: colors.inkMuted,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11
          }}
        >
          |
        </span>
        {langButton("en", "EN")}
      </div>
    </div>
  );
}
