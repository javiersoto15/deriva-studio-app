import type { components } from "./schema";
import type { Locale } from "../i18n/locale";

// Shared, surface-agnostic rules for public-menu offers that carry priced
// `variants` and informational `service_windows`.
//
// Everything priced is backend-owned: this module never derives, sums, or
// composes a price. It decides only which of the three offer shapes to render,
// resolves each variant component's label, and formats weekday/time data the
// backend sends as raw enums and "HH:MM" strings (the only fields that must be
// localized frontend-side, because the backend has no locale-aware weekday copy).
//
// The three shapes, in precedence order:
//   1. `variants` present  → tariff treatment (this module)
//   2. `detail` present    → legacy dialog     (unchanged since 2026-07)
//   3. neither             → legacy static row (unchanged since 2026-07)
//
// Precedence matters because the OpenAPI schema permits an offer to carry both
// `detail` and `variants`. Rendering both would print the inclusions twice, so
// `variants` wins and `detail` is ignored for that offer.

export type PublicMenuOffer = components["schemas"]["PublicMenuOffer"];
export type OfferVariant = components["schemas"]["PublicMenuOfferVariant"];
export type OfferVariantComponent = components["schemas"]["PublicMenuOfferVariantComponent"];
export type OfferServiceWindow = components["schemas"]["PublicMenuOfferServiceWindow"];
export type Weekday = components["schemas"]["PublicMenuWeekday"];

/** Which of the three treatments an offer gets. See precedence note above. */
export type OfferShape = "variants" | "detail" | "plain";

export function offerShape(offer: PublicMenuOffer): OfferShape {
  if (offer.variants && offer.variants.length > 0) return "variants";
  if (offer.detail) return "detail";
  return "plain";
}

/**
 * A variant component is either a real menu item (fixed: the customer gets
 * exactly this) or a display label (controlled: Deriva picks it that day).
 *
 * The generated types can't express this — the OpenAPI `oneOf` degenerated into
 * `& (unknown | unknown)` — so the discrimination lives here. `item` wins if a
 * malformed payload somehow carries both.
 */
export type ResolvedComponent =
  | { kind: "item"; id: string; quantity: number; name: string; available: boolean }
  | { kind: "selection"; id: string; quantity: number; label: string };

export function resolveComponent(
  component: OfferVariantComponent
): ResolvedComponent | null {
  const quantity = component.quantity;
  if (component.item) {
    return {
      kind: "item",
      id: component.id,
      quantity,
      name: component.item.name,
      available: component.item.available !== false
    };
  }
  const label = component.display_label?.trim();
  if (label) {
    return { kind: "selection", id: component.id, quantity, label };
  }
  // Neither side present: the backend drops components whose menu_item_id it
  // cannot resolve, so a variant can legitimately arrive with fewer components
  // than were authored. Skip rather than render an empty row.
  return null;
}

export function resolveComponents(
  components: readonly OfferVariantComponent[] = []
): ResolvedComponent[] {
  return components
    .map(resolveComponent)
    .filter((resolved): resolved is ResolvedComponent => resolved !== null);
}

function componentSignature(component: ResolvedComponent): string {
  return component.kind === "item"
    ? `item:${component.quantity}:${component.name}`
    : `selection:${component.quantity}:${component.label}`;
}

/**
 * The components every variant shares, identically — same kind, same quantity,
 * same name. These are declared once above the tariff ("Cada opción incluye")
 * so the rows below carry only what actually differs.
 *
 * This is an intersection, never a merge. Once en Compañía's three variants all
 * include ×1 Croissant Clásico and ×1 Pie de Limón, so those two surface; the
 * coffee differs per variant and stays in each row's backend-authored label.
 * Oficina Deriva shares nothing (both the coffee AND the pastry quantity move
 * with the party size), so it gets no shared block at all — its description
 * already explains the offer, and inventing a merged line like "Americano,
 * Cappuccino o Latte" would be the frontend writing menu copy.
 */
export function commonComponents(variants: readonly OfferVariant[]): ResolvedComponent[] {
  if (variants.length === 0) return [];
  const first = resolveComponents(variants[0].components);
  if (variants.length === 1) return first;
  const others = variants
    .slice(1)
    .map((variant) => new Set(resolveComponents(variant.components).map(componentSignature)));
  return first.filter((component) => {
    const signature = componentSignature(component);
    return others.every((set) => set.has(signature));
  });
}

/**
 * True when any variant includes a controlled selection — something Deriva
 * picks that day rather than the customer. Drives the "†" footnote, which is an
 * explanation of how the offer works, not a claim about its contents.
 */
export function hasControlledSelection(variants: readonly OfferVariant[]): boolean {
  return variants.some((variant) =>
    resolveComponents(variant.components).some((component) => component.kind === "selection")
  );
}

// ----- Money ---------------------------------------------------------------

/**
 * Chilean peso formatting. The VALUE always comes from the backend's
 * `price_clp`; this only puts the separators in. There is deliberately no
 * "from"/"desde" helper here — a range label is a price claim, and price claims
 * are the backend's to make (it already sends `price_label` where it wants one).
 */
export function clp(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`;
}

// ----- Service windows -----------------------------------------------------

const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const WEEKDAY_SHORT: Record<Locale, Record<Weekday, string>> = {
  es: {
    monday: "Lun",
    tuesday: "Mar",
    wednesday: "Mié",
    thursday: "Jue",
    friday: "Vie",
    saturday: "Sáb",
    sunday: "Dom"
  },
  en: {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun"
  },
  "pt-BR": {
    monday: "Seg",
    tuesday: "Ter",
    wednesday: "Qua",
    thursday: "Qui",
    friday: "Sex",
    saturday: "Sáb",
    sunday: "Dom"
  }
};

const RANGE_JOINER: Record<Locale, string> = { es: "a", en: "to", "pt-BR": "a" };
const LIST_JOINER: Record<Locale, string> = { es: "y", en: "and", "pt-BR": "e" };

function sortWeekdays(weekdays: readonly Weekday[]): Weekday[] {
  const seen = new Set(weekdays);
  return WEEKDAY_ORDER.filter((day) => seen.has(day));
}

function isContiguous(sorted: readonly Weekday[]): boolean {
  if (sorted.length < 3) return false;
  const first = WEEKDAY_ORDER.indexOf(sorted[0]);
  return sorted.every((day, index) => WEEKDAY_ORDER.indexOf(day) === first + index);
}

/**
 * "Lun a Jue" for a contiguous run of 3+, "Vie y Sáb" for a short list.
 * Purely a rendering of the weekdays the backend sent — never widened.
 */
export function formatWeekdays(weekdays: readonly Weekday[], locale: Locale): string {
  const sorted = sortWeekdays(weekdays);
  if (sorted.length === 0) return "";
  const names = WEEKDAY_SHORT[locale];
  if (isContiguous(sorted)) {
    return `${names[sorted[0]]} ${RANGE_JOINER[locale]} ${names[sorted[sorted.length - 1]]}`;
  }
  const labels = sorted.map((day) => names[day]);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} ${LIST_JOINER[locale]} ${labels[labels.length - 1]}`;
}

const OPEN_ENDED: Record<Locale, (start: string) => string> = {
  es: (start) => `desde ${start}`,
  en: (start) => `from ${start}`,
  "pt-BR": (start) => `a partir das ${start}`
};

/**
 * "08:00–12:00" when the window closes, "desde 18:30" when it doesn't.
 *
 * An absent `end_time` means the offer runs until close. We never substitute
 * the shop's closing hour: those hours vary by day and holiday, and printing a
 * concrete time we were not given would be a promise the kitchen didn't make.
 */
export function formatWindowTime(window: OfferServiceWindow, locale: Locale): string {
  if (window.end_time) return `${window.start_time}–${window.end_time}`;
  return OPEN_ENDED[locale](window.start_time);
}

/** One window as a single pill: "Lun a Jue · 08:00–12:00". */
export function formatWindow(window: OfferServiceWindow, locale: Locale): string {
  const days = formatWeekdays(window.weekdays, locale);
  const time = formatWindowTime(window, locale);
  return days ? `${days} · ${time}` : time;
}

/**
 * Compact summary for the collapsed index, where a full window list doesn't
 * fit. With one window it reads in full; with several it reports the COUNT and
 * the union of days — never a merged time, because flattening "Mon–Thu from
 * 18:30" and "Fri–Sat from 18:00" into one line would claim Monday at 18:00.
 */
export function summarizeWindows(
  windows: readonly OfferServiceWindow[] = [],
  locale: Locale
): string | null {
  if (windows.length === 0) return null;
  if (windows.length === 1) return formatWindow(windows[0], locale);
  const allDays = sortWeekdays(windows.flatMap((window) => window.weekdays));
  const count =
    locale === "en"
      ? `${windows.length} times`
      : locale === "pt-BR"
        ? `${windows.length} horários`
        : `${windows.length} horarios`;
  const days = formatWeekdays(allDays, locale);
  return days ? `${count} · ${days}` : count;
}

// ----- Section-level disclosure --------------------------------------------

/**
 * How many offers a section needs before its offers block collapses into a
 * plate. Below this the offers render open, exactly as they have since 2026-07.
 *
 * Set to 4 deliberately: production's busiest section (Cafetería) carries three
 * legacy combos today, so nothing on the live carta moves. The plate appears
 * the moment the new variant offers publish and that section reaches four —
 * which is also the point where the offers start crowding out the section's own
 * items, the problem the plate exists to solve.
 */
export const OFFERS_COLLAPSE_AT = 4;

export function offersCollapsible(offerCount: number): boolean {
  return offerCount >= OFFERS_COLLAPSE_AT;
}

/** "9 opciones" — a count, not a price. Null for a single-variant offer. */
export function summarizeVariantCount(
  variants: readonly OfferVariant[] = [],
  locale: Locale
): string | null {
  if (variants.length < 2) return null;
  if (locale === "en") return `${variants.length} options`;
  if (locale === "pt-BR") return `${variants.length} opções`;
  return `${variants.length} opciones`;
}
