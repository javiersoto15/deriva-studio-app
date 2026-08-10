import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/server";
import { buildMenuGraph } from "../../src/seo/menu-schema";

const menu = {
  locale: "es-CL",
  name: "Carta Deriva Coffee Studio",
  season: "Invierno 2026",
  current_schedule: "weekday",
  closed_today: false,
  sections: [
    {
      id: "cafeteria",
      numeral: "I",
      title: "Cafetería",
      emphasis: "primary",
      lede: "Café de especialidad.",
      items: [],
      subgroups: [
        {
          id: "espresso",
          items: [
            {
              id: "espresso",
              name: "Espresso",
              description: "Espresso de la casa.",
              price_clp: 2000,
              available: true
            },
            {
              id: "cafe-temporal",
              name: "Café temporal",
              description: "No disponible hoy.",
              price_clp: 3000,
              available: false
            }
          ]
        }
      ]
    }
  ]
} as unknown as PublicMenuView;

test("links the menu page, cafe, website, sections, and items", () => {
  const graph = buildMenuGraph(menu, true);
  const serialized = JSON.stringify(graph);

  assert.equal(graph["@context"], "https://schema.org");
  assert.match(serialized, /https:\/\/derivastudio\.cl\/#cafe/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/#website/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/menu#webpage/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/menu#menu/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/menu#section-cafeteria/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/menu#item-espresso/);
});

test("marks public prices and availability without introducing hidden products", () => {
  const serialized = JSON.stringify(buildMenuGraph(menu, true));

  assert.match(serialized, /"price":2000/);
  assert.match(serialized, /schema\.org\/InStock/);
  assert.match(serialized, /schema\.org\/OutOfStock/);
  assert.doesNotMatch(
    serialized,
    /Masa Madre Duo|Brochetas Mixtas|Sobrecostilla Braseada|Tiramisú/
  );
});

test("omits offers when prices are not visible", () => {
  const serialized = JSON.stringify(buildMenuGraph(menu, false));
  assert.doesNotMatch(serialized, /"@type":"Offer"/);
});

test("the public menu page uses the linked graph and broad local Spanish metadata", () => {
  const source = readFileSync("app/(landing)/menu/page.tsx", "utf8");

  assert.match(source, /buildMenuGraph/);
  assert.match(source, /Carta de café de especialidad en Providencia/);
  assert.match(source, /desayunos?/i);
  assert.match(source, /brunch/i);
  assert.match(source, /almuerzos?/i);
  assert.match(source, /Menú Ejecutivo/);
  assert.match(source, /onces/i);
  assert.match(source, /pastelería/i);
  assert.match(source, /alternates:\s*\{\s*canonical:\s*MENU_URL\s*\}/);
  assert.doesNotMatch(source, /function buildMenuJsonLd|function menuItemJsonLd/);
  assert.doesNotMatch(
    source,
    /Masa Madre Duo|Brochetas Mixtas|Sobrecostilla Braseada|Tiramisú/
  );
});
