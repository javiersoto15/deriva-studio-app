import assert from "node:assert/strict";
import test from "node:test";

import { isFreshMenuRequest, isStockNetworkOnlyRequest } from "../../src/sw/routing";

test("stock API and stock pages stay network-only for every request method", () => {
  assert.equal(isStockNetworkOnlyRequest("/api/barra-stock", "GET", ""), true);
  assert.equal(isStockNetworkOnlyRequest("/api/barra-stock/items/menu%3Aespresso/adjustments", "POST", ""), true);
  assert.equal(isStockNetworkOnlyRequest("/stock", "GET", "document"), true);
  assert.equal(isStockNetworkOnlyRequest("/admin/stock", "GET", "document"), true);
  assert.equal(isStockNetworkOnlyRequest("/stock", "GET", ""), false);
  assert.equal(isStockNetworkOnlyRequest("/admin/stocking", "GET", "document"), false);
});

test("menu reads are network-only so stock-driven availability cannot be stale", () => {
  assert.equal(isFreshMenuRequest("/menu", "GET"), true);
  assert.equal(isFreshMenuRequest("/carta/espresso", "GET"), true);
  assert.equal(isFreshMenuRequest("/api/menu?locale=es-CL", "GET"), true);
  assert.equal(isFreshMenuRequest("/menu", "POST"), false);
  assert.equal(isFreshMenuRequest("/api/barra-stock", "GET"), false);
});
