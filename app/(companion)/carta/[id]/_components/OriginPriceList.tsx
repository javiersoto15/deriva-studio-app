import React from "react";

import { colors } from "../../../../../src/design/tokens";
import {
  groupByTier,
  hasMultipleOriginPrices,
  originName,
  renderableOrigins,
  type PricedOrigin
} from "../../../../../src/api/origin-pricing";

export {
  groupByTier,
  hasMultipleOriginPrices,
  renderableOrigins,
  type PricedOrigin
} from "../../../../../src/api/origin-pricing";

// Origin-level pricing for the carta item detail. Generic on purpose: it renders
// for ANY MenuItemView that carries priced `origin_options`, never for a specific
// item id. Every string and every number here is backend-owned — the frontend
// only decides layout, ordering is taken verbatim from the response, and tier
// headings come from `tier_label`. No price is ever derived from a tier.
//
// This is an informational menu view, not an order configurator: no inputs, no
// selection state, no CTA.

const labelStyle = {
  fontFamily: "var(--font-tracked), 'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 10,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const
};

const monoStyle = {
  fontFamily: "var(--font-mono), monospace",
  color: colors.ink900
};

function formatCLP(price: number): string {
  // CLP formatting is currency-shaped, not locale copy: the peso is always
  // rendered with es-CL grouping regardless of the UI language.
  return `$ ${price.toLocaleString("es-CL")}`;
}

/**
 * The item price string. Always the backend `price_clp` — never a minimum, a
 * constant, or anything derived from the origin list. Returns null when the
 * backend gave us no price, so callers render nothing rather than a fake value.
 */
export function itemPriceLabel(
  priceClp: number | undefined | null,
  origins: readonly PricedOrigin[] = [],
  fromPrefix?: string
): string | null {
  if (typeof priceClp !== "number") return null;
  const price = formatCLP(priceClp);
  if (!hasMultipleOriginPrices(origins)) return price;
  return fromPrefix ? `${fromPrefix} ${price}` : price;
}

export function ItemPriceRow({
  priceClp,
  origins,
  label,
  fromPrefix
}: {
  priceClp?: number | null;
  origins?: readonly PricedOrigin[];
  label: string;
  fromPrefix?: string;
}) {
  const price = itemPriceLabel(priceClp, origins, fromPrefix);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        padding: "14px 0",
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
      <span style={{ ...labelStyle, color: colors.inkMuted }}>{label}</span>
      {price ? (
        <span style={{ ...monoStyle, fontSize: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
          {price}
        </span>
      ) : null}
    </div>
  );
}

export function OriginPriceList({
  origins,
  label,
  defaultMarker
}: {
  origins?: readonly PricedOrigin[];
  /** Localized accessible + visible section heading (e.g. "Orígenes"). */
  label: string;
  /** Localized marker for the backend default origin (e.g. "Origen de barra"). */
  defaultMarker: string;
}) {
  const available = renderableOrigins(origins);
  if (available.length === 0) return null;

  return (
    <section
      aria-label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        paddingTop: 14,
        borderTop: `1px solid ${colors.hairline}`
      }}
    >
      <h2 style={{ ...labelStyle, margin: 0, color: colors.inkMuted }}>{label}</h2>

      {groupByTier(available).map((group, groupIndex) => (
        <div key={group.tier ?? `tier-${groupIndex}`} style={{ paddingTop: 14 }}>
          {group.tierLabel ? (
            <h3
              style={{
                ...labelStyle,
                margin: "0 0 2px",
                // Rule 11: brown-700 is the only accent, and only on the
                // premium tier heading. Never on a price or an origin name.
                color: group.tier === "premium" ? colors.brown700 : colors.inkMuted
              }}
            >
              {group.tierLabel}
            </h3>
          ) : null}

          {group.origins.map((origin) => (
            <div
              key={origin.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 16,
                padding: "12px 0",
                borderBottom: `1px solid ${colors.hairline}`
              }}
            >
              <span
                style={{
                  // min-width:0 lets a long origin name wrap inside the flex row
                  // instead of pushing the price past the 320px viewport edge.
                  minWidth: 0,
                  flex: "1 1 auto",
                  overflowWrap: "anywhere",
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 400,
                  fontSize: 18,
                  lineHeight: "22px",
                  color: colors.ink900
                }}
              >
                {originName(origin)}
                {origin.default === true ? (
                  <span
                    style={{
                      ...labelStyle,
                      display: "inline-block",
                      marginLeft: 8,
                      fontSize: 8,
                      color: colors.inkMuted,
                      verticalAlign: "middle"
                    }}
                  >
                    {defaultMarker}
                  </span>
                ) : null}
              </span>
              <span style={{ ...monoStyle, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
                {formatCLP(origin.price_clp as number)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
