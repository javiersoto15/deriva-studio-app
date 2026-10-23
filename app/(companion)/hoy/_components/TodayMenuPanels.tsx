import Link from "next/link";

import type { PublicMenuView } from "../../../../src/api/hooks";
import { clp } from "../../../../src/api/offer-variants";
import type { Locale } from "../../../../src/i18n/locale";
import {
  collectAvailableAuthorCoffees,
  collectMenuPromotions
} from "../../../../src/companion/menu-discovery";
import { colors } from "../../../../src/design/tokens";
import { MenuOfferCard, type MenuOfferCardLabels } from "../../carta/_components/MenuOfferCard";

export type TodayMenuLabels = {
  promotions: string;
  promotionsEmpty: string;
  authorCoffee: string;
  authorCoffeeItem: string;
  authorEmpty: string;
  previousPromotion: string;
  nextPromotion: string;
  previousCoffee: string;
  nextCoffee: string;
  viewMenu: string;
  position: string;
  authorBy: string;
};

type Props = {
  menu: PublicMenuView;
  locale: Locale;
  promotionIndex: number | null;
  authorIndex: number | null;
  labels: TodayMenuLabels;
  offerLabels: MenuOfferCardLabels;
  onPromotionIndexChange: (index: number) => void;
  onAuthorIndexChange: (index: number) => void;
};

/** Presentational discovery panels. The payload stays backend-owned. */
export function TodayMenuPanels({
  menu,
  locale,
  promotionIndex,
  authorIndex,
  labels,
  offerLabels,
  onPromotionIndexChange,
  onAuthorIndexChange
}: Props) {
  const promotions = collectMenuPromotions(menu);
  const coffees = collectAvailableAuthorCoffees(menu);
  const currentPromotion = promotions[promotionIndex ?? -1];
  const currentCoffee = coffees[authorIndex ?? -1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 14px 0" }}>
      <section aria-labelledby="today-promotions-title" style={panelStyle}>
        <PanelHeader
          title={labels.promotions}
          id="today-promotions-title"
          count={promotions.length}
          index={promotionIndex}
          previousLabel={labels.previousPromotion}
          nextLabel={labels.nextPromotion}
          onChange={onPromotionIndexChange}
        />
        {currentPromotion ? (
          <MenuOfferCard
            offer={currentPromotion.offer}
            sectionTitle={currentPromotion.sectionTitle}
            locale={locale}
            labels={offerLabels}
          />
        ) : (
          <p style={emptyTextStyle}>{labels.promotionsEmpty}</p>
        )}
      </section>

      <section aria-labelledby="today-author-title" style={panelStyle}>
        <PanelHeader
          title={labels.authorCoffee}
          id="today-author-title"
          count={coffees.length}
          index={authorIndex}
          previousLabel={labels.previousCoffee}
          nextLabel={labels.nextCoffee}
          onChange={onAuthorIndexChange}
        />
        {currentCoffee ? (
          <article aria-label={`${labels.authorCoffeeItem}: ${currentCoffee.name}`} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14 }}>
            {currentCoffee.author ? <SmallLabel>{labels.authorBy} · {currentCoffee.author}</SmallLabel> : null}
            <h2 style={coffeeTitleStyle}>{currentCoffee.name}</h2>
            {currentCoffee.description ? <p style={descriptionStyle}>{currentCoffee.description}</p> : null}
            {currentCoffee.tasting_note ? <p style={tastingStyle}>{currentCoffee.tasting_note}</p> : null}
            {currentCoffee.price_label || typeof currentCoffee.price_clp === "number" ? (
              <span style={priceStyle}>
                {currentCoffee.price_label ?? clp(currentCoffee.price_clp as number)}
              </span>
            ) : null}
            <Link href={`/carta/${currentCoffee.id}`} style={actionLinkStyle}>
              {labels.viewMenu} →
            </Link>
          </article>
        ) : (
          <p style={emptyTextStyle}>{labels.authorEmpty}</p>
        )}
      </section>
    </div>
  );
}

function PanelHeader({
  title,
  id,
  count,
  index,
  previousLabel,
  nextLabel,
  onChange
}: {
  title: string;
  id: string;
  count: number;
  index: number | null;
  previousLabel: string;
  nextLabel: string;
  onChange: (next: number) => void;
}) {
  const current = index === null ? 0 : index + 1;
  const position = count > 0 ? `${current} / ${count}` : "—";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <h2 id={id} style={panelTitleStyle}>{title}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span aria-live="polite" style={positionStyle}>{position}</span>
        <button
          type="button"
          className="tap-target"
          aria-label={previousLabel}
          disabled={count < 2}
          onClick={() => onChange((current - 2 + count) % count)}
          style={controlStyle(count < 2)}
        >
          ←
        </button>
        <button
          type="button"
          className="tap-target"
          aria-label={nextLabel}
          disabled={count < 2}
          onClick={() => onChange(current % count)}
          style={controlStyle(count < 2)}
        >
          →
        </button>
      </div>
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.inkMuted }}>
      {children}
    </span>
  );
}

const panelStyle: React.CSSProperties = {
  backgroundColor: colors.beige50,
  padding: "14px 16px 16px",
  display: "flex",
  flexDirection: "column",
  minWidth: 0
};
const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  flex: "1 1 auto",
  minWidth: 0,
  overflowWrap: "anywhere",
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.inkMuted
};
const positionStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  color: colors.inkMuted,
  whiteSpace: "nowrap"
};
const coffeeTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 28,
  lineHeight: "32px",
  color: colors.ink900,
  overflowWrap: "anywhere"
};
const descriptionStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-tracked), sans-serif",
  fontSize: 13,
  lineHeight: "19px",
  color: colors.ink900,
  overflowWrap: "anywhere"
};
const tastingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 14,
  lineHeight: "19px",
  color: colors.inkMuted
};
const priceStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  color: colors.ink900
};
const actionLinkStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  color: colors.brown700,
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textDecoration: "none"
};
const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  paddingTop: 14,
  fontFamily: "var(--font-display), serif",
  fontStyle: "italic",
  fontSize: 16,
  color: colors.inkMuted
};

function controlStyle(disabled: boolean): React.CSSProperties {
  return {
    minWidth: 44,
    minHeight: 44,
    padding: "0 8px",
    border: `1px solid ${colors.hairline}`,
    borderRadius: 999,
    background: "transparent",
    color: disabled ? colors.inkMuted : colors.brown700,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "var(--font-mono), monospace",
    fontSize: 13
  };
}
