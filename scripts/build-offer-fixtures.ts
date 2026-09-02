/**
 * Derives public-shape `/public/menu` offer fixtures from the checked-in ADMIN
 * payloads in 13_companion_backend/docs/examples/public-menu-offers/.
 *
 * Why this exists: the example payloads are the admin shape (menu_item_id +
 * translations). The frontend never sees that — it receives the public shape,
 * where the backend has already resolved menu_item_id → a localized
 * PublicMenuItem and collapsed translations for the requested locale.
 *
 * Hand-typing that conversion invites drift, so this reproduces the backend's
 * `publicMenuOfferForLocale` (internal/menu/public_menu.go @ de078ae):
 *   - variants and components sorted by sort_order, then sort_order dropped
 *   - variant.label and component.display_label replaced from translations
 *   - display_label translated ONLY when menu_item_id is empty
 *   - menu_item_id resolved to the item; component DROPPED if unresolvable
 *   - service_windows sorted by sort_order, then sort_order dropped
 *   - offer title/description replaced from translations
 *
 * Item data is captured from production /public/menu so component items carry
 * real localized names. Run: npx tsx scripts/build-offer-fixtures.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

const EXAMPLES = "../13_companion_backend/docs/examples/public-menu-offers";
const OUT = "tests/menu/fixtures";
const LOCALES = ["es-CL", "en", "pt-BR"] as const;
type Locale = (typeof LOCALES)[number];

// Captured from GET /public/menu?locale=… on 2026-09-01. These are the six
// items the three draft offers reference.
const ITEMS: Record<string, Record<Locale, Record<string, unknown>>> = {
  americano: {
    "es-CL": { id: "americano", name: "Americano", price_clp: 2400, available: true, meta: "240 ml" },
    en: { id: "americano", name: "Americano", price_clp: 2400, available: true, meta: "240 ml" },
    "pt-BR": { id: "americano", name: "Americano", price_clp: 2400, available: true, meta: "240 ml" }
  },
  cappuccino: {
    "es-CL": { id: "cappuccino", name: "Cappuccino", price_clp: 3200, available: true, meta: "180 ml" },
    en: { id: "cappuccino", name: "Cappuccino", price_clp: 3200, available: true, meta: "180 ml" },
    "pt-BR": { id: "cappuccino", name: "Cappuccino", price_clp: 3200, available: true, meta: "180 ml" }
  },
  latte: {
    "es-CL": { id: "latte", name: "Latte", price_clp: 3400, available: true, meta: "240 ml" },
    en: { id: "latte", name: "Latte", price_clp: 3400, available: true, meta: "240 ml" },
    "pt-BR": { id: "latte", name: "Latte", price_clp: 3400, available: true, meta: "240 ml" }
  },
  "coffee-flight": {
    "es-CL": { id: "coffee-flight", name: "Coffee Flight", price_clp: 6590, available: true, meta: "3 × 90 ml" },
    en: { id: "coffee-flight", name: "Coffee Flight", price_clp: 6590, available: true, meta: "3 × 90 ml" },
    "pt-BR": { id: "coffee-flight", name: "Coffee Flight", price_clp: 6590, available: true, meta: "3 × 90 ml" }
  },
  clasico: {
    "es-CL": { id: "clasico", name: "Clásico", price_clp: 7200, available: true, meta: "Vegetariano · opt." },
    en: { id: "clasico", name: "Classic", price_clp: 7200, available: true, meta: "Vegetarian · opt." },
    "pt-BR": { id: "clasico", name: "Clássico", price_clp: 7200, available: true, meta: "Vegetariano · opc." }
  },
  "pie-limon": {
    "es-CL": { id: "pie-limon", name: "Pie de Limón", price_clp: 3200, available: true, meta: "Precio fijo" },
    en: { id: "pie-limon", name: "Lemon Pie", price_clp: 3200, available: true, meta: "Fixed price" },
    "pt-BR": { id: "pie-limon", name: "Torta de Limão", price_clp: 3200, available: true, meta: "Preço fixo" }
  }
};

type AdminOffer = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  variants?: AdminVariant[];
  service_windows?: AdminWindow[];
  translations?: Record<string, { title: string; description: string }>;
};
type AdminVariant = {
  id: string;
  label: string;
  price_clp: number;
  sort_order: number;
  components?: AdminComponent[];
  translations?: Record<string, { label: string }>;
};
type AdminComponent = {
  id: string;
  menu_item_id?: string;
  display_label?: string;
  quantity: number;
  sort_order: number;
  translations?: Record<string, { display_label: string }>;
};
type AdminWindow = {
  id: string;
  weekdays: string[];
  start_time: string;
  end_time?: string;
  sort_order: number;
};

function toPublic(admin: AdminOffer, locale: Locale) {
  const text = locale === "es-CL" ? undefined : admin.translations?.[locale];
  const offer: Record<string, unknown> = {
    id: admin.id,
    title: text?.title ?? admin.title,
    description: text?.description ?? admin.description
  };
  if (admin.image_url) offer.image_url = admin.image_url;

  const variants = [...(admin.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  if (variants.length) {
    offer.variants = variants.map((variant) => {
      const label =
        (locale === "es-CL" ? undefined : variant.translations?.[locale]?.label) ?? variant.label;
      const components = [...(variant.components ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((component) => {
          const out: Record<string, unknown> = {
            id: component.id,
            quantity: component.quantity
          };
          const menuItemId = component.menu_item_id?.trim();
          if (menuItemId) {
            const item = ITEMS[menuItemId]?.[locale];
            // Backend drops components whose menu_item_id it cannot resolve.
            if (!item) return [];
            out.item = item;
          } else {
            // display_label is translated only when there is no menu_item_id.
            const translated = component.translations?.[locale]?.display_label;
            const display = (locale === "es-CL" ? undefined : translated) ?? component.display_label;
            if (display) out.display_label = display;
          }
          return [out];
        });
      const result: Record<string, unknown> = { id: variant.id, label, price_clp: variant.price_clp };
      if (components.length) result.components = components;
      return result;
    });
  }

  const windows = [...(admin.service_windows ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  if (windows.length) {
    offer.service_windows = windows.map((window) => {
      const out: Record<string, unknown> = {
        id: window.id,
        weekdays: window.weekdays,
        start_time: window.start_time
      };
      if (window.end_time) out.end_time = window.end_time;
      return out;
    });
  }
  return offer;
}

const SOURCES = ["oficina-deriva", "once-en-compania", "ruta-de-origen-para-dos"];

for (const locale of LOCALES) {
  const offers = SOURCES.map((name) => {
    const admin = JSON.parse(readFileSync(`${EXAMPLES}/${name}.json`, "utf8")) as AdminOffer;
    return toPublic(admin, locale);
  });
  const path = `${OUT}/public-menu-offers.${locale}.draft.json`;
  writeFileSync(path, `${JSON.stringify(offers, null, 2)}\n`);
  console.log(`wrote ${path} (${offers.length} offers)`);
}
