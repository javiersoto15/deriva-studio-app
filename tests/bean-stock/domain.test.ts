import test from "node:test";
import assert from "node:assert/strict";
import {
  parseKilograms,
  gramsToKilograms,
  previewQuantity,
  buildAdjustment,
  normalizeSnapshot,
  normalizeHistory,
} from "../../src/bean-stock/model";
import { buildBeanShareText } from "../../src/bean-stock/share";
export const item = {
  id: "bean_" + "a".repeat(32),
  name: "House Blend",
  origin_id: "orig_house_blend",
  tier: "regular" as const,
  unit: "kg" as const,
  quantity_kg: null,
  revision: 0,
  updated_at: "2026-11-16T12:00:00Z",
};
export const snapshot = {
  items: [
    item,
    {
      ...item,
      id: "bean_" + "b".repeat(32),
      name: "Cenicafé",
      tier: "premium" as const,
      quantity_kg: "0",
      revision: 1,
    },
  ],
  now: "2026-11-16T12:00:00Z",
  can_manage_beans: false,
  menu_items: [],
  links: [],
};
test("decimal kg input preserves exact grams and canonical fractions", () => {
  for (const [s, n] of [
    ["0", 0],
    ["0,125", 125],
    ["1.001", 1001],
    ["999999999.999", 999999999999],
    ["0001.200", 1200],
  ] as const)
    assert.equal(parseKilograms(s), n);
  assert.equal(gramsToKilograms(1200), "1.2");
  assert.equal(gramsToKilograms(1), "0.001");
  for (const s of [
    "1e3",
    "+1",
    "-1",
    "1.0001",
    ".5",
    "1.",
    "1,2.3",
    "1000000000",
    "",
    "Infinity",
  ])
    assert.equal(parseKilograms(s), null, s);
});
test("unknown balance allows count but blocks deltas; prevents overdraw and overflow", () => {
  assert.equal(previewQuantity(null, "set", "0"), "0");
  assert.equal(previewQuantity(null, "add", "1"), null);
  assert.equal(previewQuantity("0.125", "subtract", "0.126"), null);
  assert.equal(previewQuantity("999999999.999", "add", "0.001"), null);
  assert.equal(previewQuantity("0.3", "subtract", "0.1"), "0.2");
  assert.deepEqual(
    buildAdjustment(
      { ...item, quantity_kg: "1", revision: 3 },
      "subtract",
      "0,125",
      "r",
      "Uso",
    ),
    {
      mode: "delta",
      quantity_kg: "-0.125",
      expected_revision: 3,
      request_id: "r",
      reason: "Uso",
    },
  );
});
test("strict snapshot preserves manual availability and rejects invalid success", () => {
  const s = {
    ...snapshot,
    menu_items: [
      {
        id: "m",
        name: "Pour over",
        available: false,
        origin_ids: ["orig_house_blend"],
      },
    ],
    links: [{ bean_id: item.id, menu_item_id: "m" }],
  };
  assert.equal(normalizeSnapshot(s).menu_items[0].available, false);
  for (const bad of [
    { ...s, can_manage_beans: "false" },
    { ...s, items: [{ ...item, quantity_kg: 0 }] },
    { ...s, items: [item, item] },
    { ...s, links: [{ bean_id: "missing", menu_item_id: "m" }] },
    { ...s, now: "invalid" },
  ])
    assert.throws(() => normalizeSnapshot(bad));
});
test("history requires explicit pagination and valid exact quantities", () => {
  assert.deepEqual(
    normalizeHistory({
      entries: [],
      has_more: false,
      next_before_revision: null,
    }),
    { entries: [], has_more: false, next_before_revision: null },
  );
  assert.throws(() => normalizeHistory({ entries: [] }));
  assert.throws(() =>
    normalizeHistory({
      entries: [],
      has_more: true,
      next_before_revision: null,
    }),
  );
});
test("share includes all unknown and zero rows with premium metadata", () => {
  const text = buildBeanShareText(normalizeSnapshot(snapshot));
  assert.match(text, /House Blend.*Sin contar/);
  assert.match(text, /Cenicafé.*0 kg/);
  assert.match(text, /premium/i);
  assert.match(text, /Stock de granos/);
});
test("response parser canonicalizes valid kilograms and checks real audit arithmetic", () => {
  const normalized = normalizeSnapshot({
    ...snapshot,
    items: [{ ...item, quantity_kg: "0001.200", revision: 1 }],
  });
  assert.equal(normalized.items[0].quantity_kg, "1.2");
  const e = {
    id: "adj",
    bean_id: item.id,
    mode: "delta",
    quantity_kg: "-0.125",
    before_kg: "1",
    after_kg: "0.875",
    revision: 2,
    request_id: "r",
    actor_id: "staff",
    reason: "",
    created_at: item.updated_at,
  };
  assert.equal(
    normalizeHistory({ entries: [e], has_more: true, next_before_revision: 2 })
      .entries[0].actor_id,
    "staff",
  );
  assert.throws(() =>
    normalizeHistory({
      entries: [{ ...e, after_kg: "0.9" }],
      has_more: false,
      next_before_revision: null,
    }),
  );
});
