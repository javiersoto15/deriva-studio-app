import type { PublicMenuItem, PublicMenuView } from "../../../../src/api/server";
import type { Locale } from "../../../../src/i18n/locale";

// "Recomendados de la barra" — first-visitor photo grid between the masthead and
// the chip nav (Paper alt B; founder rule: every route carries a photo). Decision layer only (CartaBody imports a CSS module, which node:test
// can't load), covered by tests/menu/start-here.test.ts.
//
// The backend owns route membership, order, intent label, reason and status per
// schedule + locale. This file only joins each route to the real item (name,
// price, photo, availability) and picks where the link lands. It never decides
// which items are featured — see the menu rendering contract.

// Draft contract (docs/superpowers/specs/2026-09-28-start-here-design.md).
// Local until the backend ships `start_here` and `npm run api:types` picks it
// up — then delete this type and import the generated one.
export type PublicMenuStartHereRoute = {
  id: string;
  intent_label: string;
  reason: string;
  item_id: string;
  section_id: string;
  status?: "available" | "later" | "unavailable";
  /** Only for exceptions ("Hasta las 12:00", "Desde las 17:00") — omit for plain availability. */
  status_label?: string;
};

type MenuWithStartHere = PublicMenuView & { start_here?: PublicMenuStartHereRoute[] };

export type StartHereStatus = NonNullable<PublicMenuStartHereRoute["status"]>;

export type ResolvedStartHereRoute = {
  id: string;
  intentLabel: string;
  reason: string;
  item: PublicMenuItem;
  photo: string;
  href: string;
  status: StartHereStatus;
  statusLabel?: string;
};

export const START_HERE_MAX = 4;

// Anchor id shared by every rendering of an item (row, photo card, autor card).
export function itemAnchorId(itemId: string): string {
  return `item-${itemId}`;
}

function indexItems(menu: PublicMenuView): Map<string, PublicMenuItem> {
  const byId = new Map<string, PublicMenuItem>();
  for (const section of menu.sections) {
    for (const item of section.items ?? []) byId.set(item.id, item);
    for (const sg of section.subgroups ?? []) {
      for (const item of sg.items ?? []) byId.set(item.id, item);
    }
  }
  return byId;
}

export function resolveStartHere(menu: PublicMenuView): ResolvedStartHereRoute[] {
  const routes = (menu as MenuWithStartHere).start_here ?? [];
  if (routes.length === 0) return [];

  const items = indexItems(menu);
  const resolved: ResolvedStartHereRoute[] = [];

  for (const route of routes) {
    if (resolved.length === START_HERE_MAX) break;
    // Item absent from this payload = excluded by the schedule. Drop the route
    // rather than link into nothing.
    const item = items.get(route.item_id);
    if (!item) continue;
    // Every card is a photo card. No photo = not featurable yet; drop it rather
    // than render an empty frame.
    const photo = item.image_url;
    if (!photo) continue;

    // The item's own sold-out flag is fresher than a cached route status, so it
    // wins — and the route's (now stale) label is dropped; the chrome's
    // "Agotado hoy" stands in.
    const soldOut = item.available === false;
    resolved.push({
      id: route.id,
      intentLabel: route.intent_label,
      reason: route.reason,
      item,
      photo,
      href: `#${itemAnchorId(item.id)}`,
      status: soldOut ? "unavailable" : route.status ?? "available",
      statusLabel: soldOut ? undefined : route.status_label
    });
  }

  return resolved;
}

// UI chrome only — intent labels, reasons, item names and status labels come
// from the backend verbatim. Local dictionary for the same reason as
// offer-copy.ts (no NextIntlClientProvider in the landing group). Count-free on
// purpose: the backend may send fewer than four routes.
type StartHereCopy = {
  kicker: string;
  title: string;
  lede: string;
  /** Shown for a sold-out item; plain availability shows nothing. */
  unavailable: string;
  live: string;
  toMenu: string;
};

export const START_HERE_COPY: Record<Locale, StartHereCopy> = {
  es: {
    kicker: "§ Primera visita",
    title: "Recomendados de la barra",
    lede: "Cambian con cada servicio.",
    unavailable: "Agotado hoy",
    live: "Precios y disponibilidad en vivo",
    toMenu: "Toda la carta"
  },
  en: {
    kicker: "§ First visit",
    title: "Recommended by the bar",
    lede: "They change with every service.",
    unavailable: "Sold out today",
    live: "Live prices and availability",
    toMenu: "Full menu"
  },
  "pt-BR": {
    kicker: "§ Primeira visita",
    title: "Recomendados da barra",
    lede: "Mudam a cada serviço.",
    unavailable: "Esgotado hoje",
    live: "Preços e disponibilidade ao vivo",
    toMenu: "Todo o cardápio"
  }
};
