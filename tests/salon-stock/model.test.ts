import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareWithdrawal,
  findMatches,
  adjustmentModes,
  formatObservation,
  formatShare,
  normalizeSnapshot,
  normalizeMovementPage,
} from "../../src/salon-stock/model";
import type { SalonItem, Snapshot } from "../../src/salon-stock/types";
export const takers = [
  "Benja",
  "Mari",
  "Nacha",
  "Luis",
  "Cristobal",
  "Marvin",
  "Nadia",
  "Cony",
  "Macarena",
  "Paulina",
];
const item = (
  id: string,
  location: SalonItem["location"] = "storage",
  quantity: string | null = "2.5",
): SalonItem => ({
  id,
  name: "Coca-cola normal",
  location,
  category: "bebidas",
  category_label: "Bebidas",
  category_is_inferred: false,
  unit: null,
  package_note: "",
  source_markers: [],
  source_notes: [],
  source_line: "",
  source_row_id: "",
  source_section: null,
  observation: {
    observed_at: null,
    date: location === "storage" ? "2026-11-14" : null,
    period: location === "storage" ? "morning" : null,
    precision: location === "storage" ? "date_and_period" : "unknown",
    source: location === "storage" ? "14/11 am" : null,
  },
  quantity,
  revision: quantity === null ? 0 : 1,
  updated_at: "2026-11-14T18:00:00Z",
});
test("withdrawal needs an explicitly selected item and exact server-owned taker in the chosen eligible location", () => {
  const items = [item("salon_storage"), item("salon_fridge", "fridge")];
  const base = {
    items,
    location: "storage" as const,
    itemId: "salon_storage",
    taker: "Benja",
    amount: "0,125",
    takers,
  };
  assert.deepEqual(prepareWithdrawal(base), {
    item: items[0],
    amount: "0.125",
    after: "2.375",
  });
  for (const invalid of [
    { ...base, itemId: "" },
    { ...base, itemId: "salon_fridge" },
    { ...base, location: "fridge" },
    { ...base, taker: "benja" },
    { ...base, amount: "0" },
    { ...base, amount: "-1" },
    { ...base, amount: "3" },
    { ...base, items: [item("salon_storage", "storage", null)] },
  ])
    assert.equal(prepareWithdrawal(invalid), null);
});
test("duplicate suggestions are location-scoped; variants and locations never share balances", () => {
  const items = [
    item("a", "fridge"),
    item("b", "storage"),
    { ...item("c"), name: "Coca-cola zero" },
  ];
  assert.deepEqual(
    findMatches(items, "storage", " COCA-CÓLA  normal ").map((x) => x.id),
    ["b"],
  );
  assert.ok(
    findMatches(items, "storage", "coca-cola").some((x) => x.id === "c"),
  );
  assert.deepEqual(adjustmentModes("storage"), ["add", "set"]);
  assert.deepEqual(adjustmentModes("cleaning"), ["add", "set"]);
  assert.ok(adjustmentModes("fridge").includes("subtract"));
});
test("unknown and morning observations never acquire invented exact times", () => {
  assert.equal(
    formatObservation(item("f", "fridge").observation),
    "Fecha de conteo no informada",
  );
  assert.equal(
    formatObservation(item("s").observation),
    "14/11/2026 · mañana (sin hora exacta)",
  );
});
test("share uses the complete supplied saved snapshot, locations, zeros, package conditions and original precision", () => {
  const fridge = item("f", "fridge", "0");
  const cleaning = {
    ...item("c", "cleaning", "1"),
    name: "Pack gorro clip",
    unit: "pack",
    package_note: "100 unidades por pack",
  };
  const source: Snapshot = {
    items: [fridge, item("s"), cleaning],
    now: "2026-11-15T12:00:00Z",
    withdrawal_takers: takers,
  };
  const text = formatShare(source);
  assert.match(text, /REFRIGERADOR/);
  assert.match(text, /BODEGA/);
  assert.match(text, /LIMPIEZA/);
  assert.match(text, /Coca-cola normal: 0/);
  assert.match(text, /Pack gorro clip: 1 pack \(100 unidades por pack\)/);
  assert.match(text, /mañana \(sin hora exacta\)/);
  assert.match(text, /Fecha de conteo no informada/);
  assert.match(text, /Consultado/);
});
test("invalid contracts fail closed, including untrusted taker lists and broken history pagination", () => {
  const good = {
    items: [item("salon_s")],
    now: "2026-11-14T18:00:00Z",
    withdrawal_takers: takers,
  };
  assert.equal(normalizeSnapshot(good).items.length, 1);
  assert.throws(() =>
    normalizeSnapshot({ ...good, withdrawal_takers: ["not-the-roster"] }),
  );
  assert.throws(() =>
    normalizeSnapshot({ ...good, items: [{ ...item("s"), quantity: "NaN" }] }),
  );
  assert.throws(() =>
    normalizeMovementPage(
      { entries: [], has_more: true, next_before_sequence: null },
      "withdrawals",
    ),
  );
});
test("staff copy includes actual conditions and excludes reconciliation instructions", () => {
  const row = {
    ...item("salon_alcohol", "cleaning", "1"),
    name: "Alcohol 5 L",
    unit: "unidad",
    package_note: "5 L; abierto; queda poquísimo",
    source_notes: [
      "Abierto, queda poquísimo.",
      "Unidad no explícita; queda null. No inferir lata ni botella.",
      "No convertir a 52.5 L.",
      "Categoría propuesta; source_section preservado.",
    ],
  };
  const text = formatShare({
    items: [row],
    now: "2026-11-14T18:00:00Z",
    withdrawal_takers: takers,
  });
  assert.match(text, /queda poquísimo/);
  for (const phrase of ["null", "No inferir", "52.5", "source_section"])
    assert.ok(!text.includes(phrase));
});
