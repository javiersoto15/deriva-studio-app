import type { components } from "./schema";

// Shared, surface-agnostic rules for items priced per coffee origin.
//
// Both the public carta (/menu) and the companion item detail (/carta/[id])
// render the same backend `origin_options`, so the filtering and grouping rules
// live here rather than in either component. Everything is backend-owned: this
// module decides nothing about price, order, or labels — it only drops options
// that cannot be displayed and groups what remains.

export type PricedOrigin = components["schemas"]["MenuOriginSummary"];

export type OriginTierGroup = {
  tier: string | undefined;
  /** Backend `tier_label`. Undefined means: render the group with no heading. */
  tierLabel: string | undefined;
  origins: PricedOrigin[];
};

/** Origins that can actually be shown: available (default true) and priced. */
export function renderableOrigins(origins: readonly PricedOrigin[] = []): PricedOrigin[] {
  return origins.filter(
    (origin) => origin.available !== false && typeof origin.price_clp === "number"
  );
}

/** True when the renderable origins disagree on price — the "Desde" trigger. */
export function hasMultipleOriginPrices(origins: readonly PricedOrigin[] = []): boolean {
  const distinct = new Set(renderableOrigins(origins).map((origin) => origin.price_clp));
  return distinct.size > 1;
}

/**
 * Groups origins by backend `tier`, preserving the order in which each tier
 * first appears in the response. A backend that returns premium first renders
 * premium first; a backend that adds a third tier gets a third group for free.
 */
export function groupByTier(origins: readonly PricedOrigin[]): OriginTierGroup[] {
  const groups = new Map<string, OriginTierGroup>();
  for (const origin of origins) {
    const key = origin.tier ?? "";
    let group = groups.get(key);
    if (!group) {
      group = { tier: origin.tier, tierLabel: origin.tier_label, origins: [] };
      groups.set(key, group);
    }
    // First non-empty tier_label in the group wins; we never invent one.
    if (!group.tierLabel && origin.tier_label) group.tierLabel = origin.tier_label;
    group.origins.push(origin);
  }
  return [...groups.values()];
}

/** Display label for one origin. Never falls back to a raw id. */
export function originName(origin: PricedOrigin): string {
  return origin.display_name ?? origin.name;
}
