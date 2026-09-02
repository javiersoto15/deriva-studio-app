import type { Locale } from "../../../../src/i18n/locale";

// UI chrome for the offers plate. Backend copy (offer titles, descriptions,
// variant labels, item names) is always rendered verbatim — this file holds
// only the frame around it.
//
// Why a local dictionary rather than next-intl: the landing route group has no
// NextIntlClientProvider, and CartaBody already receives `locale` as a prop and
// keeps its own LANG_LABELS map. Following that existing pattern instead of
// standing up a provider for eleven strings.
//
// Copy rules: Chilean tuteo (never voseo), "Deriva" is a noun and never a verb,
// and nothing here may name a specific food — the same plate wraps the beer
// combos in Cervezas & Cócteles as the coffee ones in Cafetería.

type OfferCopy = {
  /** Masthead kicker, matches the long-standing section label. */
  label: string;
  /** Display line on the plate. Deliberately count-free; the badge holds the number. */
  title: string;
  /** One generic line. Must stay true for any kind of offer. */
  lede: string;
  expand: (count: number) => string;
  collapse: string;
  /** Shared inclusions heading, shown only when variants genuinely share components. */
  includes: string;
  /** Tariff heading above the priced variant rows. */
  rates: string;
  /** Explains a controlled selection (a display_label component). */
  footnote: string;
  soldOut: string;
  optionsLabel: string;
};

export const OFFER_COPY: Record<Locale, OfferCopy> = {
  es: {
    label: "Combos & ofertas",
    title: "Para armar la mesa",
    lede: "Combinaciones para compartir, con su propio precio.",
    expand: (count) => (count === 1 ? "Ver el combo" : `Ver los ${count} combos`),
    collapse: "Ocultar combos",
    includes: "Cada opción incluye",
    rates: "Tarifa",
    footnote: "Lo elegimos nosotros según lo que haya ese día.",
    soldOut: "Agotado",
    optionsLabel: "Combos y ofertas de la sección"
  },
  en: {
    label: "Combos & offers",
    title: "Ways to set the table",
    lede: "Set combinations to share, each at its own price.",
    expand: (count) => (count === 1 ? "See the combo" : `See all ${count} combos`),
    collapse: "Hide combos",
    includes: "Every option includes",
    rates: "Rates",
    footnote: "We choose it based on what came out of the oven that day.",
    soldOut: "Sold out",
    optionsLabel: "Combos and offers in this section"
  },
  "pt-BR": {
    label: "Combos & ofertas",
    title: "Para montar a mesa",
    lede: "Combinações para compartilhar, cada uma com seu preço.",
    expand: (count) => (count === 1 ? "Ver o combo" : `Ver os ${count} combos`),
    collapse: "Ocultar combos",
    includes: "Cada opção inclui",
    rates: "Tarifas",
    footnote: "Nós escolhemos conforme o que houver no dia.",
    soldOut: "Esgotado",
    optionsLabel: "Combos e ofertas da seção"
  }
};

export function offerCopy(locale: Locale): OfferCopy {
  return OFFER_COPY[locale] ?? OFFER_COPY.es;
}
