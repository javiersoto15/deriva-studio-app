import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ItemPriceRow,
  OriginPriceList,
  groupByTier,
  hasMultipleOriginPrices,
  itemPriceLabel,
  renderableOrigins,
  type PricedOrigin
} from "../../app/(companion)/carta/[id]/_components/OriginPriceList";

// Backend-shaped fixture. Every value here stands in for a `GET /menu/items/{id}`
// response — the point of these tests is that the frontend renders it verbatim
// and derives nothing. The literal prices live ONLY in this fixture; the
// "no hardcoded prices" test below enforces that they never leak into app code.
const POUR_OVER_PRICE_CLP = 3990;

const origins: PricedOrigin[] = [
  {
    id: "orig_house_blend_dach",
    name: "House Blend · DACH",
    display_name: "House Blend",
    price_clp: 3990,
    tier: "regular",
    tier_label: "Regular",
    default: true,
    available: true
  },
  {
    id: "orig_ethiopia_yirgacheffe",
    name: "Etiopía Yirgacheffe",
    display_name: "Etiopía Yirgacheffe",
    price_clp: 3990,
    tier: "regular",
    tier_label: "Regular",
    available: true
  },
  {
    id: "orig_colibri_colombia_cenicafe",
    name: "Colibrí Colombia Cenicafé",
    display_name: "Colibrí Colombia",
    price_clp: 4890,
    tier: "premium",
    tier_label: "Premium",
    available: true
  },
  {
    id: "orig_504_tasty_roast",
    name: "504 Tasty Roast",
    display_name: "504 Tasty Roast",
    price_clp: 4890,
    tier: "premium",
    tier_label: "Premium",
    available: true
  },
  {
    id: "orig_sold_out",
    name: "Agotado Natural",
    display_name: "Agotado Natural",
    price_clp: 4890,
    tier: "premium",
    tier_label: "Premium",
    available: false
  }
];

const messages = {
  "es-CL": JSON.parse(readFileSync("src/i18n/messages/es.json", "utf8")).menu,
  en: JSON.parse(readFileSync("src/i18n/messages/en.json", "utf8")).menu,
  "pt-BR": JSON.parse(readFileSync("src/i18n/messages/pt-BR.json", "utf8")).menu
};

function renderList(props: Partial<React.ComponentProps<typeof OriginPriceList>> = {}) {
  return renderToStaticMarkup(
    <OriginPriceList
      origins={origins}
      label={messages["es-CL"].origins}
      defaultMarker={messages["es-CL"].default_origin}
      {...props}
    />
  );
}

// 1 — the main price is the backend price_clp, not a computed minimum.
test("main item price comes from data.price_clp", () => {
  const html = renderToStaticMarkup(
    <ItemPriceRow
      priceClp={POUR_OVER_PRICE_CLP}
      origins={origins}
      label={messages["es-CL"].price}
      fromPrefix={messages["es-CL"].price_from}
    />
  );
  assert.match(html, /Desde \$ 3\.990/);
  assert.equal(itemPriceLabel(POUR_OVER_PRICE_CLP, origins, "Desde"), "Desde $ 3.990");
});

// 2 — the render follows the backend fixture, so changing it changes the output.
test("changing the backend fixture price changes the rendered price", () => {
  const html = renderToStaticMarkup(
    <ItemPriceRow
      priceClp={4290}
      origins={origins}
      label={messages["es-CL"].price}
      fromPrefix={messages["es-CL"].price_from}
    />
  );
  assert.match(html, /Desde \$ 4\.290/);
  assert.doesNotMatch(html, /3\.990/);
});

// 3 — every origin row prints its own backend price, never a tier-derived one.
test("each origin displays its own backend price", () => {
  const html = renderList();
  for (const origin of renderableOrigins(origins)) {
    const formatted = `$ ${(origin.price_clp as number).toLocaleString("es-CL")}`;
    assert.ok(html.includes(formatted), `expected ${origin.id} price ${formatted}`);
  }
  // Two different prices inside the same "Premium" tier would still both render.
  const mixedTier: PricedOrigin[] = [
    { id: "a", name: "A", price_clp: 4890, tier: "premium", tier_label: "Premium", available: true },
    { id: "b", name: "B", price_clp: 5490, tier: "premium", tier_label: "Premium", available: true }
  ];
  const mixedHtml = renderList({ origins: mixedTier });
  assert.match(mixedHtml, /\$ 4\.890/);
  assert.match(mixedHtml, /\$ 5\.490/);
});

// 4 — no production frontend file may carry the origin prices as literals.
test("no production frontend file hardcodes 3990 or 4890", () => {
  const roots = ["app", "src"];
  const offenders: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next") continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      const source = readFileSync(full, "utf8");
      if (/\b(3990|4890)\b/.test(source)) offenders.push(full);
    }
  }

  roots.forEach(walk);
  assert.deepEqual(offenders, []);
});

// 5 — grouping keys off the backend `tier`, headings off the backend `tier_label`.
test("available origins are grouped using backend tier data", () => {
  const groups = groupByTier(renderableOrigins(origins));
  assert.deepEqual(
    groups.map((g) => [g.tier, g.tierLabel, g.origins.length]),
    [
      ["regular", "Regular", 2],
      ["premium", "Premium", 2]
    ]
  );

  const html = renderList();
  assert.match(html, />Regular</);
  assert.match(html, />Premium</);

  // Renaming the tier label on the backend renames the visible heading.
  const renamed = renderList({
    origins: origins.map((o) => ({ ...o, tier_label: `${o.tier_label} bar` }))
  });
  assert.match(renamed, />Regular bar</);
  assert.match(renamed, />Premium bar</);
});

// 6 — backend ordering is preserved, both across tiers and inside them.
test("backend order is preserved", () => {
  const html = renderList();
  const order = ["House Blend", "Etiopía Yirgacheffe", "Colibrí Colombia", "504 Tasty Roast"];
  const positions = order.map((name) => html.indexOf(name));
  assert.ok(positions.every((p) => p >= 0), "all origins rendered");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));

  // Premium-first from the backend must render premium-first.
  const flipped = groupByTier(renderableOrigins([...origins].reverse()));
  assert.deepEqual(flipped.map((g) => g.tier), ["premium", "regular"]);
});

// 7 — unavailable origins never reach the DOM.
test("unavailable origins are hidden", () => {
  const html = renderList();
  assert.doesNotMatch(html, /Agotado Natural/);
  assert.equal(renderableOrigins(origins).length, 4);

  // An origin with no price is dropped too, rather than getting an invented one.
  const unpriced: PricedOrigin[] = [
    { id: "x", name: "Sin precio", tier: "regular", tier_label: "Regular", available: true }
  ];
  assert.equal(renderableOrigins(unpriced).length, 0);
  assert.equal(renderList({ origins: unpriced }), "");
});

// 8 — the backend default origin gets the localized marker.
test("the default origin receives the localized marker", () => {
  const es = renderList();
  assert.ok(es.includes(messages["es-CL"].default_origin));
  const markerIndex = es.indexOf(messages["es-CL"].default_origin);
  const houseIndex = es.indexOf("House Blend");
  const nextRow = es.indexOf("Etiopía Yirgacheffe");
  assert.ok(houseIndex < markerIndex && markerIndex < nextRow, "marker sits on the default row");

  const en = renderList({ defaultMarker: messages.en.default_origin });
  assert.ok(en.includes(messages.en.default_origin));
  assert.equal((en.match(new RegExp(messages.en.default_origin, "g")) ?? []).length, 1);
});

// 9 — informational view, not a configurator.
test("no radio or checkbox controls are rendered", () => {
  const html = renderList();
  assert.doesNotMatch(html, /<input/);
  assert.doesNotMatch(html, /type="(radio|checkbox)"/);
  assert.doesNotMatch(html, /role="(radio|radiogroup|checkbox)"/);
  assert.doesNotMatch(html, /<button/);
});

// 10 — items without origin options keep the plain single-price layout.
test("missing origin options retain the ordinary item layout", () => {
  assert.equal(renderList({ origins: [] }), "");
  assert.equal(renderList({ origins: undefined }), "");
  assert.equal(hasMultipleOriginPrices([]), false);

  const html = renderToStaticMarkup(
    <ItemPriceRow
      priceClp={3400}
      label={messages["es-CL"].price}
      fromPrefix={messages["es-CL"].price_from}
    />
  );
  assert.match(html, /\$ 3\.400/);
  assert.doesNotMatch(html, /Desde/);

  // No backend price at all → no fabricated fallback.
  const empty = renderToStaticMarkup(
    <ItemPriceRow priceClp={undefined} label={messages["es-CL"].price} />
  );
  assert.doesNotMatch(empty, /\$/);
  assert.equal(itemPriceLabel(undefined, origins, "Desde"), null);
});

// 11 — the starting-price prefix is localized in all three supported locales.
test("Spanish, English and Portuguese starting-price labels work", () => {
  const expected: Record<string, string> = {
    "es-CL": "Desde",
    en: "From",
    "pt-BR": "A partir de"
  };
  for (const [locale, prefix] of Object.entries(expected)) {
    assert.equal(messages[locale as keyof typeof messages].price_from, prefix);
    assert.equal(
      itemPriceLabel(POUR_OVER_PRICE_CLP, origins, prefix),
      `${prefix} $ 3.990`
    );
    // Origins section label + default marker are localized too.
    assert.ok(messages[locale as keyof typeof messages].origins);
    assert.ok(messages[locale as keyof typeof messages].default_origin);
  }
});

// 12 — long origin names wrap; prices stay right-aligned on a 320px viewport.
test("long origin names do not break the mobile layout", () => {
  const long: PricedOrigin[] = [
    {
      id: "orig_long",
      name: "Finca La Esperanza Microlote Geisha Lavado Proceso Experimental Extendido",
      display_name: "Finca La Esperanza Microlote Geisha Lavado Proceso Experimental Extendido",
      price_clp: 4890,
      tier: "premium",
      tier_label: "Premium",
      available: true
    }
  ];
  const html = renderList({ origins: long });

  assert.match(html, /overflow-wrap:anywhere/);
  assert.match(html, /min-width:0/);
  assert.match(html, /white-space:nowrap/);
  assert.match(html, /flex-shrink:0/);
  assert.match(html, /justify-content:space-between/);
  // The price must not be inside the wrapping name span.
  const priceIndex = html.indexOf("$ 4.890");
  const nameEnd = html.indexOf("</span>", html.indexOf("Finca La Esperanza"));
  assert.ok(nameEnd < priceIndex, "price lives in its own non-wrapping span");
});

// 13 — the real production payload, captured from GET /menu/items/pourover,
// renders end to end. This is a regression net against the live contract: if the
// backend changes shape, refresh the fixture and this test tells you what moved.
test("the live backend payload renders the full origin list", () => {
  const live = JSON.parse(readFileSync("tests/menu/fixtures/pourover.live.json", "utf8"));
  const options: PricedOrigin[] = live.origin_options;

  // The backend, not the frontend, decides there are two tiers and which is first.
  assert.deepEqual(
    groupByTier(renderableOrigins(options)).map((g) => [g.tierLabel, g.origins.length]),
    [
      ["Regular", 3],
      ["Premium", 2]
    ]
  );

  const priceRow = renderToStaticMarkup(
    <ItemPriceRow
      priceClp={live.price_clp}
      origins={options}
      label={messages["es-CL"].price}
      fromPrefix={messages["es-CL"].price_from}
    />
  );
  // price_clp is 3990 in the fixture and 3990 is what renders — no derivation.
  assert.ok(priceRow.includes(`$ ${live.price_clp.toLocaleString("es-CL")}`));
  assert.match(priceRow, /Desde/);

  const listHtml = renderList({ origins: options });
  for (const origin of options) {
    assert.ok(
      listHtml.includes(origin.display_name ?? (origin.name as string)),
      `missing origin ${origin.id}`
    );
    assert.ok(
      listHtml.includes(`$ ${(origin.price_clp as number).toLocaleString("es-CL")}`),
      `missing price for ${origin.id}`
    );
  }
  // Exactly one default origin carries the marker.
  assert.equal(options.filter((o: PricedOrigin) => o.default === true).length, 1);
  assert.equal(
    (listHtml.match(new RegExp(messages["es-CL"].default_origin, "g")) ?? []).length,
    1
  );
});
