import type { PublicMenuItem, PublicMenuView } from "../api/server";
import type { CartaChip } from "../components/landing/CartaScroller";
import type { PhotoSlug } from "../data/photos";

/** How many chips the landing strip shows when enough candidates are available. */
export const LANDING_CHIP_COUNT = 6;

// Ordered candidates for the "Hoy se sirve esto." strip.
//
// `photo` is REQUIRED here on purpose. CartaChip.photo is optional because the
// component can fall back to a text placeholder, but on this surface that
// fallback reads as a broken card — so the type makes it impossible to feature
// an item we have no photography for. Adding an entry without a photo is a
// compile error, not something discovered on the live homepage.
//
// The list is a ranked pool, not a fixed six: we take the first
// LANDING_CHIP_COUNT the backend reports available today, so an item that goes
// unavailable is replaced by the next candidate instead of leaving a hole.
type HighlightCandidate = {
  id: string;
  photo: PhotoSlug;
  photoPosition?: string;
};

export const HIGHLIGHT_CANDIDATES: readonly HighlightCandidate[] = [
  { id: "cappuccino", photo: "cappuccino" },
  { id: "latte", photo: "latte" },
  { id: "pourover", photo: "pour-over" },
  // Backend id `decaf-filter` is the drink named "Espresso Tropical".
  { id: "decaf-filter", photo: "espresso-tropical" },
  { id: "capuccino-mediterraneo", photo: "mediterraneo" },
  { id: "bosque-valdiviano", photo: "valdiviano" },
  // Reserves — used when one of the above is unavailable for the day.
  { id: "latte-citrus-bloom", photo: "citrus-bloom" },
  { id: "espresso-rose", photo: "rose" },
  // Backend id `v60` is the filter serve "Tierra & Hierbas".
  { id: "v60", photo: "filtrado" },
  // Backend id `capuccino` is Mate (a known id/name mismatch upstream).
  { id: "capuccino", photo: "mate" }
] as const;

function formatPrice(item: PublicMenuItem): string | undefined {
  if (item.price_label?.trim()) return item.price_label;
  if (typeof item.price_clp !== "number") return undefined;
  return `$${item.price_clp.toLocaleString("es-CL")}`;
}

export function selectLandingCoffeeHighlights(menu: PublicMenuView): CartaChip[] {
  const publicItems = new Map<string, { item: PublicMenuItem; section: string }>();

  for (const section of menu.sections) {
    const sectionName = section.title.replace(/\.$/, "");
    for (const item of section.items ?? []) {
      if (item.available) publicItems.set(item.id, { item, section: sectionName });
    }
    for (const subgroup of section.subgroups ?? []) {
      for (const item of subgroup.items ?? []) {
        if (item.available) publicItems.set(item.id, { item, section: sectionName });
      }
    }
  }

  const chips: CartaChip[] = [];
  for (const candidate of HIGHLIGHT_CANDIDATES) {
    if (chips.length >= LANDING_CHIP_COUNT) break;
    const found = publicItems.get(candidate.id);
    if (!found) continue;

    chips.push({
      slug: found.item.id,
      section: found.section,
      // Numbered by final position so the strip always reads 01..0N with no
      // gaps, even when a candidate was skipped as unavailable.
      index: String(chips.length + 1).padStart(2, "0"),
      name: found.item.name,
      italic: "",
      notes: found.item.description,
      price: formatPrice(found.item),
      href: "/menu#section-cafeteria",
      photo: candidate.photo,
      photoPosition: candidate.photoPosition
    });
  }

  return chips;
}
