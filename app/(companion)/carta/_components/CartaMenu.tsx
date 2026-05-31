"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useCompanionMenu } from "../../../../src/api/hooks";
import { useActiveBackendLocale } from "../../../../src/i18n/use-active-locale";
import { colors } from "../../../../src/design/tokens";
import { MenuSections } from "./MenuSections";

const DEFAULT_ORIGIN = { id: "orig_house_blend_dach", label: "House Blend · DACH" };

export function CartaMenu() {
  const t = useTranslations("menu");
  const locale = useActiveBackendLocale();
  const { data: menu, error, isLoading } = useCompanionMenu(locale);
  // Surface the real failure mode instead of an infinite "Cargando carta"
  // when the menu request errors. The QueryProvider's global error ramp
  // handles 401/403; this is for the everything-else case.
  if (error && !isLoading) {
    return (
      <div
        style={{
          padding: "32px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.brown700
          }}
        >
          {t("unavailable")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 16,
            color: colors.inkMuted
          }}
        >
          {(error as Error).message}
        </span>
      </div>
    );
  }

  return (
    <>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono), monospace",
          fontSize: 12,
          color: colors.inkMuted
        }}
      >
        {t("today_on_bar")} ·{" "}
        {DEFAULT_ORIGIN.id ? (
          <Link
            href={`/carta/origen/${DEFAULT_ORIGIN.id}`}
            style={{ color: colors.brown700, textDecoration: "none" }}
          >
            {DEFAULT_ORIGIN.label}
          </Link>
        ) : (
          "—"
        )}
      </p>

      <MenuSections menu={menu ?? null} />
    </>
  );
}
