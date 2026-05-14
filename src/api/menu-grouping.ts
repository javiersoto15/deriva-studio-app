// Pure, isomorphic menu-shape helpers. Lives outside hooks.ts so server.ts can
// import it without dragging the React Query client module into an RSC.

import type { components } from "./schema";

export type MenuItem = components["schemas"]["MenuItem"];
export type MenuSection = { id: string; name: string; items: MenuItem[] };
export type MenuCategory = { id: string; name: string; sections: MenuSection[] };
export type MenuView = {
  categories: MenuCategory[];
  today_origin: { id: string; label: string };
};

// Canonical category ordering — keeps server and client agreeing on display order.
export const CATEGORY_ORDER: ReadonlyArray<NonNullable<MenuItem["category_id"]>> = [
  "coffee",
  "beverage",
  "breakfast",
  "savory",
  "entree",
  "dessert"
];

// Canonical section ordering inside a category.
export const SECTION_ORDER: ReadonlyArray<NonNullable<MenuItem["section_id"]>> = [
  "espresso",
  "filtered",
  "cold-coffee",
  "mate",
  "breakfast",
  "croissants",
  "baguettes",
  "toasts",
  "focaccias",
  "starters",
  "mains",
  "cakes-pies",
  "bakes"
];

// Spanish display labels keyed by the backend's canonical slug. Used in
// preference to the backend's `category_label` / `section_label` (which the
// current contract returns in English). When a backend ships a new id we
// haven't translated yet, the lookup falls back to the backend label so the
// UI still renders something readable.
export const CATEGORY_LABELS_ES: Record<NonNullable<MenuItem["category_id"]>, string> = {
  coffee: "Café",
  beverage: "Bebidas",
  breakfast: "Desayuno",
  savory: "Salado",
  entree: "Cocina",
  dessert: "Postres"
};

export const SECTION_LABELS_ES: Record<NonNullable<MenuItem["section_id"]>, string> = {
  espresso: "Espresso",
  filtered: "Filtrado",
  "cold-coffee": "Café frío",
  mate: "Mate",
  breakfast: "Desayuno",
  croissants: "Croissants",
  baguettes: "Baguettes",
  toasts: "Tostadas",
  focaccias: "Focaccias",
  starters: "Entradas",
  mains: "Fondos",
  "cakes-pies": "Pies & Tortas",
  bakes: "Queques & Brownies"
};

// Groups a flat MenuItem[] into the nested category → section shape the UI
// consumes. Items missing category_id fall into a single synthetic "Menú"
// category so the page still renders during the backend seed-backfill
// transition.
export function groupMenuItems(items: MenuItem[]): MenuCategory[] {
  const byCategory = new Map<string, Map<string, { label: string; items: MenuItem[] }>>();
  const categoryLabels = new Map<string, string>();

  for (const item of items) {
    const catKey = item.category_id ?? "__uncategorized";
    // Spanish label > backend label > "Menú" fallback.
    const catLabel =
      (item.category_id && CATEGORY_LABELS_ES[item.category_id]) ??
      item.category_label ??
      "Menú";
    if (!categoryLabels.has(catKey)) categoryLabels.set(catKey, catLabel);

    const sections = byCategory.get(catKey) ?? new Map();
    byCategory.set(catKey, sections);

    const secKey = item.section_id ?? item.section;
    const secLabel =
      (item.section_id && SECTION_LABELS_ES[item.section_id]) ??
      item.section_label ??
      item.section;
    const bucket = sections.get(secKey) ?? { label: secLabel, items: [] };
    bucket.items.push(item);
    sections.set(secKey, bucket);
  }

  const categoryRank = (id: string) => {
    const idx = (CATEGORY_ORDER as readonly string[]).indexOf(id);
    return idx === -1 ? CATEGORY_ORDER.length : idx;
  };
  const sectionRank = (id: string) => {
    const idx = (SECTION_ORDER as readonly string[]).indexOf(id);
    return idx === -1 ? SECTION_ORDER.length : idx;
  };

  return Array.from(byCategory.entries())
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b))
    .map(([catId, sectionMap]) => ({
      id: catId,
      name: categoryLabels.get(catId) ?? catId,
      sections: Array.from(sectionMap.entries())
        .sort(([a], [b]) => sectionRank(a) - sectionRank(b))
        .map(([secId, { label, items }]) => ({ id: secId, name: label, items }))
    }));
}
