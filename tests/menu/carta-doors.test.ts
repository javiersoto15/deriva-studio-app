import assert from "node:assert/strict";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/server";
import { buildDoors, offerFloor } from "../../app/(landing)/menu/_components/carta-a/doors";

const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  description: "",
  available: true,
  ...extra
});

const menu = {
  sections: [
    {
      id: "cafeteria",
      numeral: "01",
      title: "Cafetería",
      emphasis: "hero",
      lede: "",
      banner_image_url: "https://x/banner-cafeteria.jpg",
      subgroups: [
        {
          id: "espresso",
          label: "Barra de espresso",
          items: [item("espresso"), item("mocha", { image_url: "https://x/mocha.jpg" })]
        },
        {
          id: "cafes-autor",
          label: "Café de autor",
          items: [item("nuevo"), item("tropical", { author: "Maria", image_url: "https://x/tropical.jpg" })]
        }
      ],
      offers: [
        {
          id: "oficina",
          title: "Oficina",
          description: "",
          variants: [
            { id: "a", label: "x2", price_clp: 10500, components: [] },
            { id: "b", label: "x4", price_clp: 20900, components: [] }
          ]
        }
      ]
    },
    {
      id: "desayunos-weekday",
      numeral: "02",
      title: "Desayunos.",
      emphasis: "primary",
      lede: "",
      banner_image_url: "https://x/desay.jpg",
      items: [item("campesino")]
    },
    { id: "plato-nuevo", numeral: "03", title: "Plato nuevo", emphasis: "utility", lede: "", items: [item("nuevo-plato")] },
    {
      id: "pasteleria",
      numeral: "04",
      title: "Pastelería",
      emphasis: "utility",
      lede: "",
      subgroups: [
        { id: "pies", label: "Pies", items: [item("pie")] },
        { id: "queques", label: "Queques", items: [item("queque")] }
      ]
    },
    {
      id: "cervezas-cocteles",
      numeral: "05",
      title: "Cervezas",
      emphasis: "utility",
      lede: "",
      items: [item("stella")],
      offers: [
        {
          id: "hh",
          title: "HH",
          description: "",
          detail: {
            items: [
              { item: item("stella"), quantity: 2, pricing: { kind: "fixed", amount_clp: 5000 } },
              { item: item("leyenda"), quantity: 2, pricing: { kind: "fixed", amount_clp: 7000 } }
            ]
          }
        }
      ]
    }
  ]
} as unknown as PublicMenuView;

test("groups sections into the four doors in fixed order", () => {
  const doors = buildDoors(menu);
  assert.deepEqual(doors.map((d) => d.id), ["cafe", "comida", "dulce", "bar"]);
  assert.deepEqual(doors[1].sections.map((s) => s.id), ["desayunos-weekday", "plato-nuevo"]);
});

test("an unknown section joins the door of the section before it", () => {
  const comida = buildDoors(menu).find((d) => d.id === "comida")!;
  assert.ok(comida.sections.some((s) => s.id === "plato-nuevo"));
});

test("the authored subgroup leads the Café door and its photo is the door photo", () => {
  const cafe = buildDoors(menu)[0];
  assert.equal(cafe.stops[0].label, "Café de autor");
  assert.equal(cafe.stops[0].subgroupId, "cafes-autor");
  assert.equal(cafe.photo, "https://x/tropical.jpg");
});

test("single-section doors with subgroups use subgroups as stops; multi-section doors use sections", () => {
  const [cafe, comida, dulce, bar] = buildDoors(menu);
  assert.deepEqual(cafe.stops.map((s) => s.label), ["Café de autor", "Barra de espresso"]);
  assert.deepEqual(comida.stops.map((s) => s.label), ["Desayunos", "Plato nuevo"]);
  assert.deepEqual(dulce.stops.map((s) => s.label), ["Pies", "Queques"]);
  assert.equal(bar.stops.length, 1);
});

test("counts items and collects offers per door", () => {
  const [cafe, , , bar] = buildDoors(menu);
  assert.equal(cafe.itemCount, 4);
  assert.equal(cafe.offers.length, 1);
  assert.equal(bar.offers[0].id, "hh");
});

test("a door without an item photo falls back to its first section banner", () => {
  assert.equal(buildDoors(menu)[1].photo, "https://x/desay.jpg");
});

test("offerFloor picks the lowest backend price and never sums", () => {
  const [cafe, , , bar] = buildDoors(menu);
  assert.equal(offerFloor(cafe.offers[0]), 10500);
  assert.equal(offerFloor(bar.offers[0]), 5000);
  assert.equal(offerFloor({ id: "p", title: "Plain", description: "CLP $3.990" } as never), undefined);
});
