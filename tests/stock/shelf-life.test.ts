import assert from "node:assert/strict";
import test from "node:test";

import { normalizeStockSnapshot, normalizeHistory } from "../../src/stock/contract";
import {
  expiryBreakdown,
  formatLotDay,
  fromLocalInputValue,
  previewLots,
  retireExpiredDraft,
  shelfStatus,
  toLocalInputValue
} from "../../src/stock/shelf-life";
import type { StockLot, StockShelfLife } from "../../src/stock/types";

function lot(id: string, state: StockLot["state"], left: number, enteredAt: string | null, freshUntil?: string, discardAt?: string): StockLot {
  return {
    id,
    entered_at: enteredAt,
    quantity_left: left,
    fresh_until: enteredAt ? freshUntil ?? null : null,
    discard_at: enteredAt ? discardAt ?? null : null,
    state
  };
}

function shelf(lots: StockLot[], extra: Partial<StockShelfLife> = {}): StockShelfLife {
  const counts = { discard: 0, sell_first: 0, fresh: 0, unknown: 0 };
  for (const entry of lots) counts[entry.state] += entry.quantity_left;
  const order = ["discard", "sell_first", "unknown", "fresh"] as const;
  return {
    fresh_days: 2,
    discard_days: 3,
    worst_state: order.find((state) => counts[state] > 0) ?? "fresh",
    last_sale_day: false,
    counts,
    lots,
    ...extra
  };
}

// Wed 21 Oct 2026 08:40 in Santiago (UTC-3).
const WED_0840 = "2026-10-21T11:40:00.000Z";

test("snapshot keeps shelf_life, now and summary; untracked rows stay without it", () => {
  const snapshot = normalizeStockSnapshot({
    now: "2026-10-24T15:00:00Z",
    shelf_life_summary: { discard_items: 1, sell_first_items: 0 },
    stock_visibility_enabled: false,
    can_manage_raw_items: true,
    items: [
      {
        id: "menu:torta-lucuma",
        kind: "menu_item",
        name: "Torta lúcuma manjar",
        unit: "portion",
        quantity: 7,
        revision: 4,
        shelf_life: {
          fresh_days: 2,
          discard_days: 3,
          worst_state: "discard",
          last_sale_day: false,
          counts: { discard: 2, sell_first: 0, fresh: 5, unknown: 0 },
          lots: [
            { id: "lot_a", entered_at: WED_0840, quantity_left: 2, fresh_until: "2026-10-23T11:40:00Z", discard_at: "2026-10-24T11:40:00Z", state: "discard" },
            { id: "lot_b", entered_at: "2026-10-24T12:00:00Z", quantity_left: 5, fresh_until: "2026-10-26T12:00:00Z", discard_at: "2026-10-27T12:00:00Z", state: "fresh" }
          ]
        }
      },
      { id: "raw:leche", kind: "raw_item", name: "Leche", unit: "l", quantity: 3, revision: 1 }
    ]
  });
  assert.equal(snapshot.now, "2026-10-24T15:00:00Z");
  assert.deepEqual(snapshot.shelf_life_summary, { discard_items: 1, sell_first_items: 0 });
  assert.equal(snapshot.items[0].shelf_life?.lots.length, 2);
  assert.equal(snapshot.items[0].shelf_life?.lots[0].state, "discard");
  assert.equal(snapshot.items[1].shelf_life, undefined);
});

test("snapshot rejects a malformed lot instead of guessing", () => {
  assert.throws(() =>
    normalizeStockSnapshot({
      now: "2026-10-24T15:00:00Z",
      shelf_life_summary: { discard_items: 0, sell_first_items: 0 },
      stock_visibility_enabled: false,
      can_manage_raw_items: false,
      items: [{
        id: "menu:x", kind: "menu_item", name: "X", unit: "unit", quantity: 1, revision: 1,
        shelf_life: { fresh_days: 1, discard_days: 2, worst_state: "rotten", last_sale_day: false, counts: { discard: 0, sell_first: 0, fresh: 1, unknown: 0 }, lots: [] }
      }]
    })
  );
});

test("history keeps lot snapshots for tracked adjustments", () => {
  const [entry] = normalizeHistory({
    entries: [{
      id: "adj_1", stock_id: "menu:brownie", actor_id: "us_1", before_quantity: 4, after_quantity: 1,
      reason: "Merma · vencido", created_at: "2026-10-24T15:00:00Z", mode: "delta", quantity: -3, revision: 9,
      request_id: "req-1",
      lots_affected: [{ lot_id: "lot_a", entered_at: WED_0840, fresh_until: null, discard_at: null, before: 3, after: 0 }]
    }]
  });
  assert.equal(entry.lots_affected?.[0].after, 0);
  assert.equal(entry.request_id, "req-1");
});

test("row status words the worst state first", () => {
  const status = shelfStatus(shelf([
    lot("lot_a", "discard", 2, WED_0840),
    lot("lot_b", "fresh", 5, "2026-10-24T12:00:00Z", "2026-10-26T12:00:00Z")
  ]));
  assert.deepEqual(status, { tone: "discard", text: "Retirar 2 · entró mié 08:40" });

  const sellFirst = shelfStatus(shelf([lot("lot_a", "sell_first", 3, WED_0840, "2026-10-23T11:40:00Z", "2026-10-26T11:40:00Z")]));
  assert.deepEqual(sellFirst, { tone: "sell_first", text: "Vender primero 3 · retirar lun 26" });

  const saturday = shelfStatus(shelf(
    [lot("lot_a", "sell_first", 3, WED_0840, "2026-10-23T11:40:00Z", "2026-10-26T11:40:00Z")],
    { last_sale_day: true }
  ));
  assert.equal(saturday?.text, "Vender hoy 3 · retirar lun 26");

  assert.deepEqual(shelfStatus(shelf([lot("lot_u", "unknown", 4, null)])), { tone: "unknown", text: "4 sin fecha de entrada" });
  assert.equal(shelfStatus(shelf([])), null);
});

test("expiry breakdown groups exact instants and orders deadlines without merging sub-millisecond differences", () => {
  const rows = expiryBreakdown(shelf([
    lot("lot_late", "fresh", 5, WED_0840, undefined, "2026-11-01T13:00:00Z"),
    lot("lot_same_a", "fresh", 2, WED_0840, undefined, "2026-10-31T00:00:00.123400Z"),
    lot("lot_same_b", "sell_first", 1, WED_0840, undefined, "2026-10-30T21:00:00.1234-03:00"),
    lot("lot_micro", "fresh", 4, WED_0840, undefined, "2026-10-31T00:00:00.123401Z"),
    lot("lot_early", "fresh", 1, WED_0840, undefined, "2026-10-30T23:00:00Z"),
    lot("lot_zero", "fresh", 0, WED_0840, undefined, "2026-10-30T22:30:00Z")
  ]), "2026-10-30T22:00:00.000Z");

  assert.deepEqual(rows.map(({ quantity, detail, action, tone }) => ({ quantity, detail, action, tone })), [
    { quantity: 1, detail: "1 unid. · queda 1 h", action: "Retirar vie 30 oct, 20:00", tone: "upcoming" },
    { quantity: 3, detail: "3 unid. · quedan 2 h", action: "Retirar vie 30 oct, 21:00", tone: "upcoming" },
    { quantity: 4, detail: "4 unid. · quedan 2 h", action: "Retirar vie 30 oct, 21:00", tone: "upcoming" },
    { quantity: 5, detail: "5 unid. · queda 1 d 15 h", action: "Retirar dom 1 nov, 10:00", tone: "upcoming" }
  ]);
});

test("expiry details distinguish unknown age from a missing or invalid deadline", () => {
  const rows = expiryBreakdown(shelf([
    lot("lot_unknown", "unknown", 2, null),
    lot("lot_missing", "fresh", 3, WED_0840),
    lot("lot_invalid", "sell_first", 4, WED_0840, undefined, "no-es-fecha"),
    lot("lot_too_precise", "fresh", 2, WED_0840, undefined, "2026-10-31T00:00:00.1234567891Z"),
    lot("lot_zero", "fresh", 0, WED_0840)
  ]), "2026-10-30T22:00:00.000Z");

  assert.deepEqual(rows.map(({ quantity, detail, action, tone }) => ({ quantity, detail, action, tone })), [
    { quantity: 2, detail: "2 unid. · sin fecha de entrada", action: null, tone: "unknown" },
    { quantity: 9, detail: "9 unid. · plazo no disponible", action: null, tone: "unavailable" }
  ]);
});

test("backend discard state never becomes a positive countdown when its recorded deadline is ahead", () => {
  const [row] = expiryBreakdown(
    shelf([lot("lot_discard", "discard", 2, WED_0840, undefined, "2026-10-31T00:00:00Z")]),
    "2026-10-30T22:00:00Z"
  );

  assert.equal(row?.detail, "2 unid. · vencidas, retirar ahora");
  assert.equal(row?.action, "Plazo registrado: vie 30 oct, 21:00");
  assert.equal(row?.tone, "expired");
});

test("expiry bucket quantities use the stock unit abbreviation and Chilean grouping", () => {
  const [row] = expiryBreakdown(
    shelf([lot("lot_portions", "fresh", 1_200, WED_0840, undefined, "2026-10-31T00:00:00Z")]),
    "2026-10-30T22:00:00Z",
    "portion"
  );

  assert.equal(row?.detail, "1.200 porc. · quedan 2 h");
});

test("expiry detail floors remaining-time labels and marks the exact deadline expired", () => {
  const now = new Date("2026-10-30T22:00:00.000Z");
  const cases = [
    [30_000, "2 unid. · queda menos de 1 min", "upcoming"],
    [119_000, "2 unid. · queda 1 min", "upcoming"],
    [3_599_000, "2 unid. · quedan 59 min", "upcoming"],
    [5_459_000, "2 unid. · queda 1 h 30 min", "upcoming"],
    [86_399_000, "2 unid. · quedan 23 h 59 min", "upcoming"],
    [86_400_000, "2 unid. · queda 1 d", "upcoming"],
    [93_599_000, "2 unid. · queda 1 d 1 h", "upcoming"],
    [0, "2 unid. · vencidas, retirar ahora", "expired"],
    [-1, "2 unid. · vencidas, retirar ahora", "expired"]
  ] as const;

  for (const [remainingMs, detail, tone] of cases) {
    const discardAt = new Date(now.getTime() + remainingMs).toISOString();
    const [row] = expiryBreakdown(shelf([lot("lot", "fresh", 2, WED_0840, undefined, discardAt)]), now);
    assert.equal(row?.detail, detail, `remaining ${remainingMs}ms`);
    assert.equal(row?.tone, tone, `remaining ${remainingMs}ms`);
  }
});

test("expiry dates use Santiago wall time across DST and show a year when it changes", () => {
  const dstRow = expiryBreakdown(
    shelf([lot("lot_dst", "fresh", 1, WED_0840, undefined, "2026-09-06T04:00:00Z")]),
    "2026-09-06T03:30:00Z"
  )[0];
  assert.equal(dstRow?.detail, "1 unid. · quedan 30 min");
  assert.equal(dstRow?.action, "Retirar dom 6 sept, 01:00");

  const yearRow = expiryBreakdown(
    shelf([lot("lot_year", "fresh", 1, WED_0840, undefined, "2027-01-01T14:00:00Z")]),
    "2026-12-31T22:00:00Z"
  )[0];
  assert.equal(yearRow?.action, "Retirar vie 1 ene 2027, 11:00");
});

test("missing or invalid snapshot time keeps tracked expiry unavailable", () => {
  const tracked = shelf([lot("lot", "fresh", 2, WED_0840, undefined, "2026-10-31T00:00:00Z")]);
  assert.equal(expiryBreakdown(tracked, null)[0]?.detail, "2 unid. · plazo no disponible");
  assert.equal(expiryBreakdown(tracked, "no-es-fecha")[0]?.detail, "2 unid. · plazo no disponible");
});

test("an increase previews one new lot dated now with the group's days", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  const preview = previewLots(shelf([lot("lot_a", "fresh", 4, WED_0840)]), 4, 12, now);
  assert.equal(preview.kind, "enter");
  if (preview.kind !== "enter") return;
  assert.equal(preview.quantity, 8);
  assert.equal(preview.freshUntil.toISOString(), "2026-10-26T12:00:00.000Z");
  assert.equal(preview.discardAt.toISOString(), "2026-10-27T12:00:00.000Z");
  assert.equal(formatLotDay(preview.freshUntil), "lun 26");
});

test("a first count of a tracked item enters as one lot", () => {
  const preview = previewLots(shelf([]), null, 6, new Date("2026-10-24T12:00:00Z"));
  assert.equal(preview.kind, "enter");
  assert.equal(preview.kind === "enter" && preview.quantity, 6);
});

test("a decrease consumes FIFO in backend order, unknown age last", () => {
  const lots = [
    lot("lot_a", "discard", 2, WED_0840),
    lot("lot_b", "fresh", 5, "2026-10-24T12:00:00Z"),
    lot("lot_u", "unknown", 3, null)
  ];
  const preview = previewLots(shelf(lots), 10, 4, new Date());
  assert.equal(preview.kind, "consume");
  if (preview.kind !== "consume") return;
  assert.deepEqual(
    preview.takes.map((take) => [take.lot.id, take.take, take.left]),
    [["lot_a", 2, 0], ["lot_b", 4, 1]]
  );
  assert.equal(preview.expiredTaken, 2);
  assert.equal(previewLots(shelf(lots), 10, 10, new Date()).kind, "none");
});

test("retire preset subtracts exactly the expired units as merma", () => {
  assert.deepEqual(retireExpiredDraft(shelf([lot("lot_a", "discard", 2, WED_0840)])), {
    mode: "subtract",
    amount: "2",
    reason: "Merma · vencido"
  });
  assert.equal(retireExpiredDraft(shelf([lot("lot_b", "fresh", 5, WED_0840)])), null);
});

test("datetime-local values round-trip in café time across daylight saving", () => {
  // Santiago is UTC-3 in October and UTC-4 in June, whatever the device zone.
  assert.equal(fromLocalInputValue("2026-10-21T08:40")?.toISOString(), WED_0840);
  assert.equal(fromLocalInputValue("2026-06-10T08:40")?.toISOString(), "2026-06-10T12:40:00.000Z");
  assert.equal(toLocalInputValue(new Date(WED_0840)), "2026-10-21T08:40");
  assert.equal(fromLocalInputValue("ayer"), null);
});
