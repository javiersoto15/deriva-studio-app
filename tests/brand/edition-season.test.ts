import assert from "node:assert/strict";
import test from "node:test";

import {
  getEditionMark,
  getEditionMarkUppercase,
  getEditionParts,
  getSeason,
  getSeasonLabel
} from "../../src/lib/edition";

// Southern-hemisphere astronomical seasons on the Santiago calendar.
test("season boundaries follow equinoxes and solstices", () => {
  assert.equal(getSeason(new Date("2026-03-19T12:00:00-03:00")), "verano");
  assert.equal(getSeason(new Date("2026-03-20T12:00:00-03:00")), "otono");
  assert.equal(getSeason(new Date("2026-06-20T12:00:00-04:00")), "otono");
  assert.equal(getSeason(new Date("2026-06-21T12:00:00-04:00")), "invierno");
  assert.equal(getSeason(new Date("2026-09-21T12:00:00-03:00")), "invierno");
  assert.equal(getSeason(new Date("2026-09-22T12:00:00-03:00")), "primavera");
  assert.equal(getSeason(new Date("2026-12-20T12:00:00-03:00")), "primavera");
  assert.equal(getSeason(new Date("2026-12-21T12:00:00-03:00")), "verano");
  assert.equal(getSeason(new Date("2027-01-15T12:00:00-03:00")), "verano");
});

test("uses the Santiago day, not UTC", () => {
  // 23:30 Sept 21 in Santiago is already Sept 22 in UTC.
  assert.equal(getSeason(new Date("2026-09-21T23:30:00-03:00")), "invierno");
});

test("labels are localized and carry the year", () => {
  const oct = new Date("2026-10-22T12:00:00-03:00");
  assert.equal(getSeasonLabel(oct, "es-CL"), "Primavera 2026");
  assert.equal(getSeasonLabel(oct, "en"), "Spring 2026");
  assert.equal(getSeasonLabel(oct, "pt-BR"), "Primavera 2026");
  assert.equal(getSeasonLabel(new Date("2026-07-01T12:00:00-04:00"), "pt-BR"), "Inverno 2026");
});

test("edition marks render the live season and Roman year", () => {
  const oct = new Date("2026-10-22T12:00:00-03:00");
  assert.equal(getEditionMark(oct), "Vol. 001 · Primavera · № 43");
  assert.equal(getEditionMarkUppercase(oct), "VOL. 001 · PRIMAVERA MMXXVI · № 43");
  assert.equal(getEditionParts(oct).seasonAndYear, "Primavera MMXXVI");
  assert.match(getEditionMarkUppercase(new Date("2027-01-10T12:00:00-03:00")), /VERANO MMXXVII/);
});
