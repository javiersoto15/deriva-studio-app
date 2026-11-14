import assert from "node:assert/strict";
import test from "node:test";
import {
  readPending,
  writePending,
  clearPending,
  recoveryDecision,
} from "../../src/salon-stock/pending";
const storage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
};
const change = {
  kind: "withdrawal" as const,
  payload: {
    location: "storage" as const,
    item_id: "salon_a",
    taker: "Benja",
    amount: "0.125",
    expected_revision: 3,
    request_id: "immutable-id",
    reason: "",
  },
};
test("pending withdrawal survives same-user reload with exact person/location/item/amount/UUID and no kitchen leakage", () => {
  const s = storage();
  writePending(s, "a", change);
  assert.deepEqual(readPending(s, "a"), change);
  assert.equal(readPending(s, "b"), null);
  assert.equal(s.getItem("deriva:kitchen-stock:pending:a"), null);
  clearPending(s, "a");
  assert.equal(readPending(s, "a"), null);
});
test("invalid restored withdrawal never targets fridge or arbitrary text", () => {
  const s = storage();
  for (const payload of [
    { ...change.payload, location: "fridge" },
    { ...change.payload, item_id: "free text" },
    { ...change.payload, amount: "0" },
    { ...change.payload, amount: "1e3" },
  ]) {
    s.setItem(
      "deriva:salon-stock:pending:a",
      JSON.stringify({ kind: "withdrawal", payload }),
    );
    assert.equal(readPending(s, "a"), null);
  }
});
test("uncertain authentication retries retain original operation; replay-checked current-item conflicts release for review", () => {
  assert.equal(
    recoveryDecision(true, { status: 401, ambiguous: false }).keepRequest,
    true,
  );
  assert.equal(
    recoveryDecision(true, { status: 403, ambiguous: false }).reauthenticate,
    true,
  );
  for (const code of [
    "revision_conflict",
    "duplicate_item",
    "insufficient_stock",
  ])
    assert.equal(
      recoveryDecision(true, {
        status: 409,
        code,
        ambiguous: false,
        validItem: true,
      }).keepRequest,
      false,
    );
  assert.equal(
    recoveryDecision(true, {
      status: 409,
      code: "request_conflict",
      ambiguous: false,
      validItem: true,
    }).keepRequest,
    true,
  );
  assert.equal(
    recoveryDecision(true, {
      status: 409,
      code: "revision_conflict",
      ambiguous: false,
      validItem: false,
    }).keepRequest,
    true,
  );
});
test("restored withdrawals reject a name outside the exact requested taker roster", () => {
  const s = storage();
  s.setItem(
    "deriva:salon-stock:pending:a",
    JSON.stringify({
      ...change,
      payload: { ...change.payload, taker: "Someone else" },
    }),
  );
  assert.equal(readPending(s, "a"), null);
});
