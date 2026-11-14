import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeName,
  ingredientMatches,
  parseQuantity,
  previewCount,
  formatShare,
  normalizeSnapshot,
} from "../../src/kitchen-stock/model";
import type { KitchenItem } from "../../src/kitchen-stock/types";
const item = (
  name: string,
  quantity: string | null = "1",
  extra: Partial<KitchenItem> = {},
): KitchenItem => ({
  id: name,
  name,
  quantity,
  category: "verduras",
  unit: "kg",
  package_note: "",
  revision: 1,
  counted_at: "2026-11-14T15:52:00Z",
  updated_at: "2026-11-14T15:52:00Z",
  ...extra,
});
test("normalization prevents accent/case/spacing duplicates without collapsing different ingredients", () => {
  assert.equal(
    normalizeName("  AJÍ   amarillo "),
    normalizeName("ají amarillo"),
  );
  assert.notEqual(normalizeName("Cebolla"), normalizeName("Cebolla morada"));
});
test("suggestions rank exact before singular/plural and typo matches", () => {
  const values = [
    item("Tomate cherry"),
    item("Tomate"),
    item("Papa"),
    item("Paltas"),
  ];
  assert.equal(ingredientMatches(values, "tomate")[0].name, "Tomate");
  assert.ok(
    ingredientMatches(values, "tomates").some((x) => x.name === "Tomate"),
  );
  assert.ok(
    ingredientMatches(values, "tomtae").some((x) => x.name === "Tomate"),
  );
  assert.deepEqual(ingredientMatches(values, "xyz"), []);
});
test("decimal amounts are parsed exactly and bounded; preview never rounds or goes negative", () => {
  assert.equal(parseQuantity("0,5"), "0.5");
  assert.equal(parseQuantity("1.230"), "1.23");
  for (const x of ["-1", "NaN", "1e2", "1.2345", "9007199254740"])
    assert.equal(parseQuantity(x), null, x);
  assert.equal(previewCount("0.1", "add", "0.2"), "0.3");
  assert.equal(previewCount("0.1", "subtract", "0.2"), null);
  assert.equal(previewCount(null, "add", "1"), null);
  assert.equal(previewCount(null, "set", "0"), "0");
});
test("share contains all saved counts, explicit zeros, package details and honest read/count times", () => {
  const message = formatShare(
    [
      item("Rúcula", "0"),
      item("Mantequilla", "12", {
        category: "otros",
        unit: "paquetes",
        package_note: "250 g c/u",
      }),
      item("Sin contar", null),
    ],
    "2026-11-15T12:00:00Z",
  );
  assert.match(message, /Rúcula 0 kg/);
  assert.match(message, /Mantequilla 12 paquetes \(250 g c\/u\)/);
  assert.match(message, /Sin contar: 1/);
  assert.match(message, /14\/11\/2026/);
  assert.match(message, /Consultado/);
});
test("contract rejects malformed quantities and duplicate IDs instead of enabling writes", () => {
  assert.throws(() =>
    normalizeSnapshot({
      items: [item("A", "NaN")],
      now: "2026-11-14T15:52:00Z",
    }),
  );
  assert.throws(() =>
    normalizeSnapshot({
      items: [item("A"), item("A")],
      now: "2026-11-14T15:52:00Z",
    }),
  );
  assert.equal(
    normalizeSnapshot({ items: [item("A")], now: "2026-11-14T15:52:00Z" }).items
      .length,
    1,
  );
});
test("uncounted ingredients at revision zero remain usable and missing units are preserved", () => {
  const value = item("Lechuga costina", null, {
    revision: 0,
    unit: null,
    counted_at: null,
  });
  assert.equal(
    normalizeSnapshot({ items: [value], now: "2026-11-14T15:52:00Z" }).items[0]
      .unit,
    null,
  );
  assert.ok(ingredientMatches([item("Pimentón")], "pimentones").length);
});
