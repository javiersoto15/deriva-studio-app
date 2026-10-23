import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { PublicMenuView } from "../../src/api/server";

const require = createRequire(__filename);
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = (module) => {
  module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_target, name) => String(name) })
  };
};

const { CartaBody } = require("../../app/(landing)/menu/_components/CartaBody.tsx") as {
  CartaBody: typeof import("../../app/(landing)/menu/_components/CartaBody").CartaBody;
};

const menu = {
  name: "Carta Deriva Coffee Studio",
  season: "Temporada",
  current_schedule: "weekday",
  closed_today: false,
  sections: [
    {
      id: "cafeteria",
      numeral: "01",
      title: "Cafetería",
      emphasis: "hero",
      lede: "Café",
      subgroups: [
        {
          id: "cafes-autor",
          label: "Café de autor",
          items: [
            { id: "decaf-filter", name: "Decaf Filter", author: "Maria", description: "", available: true },
            { id: "bosque-valdiviano", name: "Bosque Valdiviano", author: "Maria", description: "", available: true },
            { id: "latte-citrus-bloom", name: "Latte Citrus Bloom", author: "Maria", description: "", available: true },
            { id: "capuccino-mediterraneo", name: "Capuccino Mediterráneo", author: "Benja", description: "", available: true },
            { id: "new-coffee-1", name: "Nuevo café 1", description: "", available: true },
            { id: "new-coffee-2", name: "Nuevo café 2", author: null, description: "", available: true },
            { id: "new-coffee-3", name: "Nuevo café 3", author: "  ", description: "", available: true },
            { id: "new-coffee-4", name: "Nuevo café 4", description: "", available: true }
          ]
        }
      ]
    }
  ]
} as unknown as PublicMenuView;

test("CartaBody renders known author credits and omits blank new authors", () => {
  const html = renderToStaticMarkup(
    React.createElement(CartaBody, { menu, locale: "es", showPrices: true })
  );
  const cards = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(([card]) => card);

  assert.equal(cards.length, 8);
  for (const cardIndex of [0, 1, 2]) assert.match(cards[cardIndex], />Por Maria<\/span>/);
  assert.match(cards[3], />Por Benja<\/span>/);
  for (const card of cards.slice(4)) {
    assert.doesNotMatch(card, />Por (?:Maria|Benja)<\/span>/);
    assert.doesNotMatch(card, /autorCardAuthor/);
  }
});
