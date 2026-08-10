import type { PublicMenuItem, PublicMenuView } from "../api/server";
import type { CartaChip } from "../components/landing/CartaScroller";
import type { PhotoSlug } from "../data/photos";

const PREFERRED_ITEM_IDS = [
  "espresso",
  "cappuccino",
  "pourover",
  "coffee-flight",
  "decaf-filter",
  "bolsa-de-cafe-250-g"
] as const;

const ITEM_PHOTOS: Partial<Record<(typeof PREFERRED_ITEM_IDS)[number], PhotoSlug>> = {
  cappuccino: "cappuccino",
  pourover: "pour-over",
  "decaf-filter": "espresso-tropical"
};

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

  return PREFERRED_ITEM_IDS.flatMap((id, index) => {
    const found = publicItems.get(id);
    if (!found) return [];

    return [
      {
        slug: found.item.id,
        section: found.section,
        index: String(index + 1).padStart(2, "0"),
        name: found.item.name,
        italic: "",
        notes: found.item.description,
        price: formatPrice(found.item),
        href: "/menu#section-cafeteria",
        photo: ITEM_PHOTOS[id]
      }
    ];
  });
}
