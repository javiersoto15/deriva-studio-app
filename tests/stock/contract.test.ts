import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdjustmentPayload,
  extractStockItem,
  isAmbiguousStockStatus,
  normalizeHistory,
  normalizeHistoryPage,
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

test("tracked snapshots require a valid server clock while untracked legacy snapshots keep the fallback", () => {
  const trackedItem = {
    id: "menu:pastry",
    kind: "menu_item",
    name: "Brownie",
    unit: "unit",
    quantity: 2,
    revision: 1,
    shelf_life: {
      fresh_days: 2,
      discard_days: 3,
      worst_state: "fresh",
      last_sale_day: false,
      counts: { discard: 0, sell_first: 0, fresh: 2, unknown: 0 },
      lots: []
    }
  };
  const base = {
    items: [trackedItem],
    stock_visibility_enabled: false,
    can_manage_raw_items: false
  };

  assert.throws(() => normalizeStockSnapshot(base), /missing now.*tracked/i);
  assert.throws(() => normalizeStockSnapshot({ ...base, now: "not-a-timestamp" }), /invalid now.*tracked/i);

  const legacy = normalizeStockSnapshot({ ...base, items: [{ ...trackedItem, shelf_life: undefined }] });
  assert.ok(Number.isFinite(Date.parse(legacy.now)));
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

test("normalizes paged history cursors and rejects inconsistent pagination", () => {
  const entry = {
    id: "history-1",
    stock_id: "raw:coffee",
    actor_id: "staff",
    before_quantity: 1,
    after_quantity: 0,
    created_at: "2026-10-02T18:00:00.000Z",
    mode: "set",
    quantity: 0,
    revision: 3
  };
  assert.deepEqual(normalizeHistoryPage({ entries: [entry], has_more: true, next_before_revision: 3 }), {
    entries: [{ ...entry, reason: "", request_id: "" }],
    has_more: true,
    next_before_revision: 3
  });
  assert.throws(() => normalizeHistoryPage({ entries: [], has_more: true, next_before_revision: null }), /pagination/);
  assert.throws(() => normalizeHistoryPage({ entries: [], has_more: false, next_before_revision: 1 }), /pagination/);
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
