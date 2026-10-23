import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWhatsAppShareUrl,
  findSameDayDepletionIds,
  formatStockShare,
  type StockHistoryPageRequest
} from "../../src/stock/share";
import type { StockHistoryEntry, StockItem } from "../../src/stock/types";

function item(
  id: string,
  name: string,
  quantity: number | null,
  unit: StockItem["unit"],
  extra: Partial<StockItem> = {}
): StockItem {
  return { id, kind: "menu_item", name, quantity, unit, revision: 1, ...extra };
}

function history(
  stockId: string,
  revision: number,
  before: number | null,
  after: number,
  createdAt = "2026-10-02T18:00:00.000Z"
): StockHistoryEntry {
  return {
    id: `${stockId}:${revision}`,
    stock_id: stockId,
    actor_id: "staff",
    before_quantity: before,
    after_quantity: after,
    created_at: createdAt,
    mode: "set",
    quantity: after,
    revision
  };
}

test("omits ordinary zero counts and reports only unknown counts", () => {
  const preview = formatStockShare(
    [
      item("menu:medialunas", "Medialunas", 12, "unit"),
      item("menu:tarta", "Tarta entera (congelada)", 0, "unit", { menu_available: false }),
      item("raw:porciones", "Torta de zanahoria", 1, "portion", { kind: "raw_item" }),
      item("raw:cafe", "Café molido", 1500, "g", { kind: "raw_item" }),
      item("raw:leche", "Leche", 2, "l", { kind: "raw_item" }),
      item("raw:vasos", "Vasos", 3, "box", { kind: "raw_item" }),
      item("raw:bolsas", "Bolsas de café", 2, "pack", { kind: "raw_item" }),
      item("menu:quiche", "Quiche", null, "unit")
    ],
    new Date("2026-10-02T18:10:00.000Z")
  );

  assert.equal(preview.heading, "Inventario PM 2/10 · 15:10");
  assert.deepEqual(preview.lines, [
    "12 × Medialunas",
    "1 porción de Torta de zanahoria",
    "1.500 g de Café molido",
    "2 l de Leche",
    "3 cajas de Vasos",
    "2 paquetes de Bolsas de café"
  ]);
  assert.equal(preview.knownCount, 6);
  assert.equal(preview.uncountedCount, 1);
  assert.equal(preview.message, [
    "Inventario PM 2/10 · 15:10",
    "",
    ...preview.lines,
    "",
    "1 artículo sin contar, no incluido."
  ].join("\n"));
});

test("uses Santiago time for AM, PM, and dates crossing local midnight", () => {
  assert.equal(
    formatStockShare([], new Date("2026-10-02T11:05:00.000Z")).heading,
    "Inventario AM 2/10 · 08:05"
  );
  assert.equal(
    formatStockShare([], new Date("2026-10-03T02:59:00.000Z")).heading,
    "Inventario PM 2/10 · 23:59"
  );
  assert.equal(
    formatStockShare([], new Date("2026-10-03T03:00:00.000Z")).heading,
    "Inventario AM 3/10 · 00:00"
  );
});

test("does not create a share message when the snapshot has no known quantities", () => {
  const preview = formatStockShare(
    [item("menu:quiche", "Quiche", null, "unit"), item("raw:sal", "Sal", null, "g", { kind: "raw_item" })],
    new Date("2026-10-02T18:10:00.000Z")
  );

  assert.equal(preview.knownCount, 0);
  assert.equal(preview.uncountedCount, 2);
  assert.deepEqual(preview.lines, []);
  assert.equal(preview.message, "");
});

test("omits ordinary zero counts and uses clear singular and plural units", () => {
  const preview = formatStockShare(
    [
      item("menu:zero", "Galletas", 0, "unit"),
      item("raw:one-portion", "Porción de torta", 1, "portion", { kind: "raw_item" }),
      item("raw:two-portions", "Porciones de torta", 2, "portion", { kind: "raw_item" }),
      item("raw:one-pack", "Paquete de café", 1, "pack", { kind: "raw_item" }),
      item("raw:one-box", "Caja pequeña", 1, "box", { kind: "raw_item" }),
      item("raw:grams", "Sal", 25, "g", { kind: "raw_item" }),
      item("raw:kilos", "Harina", 2, "kg", { kind: "raw_item" }),
      item("raw:milliliters", "Jarabe", 500, "ml", { kind: "raw_item" }),
      item("raw:liters", "Leche", 2, "l", { kind: "raw_item" })
    ],
    new Date("2026-10-02T18:10:00.000Z")
  );

  assert.equal(preview.knownCount, 8);
  assert.deepEqual(preview.lines, [
    "1 porción de Porción de torta",
    "2 porciones de Porciones de torta",
    "1 paquete de Paquete de café",
    "1 caja de Caja pequeña",
    "25 g de Sal",
    "2 kg de Harina",
    "500 ml de Jarabe",
    "2 l de Leche"
  ]);
});

test("does not share a snapshot containing only ordinary zero counts", () => {
  const preview = formatStockShare(
    [item("menu:medialuna", "Medialuna", 0, "unit")],
    new Date("2026-10-02T18:10:00.000Z")
  );

  assert.equal(preview.knownCount, 0);
  assert.equal(preview.uncountedCount, 0);
  assert.equal(preview.message, "");
});

test("shares only a zero with explicit same-day depletion evidence", () => {
  const preview = formatStockShare(
    [item("menu:zero", "Medialuna", 0, "unit"), item("raw:null", "Café", null, "g")],
    new Date("2026-10-02T18:10:00.000Z"),
    new Set(["menu:zero"])
  );

  assert.deepEqual(preview.lines, ["Se acabó Medialuna"]);
  assert.equal(preview.knownCount, 1);
  assert.equal(preview.uncountedCount, 1);
  assert.equal(preview.message, "Inventario PM 2/10 · 15:10\n\nSe acabó Medialuna\n\n1 artículo sin contar, no incluido.");
});

test("places all depletion lines after positive counts while preserving each group order", () => {
  const preview = formatStockShare(
    [
      item("raw:depleted-first", "Galletas", 0, "unit"),
      item("raw:positive-first", "Café", 2, "unit"),
      item("raw:depleted-second", "Tarta", 0, "unit"),
      item("raw:positive-second", "Leche", 3, "l")
    ],
    new Date("2026-10-02T18:10:00.000Z"),
    new Set(["raw:depleted-first", "raw:depleted-second"])
  );

  assert.deepEqual(preview.lines, [
    "2 × Café",
    "3 l de Leche",
    "Se acabó Galletas",
    "Se acabó Tarta"
  ]);
});

test("finds a same-day depletion through repeated zeros but excludes null starts, old days, and restocks", async () => {
  const items = [
    item("raw:today", "Hoy", 0, "unit", { revision: 9 }),
    item("raw:null", "Nuevo", 0, "unit", { revision: 2 }),
    item("raw:old", "Ayer", 0, "unit", { revision: 2 }),
    item("raw:restocked", "Repuso", 3, "unit", { revision: 4 })
  ];
  const calls: string[] = [];
  const depleted = await findSameDayDepletionIds(items, new Date("2026-10-02T18:10:00Z"), async (id) => {
    calls.push(id);
    const entries: Record<string, StockHistoryEntry[]> = {
      "raw:today": [history(id, 9, 0, 0), history(id, 8, 4, 0)],
      "raw:null": [history(id, 2, null, 0)],
      "raw:old": [history(id, 2, 5, 0, "2026-10-02T02:30:00.000Z")]
    };
    return { entries: entries[id] ?? [], has_more: false, next_before_revision: null };
  });

  assert.deepEqual([...depleted], ["raw:today"]);
  assert.deepEqual(calls.sort(), ["raw:null", "raw:old", "raw:today"]);
});

test("bounds each scan to the snapshot revision and follows validated history pages", async () => {
  const snapshotItem = item("raw:pages", "Páginas", 0, "unit", { revision: 101 });
  const requests: StockHistoryPageRequest[] = [];
  const depleted = await findSameDayDepletionIds([snapshotItem], new Date("2026-10-02T18:10:00Z"), async (_id, request) => {
    requests.push(request);
    if (requests.length === 1) {
      return {
        entries: Array.from({ length: 100 }, (_, index) => history("raw:pages", 101 - index, 0, 0)),
        has_more: true,
        next_before_revision: 2
      };
    }
    return {
      entries: [history("raw:pages", 1, 4, 0)],
      has_more: false,
      next_before_revision: null
    };
  });

  assert.deepEqual(requests, [{ limit: 100, beforeRevision: 102 }, { limit: 100, beforeRevision: 2 }]);
  assert.deepEqual([...depleted], ["raw:pages"]);
});

test("ignores post-read events and stops after the Santiago date boundary", async () => {
  const snapshotItem = item("raw:boundary", "Borde", 0, "unit", { revision: 3 });
  const depleted = await findSameDayDepletionIds([snapshotItem], new Date("2026-10-03T03:30:00Z"), async () => ({
    entries: [
      history("raw:boundary", 3, 5, 0, "2026-10-03T03:45:00.000Z"),
      history("raw:boundary", 2, 5, 0, "2026-10-03T02:30:00.000Z")
    ],
    has_more: false,
    next_before_revision: null
  }));

  assert.deepEqual([...depleted], []);
});

test("uses the Santiago calendar date across winter and daylight-saving offsets", async () => {
  const winter = await findSameDayDepletionIds(
    [item("raw:winter", "Invierno", 0, "unit", { revision: 1 })],
    new Date("2026-07-03T03:30:00Z"),
    async () => ({ entries: [history("raw:winter", 1, 2, 0, "2026-07-03T02:30:00.000Z")], has_more: false, next_before_revision: null })
  );
  const summer = await findSameDayDepletionIds(
    [item("raw:summer", "Verano", 0, "unit", { revision: 1 })],
    new Date("2026-10-03T03:30:00Z"),
    async () => ({ entries: [history("raw:summer", 1, 2, 0, "2026-10-03T02:30:00.000Z")], has_more: false, next_before_revision: null })
  );

  assert.deepEqual([...winter], ["raw:winter"]);
  assert.deepEqual([...summer], []);
});

test("fails closed on malformed pagination and limits concurrent scans to four zero items", async () => {
  const bad = item("raw:bad", "Malo", 0, "unit", { revision: 2 });
  await assert.rejects(
    findSameDayDepletionIds([bad], new Date("2026-10-02T18:10:00Z"), async () => ({
      entries: [history("raw:bad", 2, 0, 0)], has_more: true, next_before_revision: 3
    })),
    /history/i
  );

  const manyItems = Array.from({ length: 11 }, (_, i) => item(`raw:${i}`, `Item ${i}`, 0, "unit", { revision: 0 }));
  manyItems.push(item("raw:positive", "Positivo", 1, "unit", { revision: 1 }));
  let active = 0;
  let maximum = 0;
  const calls: string[] = [];
  await findSameDayDepletionIds(manyItems, new Date("2026-10-02T18:10:00Z"), async (id) => {
    calls.push(id);
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    active -= 1;
    return { entries: [], has_more: false, next_before_revision: null };
  });
  assert.equal(maximum <= 4, true);
  assert.equal(calls.length, 11);
  assert.equal(calls.includes("raw:positive"), false);
});

test("fails closed after the explicit ten-page history limit", async () => {
  const stockItem = item("raw:long", "Largo", 0, "unit", { revision: 1_000 });
  await assert.rejects(
    findSameDayDepletionIds([stockItem], new Date("2026-10-02T18:10:00Z"), async (_id, request) => {
      const firstRevision = request.beforeRevision - 1;
      const entries = Array.from({ length: 100 }, (_, index) => history("raw:long", firstRevision - index, 0, 0));
      return {
        entries,
        has_more: true,
        next_before_revision: entries.at(-1)?.revision ?? null
      };
    }),
    /scan limit/
  );
});

test("builds the manual-recipient WhatsApp URL with the complete encoded message", () => {
  const message = "Inventario AM 2/10 · 08:05\n1 × Café & mate";
  assert.equal(buildWhatsAppShareUrl(message), `https://wa.me/?text=${encodeURIComponent(message)}`);
  assert.equal(new URL(buildWhatsAppShareUrl(message)).pathname, "/");
});
