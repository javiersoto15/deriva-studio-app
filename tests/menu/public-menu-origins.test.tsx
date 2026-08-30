import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  groupByTier,
  originName,
  renderableOrigins,
  type PricedOrigin
} from "../../src/api/origin-pricing";

// The public carta (/menu) now lists each bean and its price under the item, so
// a customer choosing a coffee at the table never has to open a detail page.
// CartaBody imports a CSS module, which node:test can't load — so these tests
// cover the shared decision layer that drives the row, against the real
// GET /public/menu payload. The visual result is verified in Paper.

const item = JSON.parse(
  readFileSync("tests/menu/fixtures/public-menu-item.live.json", "utf8")
);
const options: PricedOrigin[] = item.origin_options;

test("the public row keeps a single headline price from the backend", () => {
  // price_label wins; the frontend never composes "Desde" for this surface.
  assert.equal(item.price_label, "Desde $3.990");
  assert.equal(item.price_clp, 3990);
});

test("every available bean is listed with its own backend price", () => {
  const shown = renderableOrigins(options);
  assert.equal(shown.length, 5);
  assert.deepEqual(
    shown.map((o) => [originName(o), o.price_clp]),
    [
      ["Etiopia Yirgacheffe", 3990],
      ["House Blend", 3990],
      ["Mexico Descafeinado", 3990],
      ["Colibri Colombia Cenicafe", 4890],
      ["504 Tasty Roast", 4890]
    ]
  );
});

test("beans are grouped by backend tier, in backend order", () => {
  assert.deepEqual(
    groupByTier(renderableOrigins(options)).map((g) => [g.tierLabel, g.origins.length]),
    [
      ["Regular", 3],
      ["Premium", 2]
    ]
  );
});

test("an unavailable or unpriced bean drops out of the public list", () => {
  const withGaps: PricedOrigin[] = [
    ...options,
    { id: "sold_out", name: "Agotado", price_clp: 4890, tier: "premium", available: false },
    { id: "unpriced", name: "Sin precio", tier: "regular", available: true }
  ];
  const shown = renderableOrigins(withGaps);
  assert.equal(shown.length, 5);
  assert.ok(!shown.some((o) => o.id === "sold_out" || o.id === "unpriced"));
});

test("an item without origin_options renders no origin lines", () => {
  assert.equal(renderableOrigins(undefined).length, 0);
  assert.equal(renderableOrigins([]).length, 0);
  assert.deepEqual(groupByTier([]), []);
});
