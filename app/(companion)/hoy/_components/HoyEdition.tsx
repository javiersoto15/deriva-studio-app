"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { useCompanionMenu } from "../../../../src/api/hooks";
import { useActiveBackendLocale } from "../../../../src/i18n/use-active-locale";
import type { Locale } from "../../../../src/i18n/locale";
import { collectAvailableAuthorCoffees, collectMenuPromotions, dailySelectionIndex } from "../../../../src/companion/menu-discovery";
import type { EditionParts } from "../../../../src/lib/edition";
import { colors } from "../../../../src/design/tokens";
import { TodayMenuPanels } from "./TodayMenuPanels";

export function HoyEdition({ edition }: { edition: EditionParts }) {
  const backendLocale = useActiveBackendLocale();
  const locale = useLocale() as Locale;
  const menuQuery = useCompanionMenu(backendLocale);
  const today = useTranslations("today");
  const menuCopy = useTranslations("menu");
  const [manualPromotionIndex, setManualPromotionIndex] = useState<number | null>(null);
  const [manualAuthorIndex, setManualAuthorIndex] = useState<number | null>(null);

  const promotions = useMemo(
    () => (menuQuery.data ? collectMenuPromotions(menuQuery.data) : []),
    [menuQuery.data]
  );
  const authorCoffees = useMemo(
    () => (menuQuery.data ? collectAvailableAuthorCoffees(menuQuery.data) : []),
    [menuQuery.data]
  );
  const initialPromotionIndex = dailySelectionIndex(promotions.length, edition.date, "promotion");
  const initialAuthorIndex = dailySelectionIndex(authorCoffees.length, edition.date, "author");
  useEffect(() => {
    setManualPromotionIndex(null);
    setManualAuthorIndex(null);
  }, [edition.date, promotions.length, authorCoffees.length]);
  const promotionIndex = resolveIndex(manualPromotionIndex, initialPromotionIndex, promotions.length);
  const authorIndex = resolveIndex(manualAuthorIndex, initialAuthorIndex, authorCoffees.length);

  if (!menuQuery.data && menuQuery.error && !menuQuery.isLoading) {
    return (
      <section role="alert" style={stateStyle}>
        <span style={eyebrowStyle}>{today("unavailable")}</span>
        <p style={stateTextStyle}>{today("unavailable_body")}</p>
        <button type="button" onClick={() => void menuQuery.refetch()} style={retryStyle}>
          {today("retry")}
        </button>
      </section>
    );
  }

  if (!menuQuery.data) {
    return (
      <section aria-live="polite" style={stateStyle}>
        <span style={eyebrowStyle}>{today("loading")}</span>
      </section>
    );
  }

  return (
    <TodayMenuPanels
      menu={menuQuery.data}
      locale={locale}
      promotionIndex={promotionIndex}
      authorIndex={authorIndex}
      onPromotionIndexChange={setManualPromotionIndex}
      onAuthorIndexChange={setManualAuthorIndex}
      labels={{
        promotions: today("promotions"),
        promotionsEmpty: today("promotions_empty"),
        authorCoffee: today("author_coffee"),
        authorCoffeeItem: today("author_coffee_item"),
        authorEmpty: today("author_empty"),
        previousPromotion: today("previous_promotion"),
        nextPromotion: today("next_promotion"),
        previousCoffee: today("previous_coffee"),
        nextCoffee: today("next_coffee"),
        viewMenu: today("view_menu"),
        position: today("position"),
        authorBy: today("author_by")
      }}
      offerLabels={{
        offer: menuCopy("offer"),
        includes: menuCopy("offer_includes"),
        rates: menuCopy("offer_rates"),
        soldOut: menuCopy("offer_sold_out"),
        included: menuCopy("offer_included"),
        fixedPrice: menuCopy("offer_fixed_price"),
        supplement: menuCopy("offer_supplement"),
        controlledSelection: menuCopy("offer_controlled_selection")
      }}
    />
  );
}

function resolveIndex(manual: number | null, initial: number | null, count: number): number | null {
  if (count === 0) return null;
  const index = manual ?? initial ?? 0;
  return ((index % count) + count) % count;
}

const stateStyle: React.CSSProperties = {
  margin: "10px 14px 0",
  padding: "18px",
  backgroundColor: colors.beige50,
  display: "flex",
  flexDirection: "column",
  gap: 8
};
const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.inkMuted
};
const stateTextStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 16,
  color: colors.ink900
};
const retryStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  minHeight: 44,
  padding: 0,
  border: 0,
  background: "transparent",
  color: colors.brown700,
  cursor: "pointer",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};
