import assert from "node:assert/strict";
import test from "node:test";

import {
  FIESTAS_PATRIAS_WINDOW,
  isFiestasPatriasWindow
} from "../../src/lib/fiestas-patrias";

// Window is Santiago-local calendar days, inclusive on both ends.
test("window is 2026-09-07 → 2026-09-19", () => {
  assert.equal(FIESTAS_PATRIAS_WINDOW.start, "2026-09-07");
  assert.equal(FIESTAS_PATRIAS_WINDOW.end, "2026-09-19");
});

test("inside the window", () => {
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-07T12:00:00-03:00")), true);
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-18T20:00:00-03:00")), true);
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-19T23:59:00-03:00")), true);
});

test("outside the window", () => {
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-06T23:59:00-03:00")), false);
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-20T00:01:00-03:00")), false);
  assert.equal(isFiestasPatriasWindow(new Date("2027-09-18T12:00:00-03:00")), false);
});

test("boundaries resolve in America/Santiago, not UTC", () => {
  // 2026-09-20 01:00 UTC is still 2026-09-19 22:00 in Santiago (UTC-3) → inside.
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-20T01:00:00Z")), true);
  // 2026-09-07 02:00 UTC is 2026-09-06 23:00 in Santiago → outside.
  assert.equal(isFiestasPatriasWindow(new Date("2026-09-07T02:00:00Z")), false);
});
