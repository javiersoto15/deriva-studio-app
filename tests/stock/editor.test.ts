import assert from "node:assert/strict";
import test from "node:test";

import { parseStockConflict } from "../../src/stock/contract";
import {
  countSummary,
  defaultEditMode,
  filterStockItems,
  formatCount,
  nextUncounted,
  parseAmount,
  payloadQuantity,
  previewAdjustment
} from "../../src/stock/editor";
import type { StockItem } from "../../src/stock/types";

function item(id: string, quantity: number | null, kind: StockItem["kind"] = "menu_item", name = id): StockItem {
  return { id, kind, name, unit: "unit", quantity, revision: quantity === null ? 0 : 1 };
}

test("amounts accept digits only", () => {
  assert.equal(parseAmount("12"), 12);
  assert.equal(parseAmount(" 0 "), 0);
  for (const bad of ["", "-1", "1.5", "1,5", "abc", "99999999999999999999"]) {
    assert.equal(parseAmount(bad), null, bad);
  }
});

test("set writes an absolute count, including zero, even when uncounted", () => {
  assert.deepEqual(previewAdjustment(null, "set", "5"), { ok: true, before: null, after: 5, delta: null });
  assert.deepEqual(previewAdjustment(6, "set", "0"), { ok: true, before: 6, after: 0, delta: null });
});

test("add and subtract need a known count first", () => {
  assert.equal(previewAdjustment(null, "add", "2").ok, false);
  assert.deepEqual(previewAdjustment(null, "subtract", "2"), { ok: false, reason: "needs_initial", before: null });
});

test("a count never goes below zero", () => {
  assert.deepEqual(previewAdjustment(6, "subtract", "8"), { ok: false, reason: "below_zero", before: 6 });
  assert.deepEqual(previewAdjustment(6, "subtract", "6"), { ok: true, before: 6, after: 0, delta: -6 });
  assert.deepEqual(previewAdjustment(6, "add", "2"), { ok: true, before: 6, after: 8, delta: 2 });
});

test("a zero add/subtract is not a movement", () => {
  assert.deepEqual(previewAdjustment(6, "add", "0"), { ok: false, reason: "zero_delta", before: 6 });
});

test("subtract becomes a negative delta", () => {
  assert.equal(payloadQuantity("subtract", 3), -3);
  assert.equal(payloadQuantity("add", 3), 3);
  assert.equal(payloadQuantity("set", 3), 3);
});

test("filters combine kind, uncounted and accent-insensitive-case search", () => {
  const items = [item("menu:brownie", 6, "menu_item", "Brownie Chips"), item("menu:pie", null, "menu_item", "Pie de Limón"), item("raw:leche", null, "raw_item", "Leche de avena")];
  assert.deepEqual(filterStockItems(items, { kind: "all", search: "", uncountedOnly: true }).map((i) => i.id), ["menu:pie", "raw:leche"]);
  assert.deepEqual(filterStockItems(items, { kind: "raw_item", search: "", uncountedOnly: false }).map((i) => i.id), ["raw:leche"]);
  assert.deepEqual(filterStockItems(items, { kind: "all", search: "LIMÓN", uncountedOnly: false }).map((i) => i.id), ["menu:pie"]);
  assert.deepEqual(countSummary(items), { total: 3, menu: 2, raw: 1, uncounted: 2 });
});

test("next uncounted follows the visible order and wraps", () => {
  const visible = [item("a", null), item("b", 3), item("c", null), item("d", null)];
  assert.equal(nextUncounted(visible, "a")?.id, "c");
  assert.equal(nextUncounted(visible, "d")?.id, "a");
  assert.equal(nextUncounted([item("a", null), item("b", 2)], "a"), null);
});

test("the editor always opens in Fijar total, counted or not", () => {
  assert.equal(defaultEditMode(), "set");
});

test("counts use Chilean grouping", () => {
  assert.equal(formatCount(2400), "2.400");
});

test("409 revision conflicts expose the current row; request conflicts do not invent one", () => {
  const revision = parseStockConflict({
    code: "revision_conflict",
    error: "stale",
    current: { id: "menu:brownie", kind: "menu_item", name: "Brownie Chips", unit: "unit", quantity: 3, revision: 4 }
  });
  assert.equal(revision.code, "revision_conflict");
  assert.equal(revision.current?.quantity, 3);
  assert.equal(revision.current?.revision, 4);
  assert.deepEqual(parseStockConflict({ code: "request_conflict", error: "reused" }), { code: "request_conflict", current: null });
  assert.deepEqual(parseStockConflict({ code: "revision_conflict", current: { id: "x" } }), { code: "revision_conflict", current: null });
});
