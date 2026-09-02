import assert from "node:assert/strict";
import test from "node:test";

import type { ExecutiveMenu } from "../../src/api/server";
import {
  EXECUTIVE_MENU_FALLBACK_BODY,
  EXECUTIVE_MENU_FALLBACK_TITLE,
  EXECUTIVE_MENU_STABLE_HOURS,
  EXECUTIVE_MENU_URL,
  buildExecutiveMenuGraph,
  buildExecutiveMenuPresentation
} from "../../src/seo/executive-menu";

const sampleMenu: ExecutiveMenu = {
  price_clp: 10990,
  price_label: "CLP $10.990",
  hours: "13:00 - 16:00",
  hero: "Menú Ejecutivo",
  subline: "Una pausa completa para el almuerzo.",
  date_label: "Lunes 10 de agosto",
  courses: [
    {
      id: "bebida",
      numeral: "I",
      tag: "Bebida",
      name: "Una bebida"
    },
    {
      id: "entrada",
      numeral: "II",
      tag: "Entrada",
      name: "Crema de verduras"
    },
    {
      id: "fondo",
      numeral: "III",
      tag: "Fondo",
      name: "Pollo al curry con arroz al cilantro"
    },
    {
      id: "queque",
      numeral: "IV",
      tag: "Postre",
      name: "Postre del día"
    }
  ]
};

test("builds an API-backed daily Menú Ejecutivo presentation", () => {
  const result = buildExecutiveMenuPresentation(sampleMenu);

  assert.equal(result.availableToday, true);
  assert.equal(result.priceLabel, "CLP $10.990");
  assert.equal(result.priceClp, 10990);
  assert.equal(result.hours, "13:00 - 16:00");
  assert.equal(result.hero, "Menú Ejecutivo");
  assert.equal(result.subline, "Una pausa completa para el almuerzo.");
  assert.equal(result.dateLabel, "Lunes 10 de agosto");
  assert.deepEqual(
    result.courses.map((course) => course.name),
    [
      "Una bebida",
      "Crema de verduras",
      "Pollo al curry con arroz al cilantro",
      "Postre del día"
    ]
  );
});

test("returns stable service copy without inventing a daily edition", () => {
  const result = buildExecutiveMenuPresentation(null);

  assert.equal(result.availableToday, false);
  assert.equal(result.hours, "Lunes a viernes · 13:00–16:00");
  assert.equal(result.hours, EXECUTIVE_MENU_STABLE_HOURS);
  assert.equal(result.hero, EXECUTIVE_MENU_FALLBACK_TITLE);
  assert.equal(result.hero, "Menú Ejecutivo de lunes a viernes");
  assert.equal(result.subline, EXECUTIVE_MENU_FALLBACK_BODY);
  // Honest fallback: states the program and the hours, claims nothing about
  // today beyond "may not be published yet / may be over".
  assert.match(result.subline, /13:00 a 16:00/);
  assert.doesNotMatch(result.subline, /\$|CLP|disponible ahora/i);
  assert.equal(result.priceLabel, undefined);
  assert.equal(result.priceClp, undefined);
  assert.equal(result.dateLabel, undefined);
  assert.deepEqual(result.courses, []);
});

test("keeps the stable graph linked without inventing a daily offer or courses", () => {
  const graph = buildExecutiveMenuGraph(null);
  const serialized = JSON.stringify(graph);

  assert.equal(graph["@context"], "https://schema.org");
  assert.match(serialized, new RegExp(`${EXECUTIVE_MENU_URL}#webpage`));
  assert.match(serialized, new RegExp(`${EXECUTIVE_MENU_URL}#menu`));
  assert.match(serialized, /https:\/\/derivastudio\.cl\/#cafe/);
  assert.doesNotMatch(serialized, /"@type":"Offer"/);
  assert.doesNotMatch(serialized, /"@type":"MenuItem"/);
  assert.doesNotMatch(serialized, /price|datePublished|availability/);
});

test("uses live API price and course names in the linked daily graph", () => {
  const graph = buildExecutiveMenuGraph(sampleMenu);
  const serialized = JSON.stringify(graph);

  assert.match(serialized, /"price":10990/);
  assert.match(serialized, /"priceCurrency":"CLP"/);
  assert.doesNotMatch(serialized, /availability/);
  assert.deepEqual(
    graph["@graph"]
      .filter((node) => node["@type"] === "MenuItem")
      .map((node) => node.name),
    [
      "Una bebida",
      "Crema de verduras",
      "Pollo al curry con arroz al cilantro",
      "Postre del día"
    ]
  );

  const webpage = graph["@graph"].find(
    (node) => node["@type"] === "WebPage"
  );
  const menu = graph["@graph"].find((node) => node["@type"] === "Menu");
  assert.deepEqual(webpage?.about, { "@id": "https://derivastudio.cl/#cafe" });
  assert.deepEqual(menu?.provider, { "@id": "https://derivastudio.cl/#cafe" });
});
