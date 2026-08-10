import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/server";
import { selectLandingCoffeeHighlights } from "../../src/seo/landing-coffee-highlights";

function publicMenu(items: Array<{
  id: string;
  name: string;
  description: string;
  price_clp?: number;
  price_label?: string;
  available: boolean;
}>): PublicMenuView {
  return {
    name: "Carta Deriva Coffee Studio",
    season: "Invierno 2026",
    closed_today: false,
    current_schedule: "weekday",
    closed_label: "",
    sections: [
      {
        id: "cafeteria",
        title: "Cafetería",
        lede: "Café de especialidad.",
        items: [],
        subgroups: [{ id: "espresso", items }]
      }
    ]
  } as unknown as PublicMenuView;
}

const visibleItems = [
  {
    id: "espresso",
    name: "Espresso",
    description: "Espresso de la casa.",
    price_clp: 2000,
    available: true
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso y leche texturizada.",
    price_label: "$3.200",
    available: true
  },
  {
    id: "pourover",
    name: "Pour Over",
    description: "Preparación manual en V60 o Chemex.",
    price_clp: 4290,
    available: true
  },
  {
    id: "coffee-flight",
    name: "Coffee Flight",
    description: "Tres lecturas del café de barra.",
    price_clp: 6590,
    available: true
  },
  {
    id: "decaf-filter",
    name: "Espresso Tropical",
    description: "Maracuyá, tónica y espresso Etiopía.",
    price_clp: 5190,
    available: true
  },
  {
    id: "bolsa-de-cafe-250-g",
    name: "Bolsa de Café 250 g",
    description: "Café de especialidad para llevar.",
    price_clp: 11500,
    available: true
  },
  {
    id: "tiramisu",
    name: "Tiramisú",
    description: "Producto fuera del foco público.",
    price_clp: 7000,
    available: true
  }
];

test("selects current public coffee highlights in a stable order", () => {
  const chips = selectLandingCoffeeHighlights(publicMenu(visibleItems));

  assert.deepEqual(
    chips.map((chip) => chip.slug),
    [
      "espresso",
      "cappuccino",
      "pourover",
      "coffee-flight",
      "decaf-filter",
      "bolsa-de-cafe-250-g"
    ]
  );
  assert.deepEqual(
    chips.map((chip) => chip.price),
    ["$2.000", "$3.200", "$4.290", "$6.590", "$5.190", "$11.500"]
  );
  assert.equal(chips.some((chip) => chip.name === "Tiramisú"), false);
});

test("omits missing and unavailable configured items instead of inventing fallbacks", () => {
  const menu = publicMenu([
    visibleItems[0],
    { ...visibleItems[1], available: false },
    visibleItems[2]
  ]);

  assert.deepEqual(
    selectLandingCoffeeHighlights(menu).map((chip) => chip.slug),
    ["espresso", "pourover"]
  );
});

test("the homepage reads public menu highlights and has no stale card prices", () => {
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");
  const scroller = readFileSync(
    "src/components/landing/CartaScroller.tsx",
    "utf8"
  );

  assert.match(homepage, /getPublicMenuView/);
  assert.match(homepage, /selectLandingCoffeeHighlights/);
  assert.match(homepage, /cafetería de especialidad en Providencia, Santiago/i);
  assert.doesNotMatch(homepage, /\$3\.900|\$5\.200|Tostada Italiana|Kasler House/);
  assert.match(scroller, /seasonLabel/);
  assert.doesNotMatch(scroller, /Otoño 2026/);
});
