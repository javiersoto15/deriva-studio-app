import assert from "node:assert/strict";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/server";
import { buildDoors, groupOffers, indexItems, offerFloor, resolveFeatured, resolvePairs, stopItems } from "../../app/(landing)/menu/_components/carta-a/doors";

const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  description: "",
  available: true,
  ...extra
});

const group = (id: string, label: string, description = `${label} blurb`) => ({ id, label, description });

// Mirrors the live payload shape since 2026-10-31: every section carries its
// door in `section.group`, and Cafetería arrives with Café de autor first.
const menu = {
  featured: [
    { item_id: "pie", kind: "new", group_id: "dulce" },
    { item_id: "ghost", kind: "recommended", group_id: "cafe" },
    { item_id: "tropical", kind: "recommended", group_id: "cafe" }
  ],
  sections: [
    {
      id: "cafeteria",
      group: group("cafe", "Café", "De autor, espresso y filtrados"),
      numeral: "01",
      title: "Cafetería",
      emphasis: "hero",
      lede: "",
      banner_image_url: "https://x/banner-cafeteria.jpg",
      subgroups: [
        {
          id: "cafes-autor",
          label: "Café de autor",
          items: [
            item("nuevo", { highlight: "new", highlight_rank: 2 }),
            item("tropical", { author: "Maria", image_url: "https://x/tropical.jpg", highlight: "recommended", highlight_rank: 1, pairs_with: ["pie", "ghost"] })
          ]
        },
        {
          id: "espresso",
          label: "Barra de espresso",
          items: [item("espresso"), item("mocha", { image_url: "https://x/mocha.jpg" })]
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
        },
        { id: "pie-combo", title: "Café simple + pie del día", description: "", price_clp: 4990 }
      ]
    },
    {
      id: "desayunos-weekday",
      group: group("comida", "Comida"),
      numeral: "02",
      title: "Desayunos.",
      emphasis: "primary",
      lede: "",
      banner_image_url: "https://x/desay.jpg",
      items: [item("campesino")]
    },
    // No group at all: must still render, in the door of the section before it.
    { id: "plato-nuevo", numeral: "03", title: "Plato nuevo", emphasis: "utility", lede: "", items: [item("nuevo-plato")] },
    {
      id: "pasteleria",
      group: group("dulce", "Dulce"),
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
      group: group("bar", "Bar"),
      numeral: "05",
      title: "Cervezas",
      emphasis: "utility",
      lede: "",
      items: [item("stella")],
      offers: [
        {
          id: "hh-cervezas",
          title: "Happy Hour · Cervezas",
          description: "",
          group: { id: "happy-hour", title: "Happy Hour" },
          tab_label: "Cervezas",
          detail: {
            items: [
              { item: item("stella"), quantity: 2, pricing: { kind: "fixed", amount_clp: 5000 } },
              { item: item("leyenda"), quantity: 2, pricing: { kind: "fixed", amount_clp: 7000 } }
            ]
          }
        },
        {
          id: "hh-tragos",
          title: "Happy Hour · Tragos",
          description: "",
          group: { id: "happy-hour", title: "Happy Hour" },
          tab_label: "Tragos",
          detail: { items: [{ item: item("pisco"), quantity: 2, pricing: { kind: "fixed", amount_clp: 8990 } }] }
        }
      ]
    }
  ]
} as unknown as PublicMenuView;

test("doors come from section.group, in fixed door order, with backend labels", () => {
  const doors = buildDoors(menu);
  assert.deepEqual(doors.map((d) => d.id), ["cafe", "comida", "dulce", "bar"]);
  assert.equal(doors[0].label, "Café");
  assert.equal(doors[0].description, "De autor, espresso y filtrados");
});

test("a section without a known group joins the door of the section before it", () => {
  const comida = buildDoors(menu).find((d) => d.id === "comida")!;
  assert.deepEqual(comida.sections.map((s) => s.id), ["desayunos-weekday", "plato-nuevo"]);
});

test("subgroup order is the backend's — the carta never reorders it", () => {
  const cafe = buildDoors(menu)[0];
  assert.deepEqual(cafe.stops.map((s) => s.label), ["Café de autor", "Barra de espresso"]);
  assert.equal(cafe.photo, "https://x/tropical.jpg");
});

test("single-section doors with subgroups use subgroups as stops; multi-section doors use sections", () => {
  const [, comida, dulce, bar] = buildDoors(menu);
  assert.deepEqual(comida.stops.map((s) => s.label), ["Desayunos", "Plato nuevo"]);
  assert.deepEqual(dulce.stops.map((s) => s.label), ["Pies", "Queques"]);
  assert.equal(bar.stops.length, 1);
});

test("counts items and collects offers per door", () => {
  const [cafe, , , bar] = buildDoors(menu);
  assert.equal(cafe.itemCount, 4);
  assert.equal(cafe.offers.length, 2);
  assert.equal(bar.offers.length, 2);
});

test("a door without an item photo falls back to its first section banner", () => {
  assert.equal(buildDoors(menu)[1].photo, "https://x/desay.jpg");
});

test("stopItems lists every item exactly once across a door's stops", () => {
  for (const door of buildDoors(menu)) {
    const listed = door.stops.flatMap((stop) => stopItems(door, stop).map((i) => i.id));
    assert.equal(listed.length, door.itemCount, `${door.id} lists each item once`);
    assert.equal(new Set(listed).size, listed.length);
  }
});

test("offers sharing offer.group merge into one card, tabs from tab_label", () => {
  const [bar] = groupOffers(buildDoors(menu)[3].offers);
  assert.equal(bar.title, "Happy Hour");
  assert.deepEqual(bar.offers.map((o) => o.id), ["hh-cervezas", "hh-tragos"]);
  assert.deepEqual(bar.labels, ["Cervezas", "Tragos"]);
});

test("ungrouped offers stay single under their own title, even with ' · ' in it", () => {
  const groups = groupOffers([
    { id: "a", title: "Promo · Mañana", description: "" },
    { id: "b", title: "Promo · Tarde", description: "" }
  ] as never[]);
  assert.deepEqual(groups.map((g) => g.title), ["Promo · Mañana", "Promo · Tarde"]);
});

test("offerFloor uses the backend's own prices and never sums", () => {
  const [cafe, , , bar] = buildDoors(menu);
  assert.equal(offerFloor(cafe.offers[0]), 10500);
  assert.equal(offerFloor(cafe.offers[1]), 4990);
  assert.equal(offerFloor(bar.offers[0]), 5000);
  assert.equal(offerFloor({ id: "p", title: "Plain", description: "" } as never), undefined);
});

test("each door lists its curated dishes in highlight_rank order, and only those", () => {
  const [cafe, comida, dulce] = buildDoors(menu);
  assert.deepEqual(cafe.picks.map((i) => i.id), ["tropical", "nuevo"]);
  assert.deepEqual(comida.picks, []);
  assert.deepEqual(dulce.picks, []);
});

test("featured keeps backend order and skips ids missing from this payload", () => {
  const index = indexItems(buildDoors(menu));
  const rail = resolveFeatured(menu.featured, index);
  assert.deepEqual(rail.map((c) => [c.item.id, c.kind, c.door]), [
    ["pie", "new", "dulce"],
    ["tropical", "recommended", "cafe"]
  ]);
  assert.deepEqual(resolveFeatured(undefined, index), []);
});

test("pairs_with resolves in backend order and drops unknown ids", () => {
  const index = indexItems(buildDoors(menu));
  const tropical = index.get("tropical")!.item;
  assert.deepEqual(resolvePairs(tropical, index).map((p) => [p.item.id, p.door]), [["pie", "dulce"]]);
  assert.deepEqual(resolvePairs(index.get("espresso")!.item, index), []);
});
