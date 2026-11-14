import assert from "node:assert/strict";
import test from "node:test";
import {
  readPending,
  writePending,
  clearPending,
} from "../../src/kitchen-stock/pending";
const store = () => {
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
  kind: "adjust" as const,
  id: "kitchen_123",
  payload: {
    mode: "add" as const,
    amount: "0.5",
    expected_revision: 2,
    request_id: "same-request",
    reason: "Pedido",
  },
};
test("unresolved requests survive refresh, retain original ID and remain scoped to the same uid", () => {
  const s = store();
  writePending(s, "staff-a", change);
  assert.deepEqual(readPending(s, "staff-a"), change);
  assert.equal(readPending(s, "staff-b"), null);
  clearPending(s, "staff-a");
  assert.equal(readPending(s, "staff-a"), null);
});
test("malformed persisted requests cannot become a mutation", () => {
  const s = store();
  writePending(s, "a", change);
  s.setItem(
    "deriva:kitchen-stock:pending:a",
    JSON.stringify({
      ...change,
      payload: { ...change.payload, amount: "NaN" },
    }),
  );
  assert.equal(readPending(s, "a"), null);
});
import { mutationRecovery } from "../../src/kitchen-stock/pending";
test("an auth rejection of a replay does not prove the original request failed", () => {
  assert.deepEqual(mutationRecovery(true, { status: 401, ambiguous: false }), {
    keepRequest: true,
    reauthenticate: true,
  });
  assert.deepEqual(mutationRecovery(true, { status: 403, ambiguous: false }), {
    keepRequest: true,
    reauthenticate: true,
  });
  assert.deepEqual(mutationRecovery(true, { status: 409, ambiguous: false }), {
    keepRequest: true,
    reauthenticate: false,
  });
  assert.deepEqual(mutationRecovery(false, { status: 400, ambiguous: false }), {
    keepRequest: false,
    reauthenticate: false,
  });
  assert.deepEqual(mutationRecovery(false, { status: null, ambiguous: true }), {
    keepRequest: true,
    reauthenticate: false,
  });
});
test("a replay-checked domain conflict with a valid current item resolves a never-committed request", () => {
  for (const code of ["revision_conflict", "duplicate_ingredient"])
    assert.deepEqual(
      mutationRecovery(true, {
        status: 409,
        ambiguous: false,
        code,
        validItem: true,
      }),
      { keepRequest: false, reauthenticate: false },
    );
  for (const failure of [
    {
      status: 409,
      ambiguous: false,
      code: "revision_conflict",
      validItem: false,
    },
    {
      status: 409,
      ambiguous: false,
      code: "request_conflict",
      validItem: true,
    },
    { status: 409, ambiguous: false, code: "unknown", validItem: true },
  ])
    assert.equal(mutationRecovery(true, failure).keepRequest, true);
});
