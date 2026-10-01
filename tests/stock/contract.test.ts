import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdjustmentPayload,
  extractStockItem,
  isAmbiguousStockStatus,
  normalizeHistory,
  normalizeStockSnapshot,
  validateAdjustmentPayload
} from "../../src/stock/contract";

test("normalizes the exact stock snapshot while preserving unknown counts", () => {
  const snapshot = normalizeStockSnapshot({
    items: [
      {
        id: "menu:espresso",
        kind: "menu_item",
        menu_item_id: "espresso",
        name: "Espresso",
        unit: "unit",
        quantity: null,
        revision: 0,
        menu_available: true
      },
      {
        id: "raw:leche",
        kind: "raw_item",
        name: "Leche",
        unit: "ml",
        quantity: 1200,
        revision: 4
      }
    ],
    stock_visibility_enabled: false,
    can_manage_raw_items: true
  });

  assert.equal(snapshot.items[0]?.quantity, null);
  assert.equal(snapshot.items[1]?.quantity, 1200);
  assert.equal(snapshot.stock_visibility_enabled, false);
  assert.equal(snapshot.can_manage_raw_items, true);
});

test("extracts the item from the confirmed adjustment envelope", () => {
  const item = extractStockItem({
    item: {
      id: "menu:espresso",
      kind: "menu_item",
      name: "Espresso",
      unit: "unit",
      quantity: 3,
      revision: 2
    },
    adjustment: { id: "adjustment-1" }
  });
  assert.equal(item.quantity, 3);
  assert.equal(item.revision, 2);
});

test("malformed history cannot become an empty successful panel", () => {
  assert.throws(() => normalizeHistory({ history: [] }), /missing entries/);
  assert.deepEqual(normalizeHistory({ entries: [] }), []);
});

test("adjustment payload keeps an explicit request id for safe retries", () => {
  const payload = buildAdjustmentPayload({
    mode: "delta",
    amount: -2,
    expectedRevision: 7,
    requestId: "retry-123",
    reason: "cierre de turno"
  });
  assert.deepEqual(payload, {
    mode: "delta",
    quantity: -2,
    expected_revision: 7,
    request_id: "retry-123",
    reason: "cierre de turno"
  });
  assert.equal(validateAdjustmentPayload(payload), null);
  assert.equal(isAmbiguousStockStatus(500), true);
  assert.equal(isAmbiguousStockStatus(409), false);
});
