import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { PublicMenuView } from "../../src/api/hooks";
import type { PublicMenuOffer } from "../../src/api/offer-variants";
import { MenuOfferCard, type MenuOfferCardLabels } from "../../app/(companion)/carta/_components/MenuOfferCard";
import { TodayMenuPanels, type TodayMenuLabels } from "../../app/(companion)/hoy/_components/TodayMenuPanels";

const offerLabels: MenuOfferCardLabels = {
  offer: "Oferta",
  includes: "Cada opción incluye",
  rates: "Tarifa",
  soldOut: "Agotado",
  included: "Incluido",
  fixedPrice: "Precio promo",
  supplement: "suplemento",
  controlledSelection: "La selección se define ese día."
};

const todayLabels: TodayMenuLabels = {
  promotions: "Promociones en carta",
  promotionsEmpty: "Hoy no hay promociones disponibles.",
  authorCoffee: "Café de autor",
  authorCoffeeItem: "Café de autor",
  authorEmpty: "Hoy no hay cafés de autor disponibles.",
  previousPromotion: "Promoción anterior",
  nextPromotion: "Siguiente promoción",
  previousCoffee: "Café anterior",
  nextCoffee: "Siguiente café",
  viewMenu: "Ver carta",
  position: "{current} de {total}",
  authorBy: "Creación de"
};

const window = {
  id: "morning",
  weekdays: ["friday", "saturday"] as const,
  start_time: "08:00",
  end_time: "12:00"
};

test("offer card renders backend variant price and service window without calculating a price", () => {
  const offer = {
    id: "offer-variants",
    title: "Ruta de Origen para Dos",
    description: "Una pausa para compartir.",
    service_windows: [window],
    variants: [
      {
        id: "route-for-two",
        label: "Para dos",
        price_clp: 15200,
        components: [
          { id: "flight", quantity: 2, item: { id: "coffee-flight", name: "Coffee Flight", available: true } }
        ]
      }
    ]
  } as unknown as PublicMenuOffer;

  const html = renderToStaticMarkup(
    createElement(MenuOfferCard, { offer, locale: "es", labels: offerLabels })
  );
  assert.match(html, /\$15\.200/);
  assert.match(html, /Vie y Sáb · 08:00–12:00/);
  assert.match(html, /Coffee Flight/);
  assert.doesNotMatch(html, /15\.200.*\+|\+.*15\.200/);
});

test("Today panels render the selected current offer and author item from the menu payload", () => {
  const menu = {
    locale: "es-CL",
    name: "Carta",
    season: "Actual",
    current_schedule: "weekday",
    closed_today: false,
    sections: [
      {
        id: "cafeteria",
        title: "Cafetería",
        numeral: "01",
        emphasis: "primary",
        lede: "",
        offers: [{ id: "combo", title: "Café simple + pie", description: "Con pie del día." }],
        subgroups: [
          {
            id: "cafes-autor",
            label: "Café de autor",
            items: [{ id: "latte-citrus-bloom", name: "Latte Citrus Bloom", description: "Café de autor", available: true, price_clp: 3990 }]
          }
        ]
      }
    ]
  } as unknown as PublicMenuView;

  const html = renderToStaticMarkup(
    createElement(TodayMenuPanels, {
      menu,
      locale: "es",
      promotionIndex: 0,
      authorIndex: 0,
      labels: todayLabels,
      offerLabels,
      onPromotionIndexChange: () => {},
      onAuthorIndexChange: () => {}
    })
  );

  assert.match(html, /Café simple \+ pie/);
  assert.match(html, /Latte Citrus Bloom/);
  assert.match(html, /\$3\.990/);
  assert.match(html, /Siguiente promoción/);
  assert.match(html, /\/carta\/latte-citrus-bloom/);
});

test("Today empty states do not insert invented offers or author coffees", () => {
  const menu = {
    locale: "es-CL",
    name: "Carta",
    season: "Actual",
    current_schedule: "weekday",
    closed_today: false,
    sections: []
  } as unknown as PublicMenuView;
  const html = renderToStaticMarkup(
    createElement(TodayMenuPanels, {
      menu,
      locale: "es",
      promotionIndex: null,
      authorIndex: null,
      labels: todayLabels,
      offerLabels,
      onPromotionIndexChange: () => {},
      onAuthorIndexChange: () => {}
    })
  );
  assert.match(html, /Hoy no hay promociones disponibles/);
  assert.match(html, /Hoy no hay cafés de autor disponibles/);
  assert.doesNotMatch(html, /House Blend|Espresso Tropical|Happy Hour/);
});
