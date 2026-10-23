import Link from "next/link";

import {
  clp,
  commonComponents,
  formatWindow,
  hasControlledSelection,
  offerShape,
  resolveComponents,
  type PublicMenuOffer
} from "../../../../src/api/offer-variants";
import type { Locale } from "../../../../src/i18n/locale";
import { colors } from "../../../../src/design/tokens";

export type MenuOfferCardLabels = {
  offer: string;
  includes: string;
  rates: string;
  soldOut: string;
  included: string;
  fixedPrice: string;
  supplement: string;
  controlledSelection: string;
};

type Props = {
  offer: PublicMenuOffer;
  locale: Locale;
  labels: MenuOfferCardLabels;
  sectionTitle?: string;
};

/** Display-only companion card for backend-authored offers and prices. */
export function MenuOfferCard({ offer, locale, labels, sectionTitle }: Props) {
  const shape = offerShape(offer);

  return (
    <article
      aria-label={`${labels.offer}: ${offer.title}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "16px 0",
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sectionTitle ? <SmallLabel>{sectionTitle}</SmallLabel> : null}
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 22,
            lineHeight: "27px",
            color: colors.ink900
          }}
        >
          {offer.title}
        </h3>
        {offer.description ? (
          <p style={bodyTextStyle}>{offer.description}</p>
        ) : null}
      </div>

      {(offer.service_windows ?? []).length > 0 ? (
        <ul
          aria-label={labels.offer}
          style={{ display: "flex", flexDirection: "column", gap: 4, listStyle: "none", margin: 0, padding: 0 }}
        >
          {offer.service_windows?.map((window) => (
            <li key={window.id} style={{ ...bodyTextStyle, color: colors.inkMuted }}>
              {formatWindow(window, locale)}
            </li>
          ))}
        </ul>
      ) : null}

      {shape === "variants" ? <VariantPrices offer={offer} labels={labels} /> : null}
      {shape === "detail" ? <OfferDetail offer={offer} labels={labels} /> : null}
    </article>
  );
}

function VariantPrices({
  offer,
  labels
}: {
  offer: PublicMenuOffer;
  labels: MenuOfferCardLabels;
}) {
  const variants = offer.variants ?? [];
  const shared = commonComponents(variants);
  const sharedKeys = new Set(shared.map(componentKey));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {shared.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <SmallLabel>{labels.includes}</SmallLabel>
          <ul style={listStyle}>
            {shared.map((component) => (
              <li key={component.id} style={bodyTextStyle}>
                <ComponentName component={component} labels={labels} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SmallLabel>{labels.rates}</SmallLabel>
        <ul style={listStyle}>
          {variants.map((variant) => {
            const remaining = resolveComponents(variant.components).filter(
              (component) => !sharedKeys.has(componentKey(component))
            );
            return (
              <li key={variant.id} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "5px 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ ...bodyTextStyle, flex: "1 1 auto", minWidth: 0, overflowWrap: "anywhere" }}>{variant.label}</span>
                  <span style={{ ...bodyTextStyle, flexShrink: 0, whiteSpace: "nowrap", color: colors.ink900 }}>
                    {clp(variant.price_clp)}
                  </span>
                </div>
                {remaining.length > 0 ? (
                  <ul style={listStyle}>
                    {remaining.map((component) => (
                      <li key={component.id} style={{ ...bodyTextStyle, color: colors.inkMuted }}>
                        <ComponentName component={component} labels={labels} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {hasControlledSelection(variants) ? (
        <p style={{ ...bodyTextStyle, color: colors.inkMuted }}>{labels.controlledSelection}</p>
      ) : null}
    </div>
  );
}

function OfferDetail({ offer, labels }: { offer: PublicMenuOffer; labels: MenuOfferCardLabels }) {
  const detail = offer.detail;
  if (!detail) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {detail.title ? <SmallLabel>{detail.title}</SmallLabel> : null}
      {detail.description ? <p style={bodyTextStyle}>{detail.description}</p> : null}
      {detail.items.length > 0 ? (
        <ul style={{ ...listStyle, borderTop: `1px solid ${colors.hairlineLight}` }}>
          {detail.items.map(({ item, quantity, pricing }, index) => (
            <li
              key={`${item.id}-${index}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: `1px solid ${colors.hairlineLight}` }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={bodyTextStyle}>
                  <Link href={`/carta/${item.id}`} style={{ color: colors.ink900, textDecoration: "none" }}>
                    {item.name}
                  </Link>
                  {quantity > 1 ? <span style={{ color: colors.inkMuted }}> ×{quantity}</span> : null}
                  {item.available === false ? <span style={{ color: colors.inkMuted }}> · {labels.soldOut}</span> : null}
                </span>
                {item.price_label || typeof item.price_clp === "number" ? (
                  <span style={{ ...bodyTextStyle, color: colors.inkMuted }}>
                    {item.price_label ?? clp(item.price_clp as number)}
                  </span>
                ) : null}
              </span>
              {pricing ? (
                <span style={{ ...bodyTextStyle, color: colors.brown700, textAlign: "right" }}>
                  {formatPricing(pricing, labels)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ComponentName({
  component,
  labels
}: {
  component: ReturnType<typeof resolveComponents>[number];
  labels: MenuOfferCardLabels;
}) {
  const amount = component.quantity > 1 ? `×${component.quantity} ` : "";
  if (component.kind === "selection") return <>{amount}{component.label}†</>;
  return (
    <>
      {amount}{component.name}
      {!component.available ? <span style={{ color: colors.inkMuted }}> · {labels.soldOut}</span> : null}
    </>
  );
}

function componentKey(component: ReturnType<typeof resolveComponents>[number]): string {
  return component.kind === "item"
    ? `item:${component.quantity}:${component.name}`
    : `selection:${component.quantity}:${component.label}`;
}

function formatPricing(
  pricing: NonNullable<NonNullable<PublicMenuOffer["detail"]>["items"][number]["pricing"]>,
  labels: MenuOfferCardLabels
): string | null {
  if (pricing.kind === "included") return labels.included;
  if (typeof pricing.amount_clp !== "number") return null;
  if (pricing.kind === "fixed") return `${labels.fixedPrice} · ${clp(pricing.amount_clp)}`;
  if (pricing.kind === "supplement") return `+ ${clp(pricing.amount_clp)} · ${labels.supplement}`;
  return null;
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: colors.inkMuted
      }}
    >
      {children}
    </span>
  );
}

const listStyle: React.CSSProperties = { listStyle: "none", margin: 0, padding: 0 };
const bodyTextStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-tracked), sans-serif",
  fontSize: 12,
  lineHeight: "18px",
  color: colors.ink900,
  overflowWrap: "anywhere"
};
