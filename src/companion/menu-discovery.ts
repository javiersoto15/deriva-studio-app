import type { PublicMenuItem, PublicMenuView } from "../api/hooks";
import type { PublicMenuOffer } from "../api/offer-variants";

export type MenuPromotion = {
  sectionId: string;
  sectionTitle: string;
  offer: PublicMenuOffer;
};

/**
 * Carta de autor is a canonical menu subgroup. The backend `signature` flag
 * is also used for items outside that subgroup, so it is not sufficient for
 * this discovery surface.
 */
export function collectAvailableAuthorCoffees(menu: PublicMenuView): PublicMenuItem[] {
  const seen = new Set<string>();
  const items: PublicMenuItem[] = [];

  for (const section of menu.sections ?? []) {
    for (const subgroup of section.subgroups ?? []) {
      if (subgroup.id !== "cafes-autor") continue;
      for (const item of subgroup.items ?? []) {
        if (!item || item.available === false || seen.has(item.id)) continue;
        seen.add(item.id);
        items.push(item);
      }
    }
  }

  return items;
}

/** Offers are already filtered to the current schedule by /me/menu. */
export function collectMenuPromotions(menu: PublicMenuView): MenuPromotion[] {
  const seen = new Set<string>();
  const promotions: MenuPromotion[] = [];

  for (const section of menu.sections ?? []) {
    for (const offer of section.offers ?? []) {
      if (!offer || seen.has(offer.id)) continue;
      seen.add(offer.id);
      promotions.push({
        sectionId: section.id,
        sectionTitle: section.title,
        offer
      });
    }
  }

  return promotions;
}

/** YYYY-MM-DD for the current calendar date in Santiago, regardless of device timezone. */
export function santiagoDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Stable per-Santiago-day selection. The salt gives promotions and coffees independent rotations. */
export function dailySelectionIndex(
  count: number,
  dateKey: string,
  salt: "promotion" | "author"
): number | null {
  if (count <= 0) return null;
  const input = `${salt}:${dateKey}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % count;
}
