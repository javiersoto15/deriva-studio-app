// Deriva Companion design tokens — Recipe v1.2
// Source of truth: docs/plans/2026-05-10-companion-app-design-recipe.md
// Hex values are the recipe canonical palette, verified against Paper artboards.
// Do not introduce off-recipe hex values. Extend via this file only.

export const colors = {
  // Browns (recipe canonical)
  brown700: "#5E230F",
  brown800: "#532817",
  brown900: "#281A12",
  // Creams / beiges
  beige50: "#FAF5EC",
  beige100: "#F4EDE6",
  beige200: "#E8DBC0",
  beige300: "#D7C7AB",
  // Inks
  ink: "#1A1410",
  ink900: "#1A1410",
  inkMuted: "#5E5348",
  // Hairlines — Rule 2 four-tier grammar
  hairline: "rgba(94,35,15,0.14)",
  hairlineLight: "rgba(94,35,15,0.08)",
  hairlineMark: "#5E230F",
  // Hairline on espresso ground — cream at 14% (used on /codigo, /canjear)
  hairlineOnDark: "rgba(244,237,230,0.14)",
  // States — brown-700 carries every alert state per Rule 11
  errorBrown: "#5E230F",
  successBrown: "#5E230F",
  // Single green moment (Rule 5)
  green: "#00311F"
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = {
  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,
  sp8: 32,
  sp10: 40,
  sp12: 48,
  sp16: 64,
  sp24: 96,
  sp32: 128
} as const;

export type SpacingToken = keyof typeof spacing;

export const radii = {
  none: 0,
  sm: 2,
  md: 8,
  lg: 14,
  pill: 999
} as const;

export const hairlines = {
  hairline: 1,
  hairlineLight: 1,
  hairlineMark: 1
} as const;

// Type pairings — Recipe Rule 3.
export type TypeSpec = {
  fontFamily: string;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  textTransform?: "uppercase" | "none";
};

export function cormorantItalic(size: number): TypeSpec {
  return {
    fontFamily: "var(--font-display)",
    fontWeight: 300,
    fontStyle: "italic",
    fontSize: size,
    lineHeight: Math.round(size * 1.1),
    letterSpacing: "-0.01em"
  };
}

export function plexMono(size: number): TypeSpec {
  return {
    fontFamily: "var(--font-mono)",
    fontWeight: 400,
    fontStyle: "normal",
    fontSize: size,
    lineHeight: Math.round(size * 1.4),
    letterSpacing: "0.05em"
  };
}

export function poppinsTracked(size: number): TypeSpec {
  return {
    fontFamily: "var(--font-tracked)",
    fontWeight: 600,
    fontStyle: "normal",
    fontSize: size,
    lineHeight: Math.round(size * 1.4),
    letterSpacing: "0.22em",
    textTransform: "uppercase"
  };
}

export const tokens = { colors, spacing, radii, hairlines };
