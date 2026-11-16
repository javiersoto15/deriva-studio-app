import test from "node:test";
import assert from "node:assert/strict";
import {
  savePending,
  readPending,
  clearPending,
} from "../../src/bean-stock/pending";
const storage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
};
const op = {
  kind: "count" as const,
  beanId: "bean_" + "a".repeat(32),
  payload: {
    mode: "delta" as const,
    quantity_kg: "-0.125",
    expected_revision: 3,
    request_id: "immutable-id",
    reason: "Uso",
  },
};
test("pending count survives reload under the same UID only and clears explicitly", () => {
  const s = storage();
  savePending("a", op, s);
  assert.deepEqual(readPending("a", s), op);
  assert.equal(readPending("b", s), null);
  clearPending("b", s);
  assert.deepEqual(readPending("a", s), op);
  clearPending("a", s);
  assert.equal(readPending("a", s), null);
});
test("links retain exact expected and replacement sets", () => {
  const s = storage(),
    v = {
      kind: "links" as const,
      beanId: op.beanId,
      payload: {
        menu_item_ids: ["m2"],
        expected_menu_item_ids: ["m1"],
        request_id: "links-id",
      },
    };
  savePending("a", v, s);
  assert.deepEqual(readPending("a", s), v);
});
test("corrupt persisted requests cannot be replayed", () => {
  for (const payload of [
    { ...op.payload, quantity_kg: "-1e3" },
    { ...op.payload, expected_revision: -1 },
    { ...op.payload, request_id: "" },
    { ...op.payload, actor_id: "injected" },
  ]) {
    const s = storage();
    s.setItem(
      "deriva:bean-stock:pending:a",
      JSON.stringify({ ...op, payload }),
    );
    assert.equal(readPending("a", s), null);
  }
});
test("storage failures block saving and malformed links are not recoverable", () => {
  const blocked = {
    getItem: () => null,
    setItem: () => {
      throw Error("Storage blocked");
    },
    removeItem: () => {},
  };
  assert.throws(() => savePending("a", op, blocked));
  const s = storage();
  s.setItem(
    "deriva:bean-stock:pending:a",
    JSON.stringify({
      kind: "links",
      beanId: op.beanId,
      payload: {
        request_id: "r",
        menu_item_ids: ["m", "m"],
        expected_menu_item_ids: [],
      },
    }),
  );
  assert.equal(readPending("a", s), null);
});
