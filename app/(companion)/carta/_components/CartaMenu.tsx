"use client";

import { useLocale, useTranslations } from "next-intl";

import { useCompanionMenu } from "../../../../src/api/hooks";
import { useActiveBackendLocale } from "../../../../src/i18n/use-active-locale";
import type { Locale } from "../../../../src/i18n/locale";
import { colors } from "../../../../src/design/tokens";
import { MenuSections } from "./MenuSections";

export function CartaMenu() {
  const t = useTranslations("menu");
  const locale = useLocale() as Locale;
  const backendLocale = useActiveBackendLocale();
  const { data: menu, error, isLoading } = useCompanionMenu(backendLocale);
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
    <MenuSections
      menu={menu ?? null}
      locale={locale}
      offerLabels={{
        offer: t("offer"),
        includes: t("offer_includes"),
        rates: t("offer_rates"),
        soldOut: t("offer_sold_out"),
        included: t("offer_included"),
        fixedPrice: t("offer_fixed_price"),
        supplement: t("offer_supplement"),
        controlledSelection: t("offer_controlled_selection")
      }}
    />
  );
}
