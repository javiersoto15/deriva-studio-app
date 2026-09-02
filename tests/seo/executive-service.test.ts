import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExecutiveMenuPresentation,
  EXECUTIVE_MENU_STABLE_HOURS
} from "../../src/seo/executive-menu";
import {
  resolveExecutiveService,
  santiagoClock
} from "../../src/seo/executive-service";

// All instants below are written in UTC and asserted against America/Santiago.
// 2026-09-02 is BEFORE Chile's DST switch (UTC-4); 2026-09-09 is AFTER it
// (UTC-3). Both weeks are exercised so a hardcoded offset can never pass.
const at = (iso: string) => new Date(iso);

test("reads the Santiago wall clock across the DST boundary", () => {
  // Standard time: UTC-4.
  assert.deepEqual(santiagoClock(at("2026-09-02T17:00:00Z")), {
    weekday: 3,
    minutes: 13 * 60
  });
  // Summer time: UTC-3.
  assert.deepEqual(santiagoClock(at("2026-09-09T16:00:00Z")), {
    weekday: 3,
    minutes: 13 * 60
  });
});

test("weekday before 13:00 says today's service starts at 13:00", () => {
  const service = resolveExecutiveService(at("2026-09-02T14:30:00Z")); // 10:30
  assert.equal(service.status, "before");
  assert.equal(service.servingNow, false);
  assert.equal(service.serviceDay, true);
  assert.match(service.note, /comienza a las 13:00/);
  assert.doesNotMatch(service.note, /ahora/i);
});

test("weekday inside 13:00–16:00 is available now", () => {
  for (const iso of [
    "2026-09-02T17:00:00Z", // 13:00 exactly, UTC-4
    "2026-09-02T18:20:00Z", // 14:20
    "2026-09-02T20:00:00Z", // 16:00 exactly
    "2026-09-09T18:00:00Z" // 15:00, UTC-3 week
  ]) {
    const service = resolveExecutiveService(at(iso));
    assert.equal(service.status, "now", iso);
    assert.equal(service.servingNow, true, iso);
    assert.equal(service.badge, "Disponible ahora", iso);
  }
});

test("weekday after 16:00 says today's service has finished", () => {
  const service = resolveExecutiveService(at("2026-09-02T20:01:00Z")); // 16:01
  assert.equal(service.status, "after");
  assert.equal(service.servingNow, false);
  assert.match(service.note, /ya terminó/);
});

test("Saturday and Sunday say it returns on the next business day", () => {
  const saturday = resolveExecutiveService(at("2026-09-05T18:00:00Z"));
  const sunday = resolveExecutiveService(at("2026-09-06T18:00:00Z"));

  for (const service of [saturday, sunday]) {
    assert.equal(service.status, "weekend");
    assert.equal(service.servingNow, false);
    assert.equal(service.serviceDay, false);
    assert.match(service.note, /lunes a viernes/);
    assert.match(service.note, /próximo día hábil/);
  }
});

test("never claims availability outside the weekday service window", () => {
  // Sweep every half hour across a full week; servingNow must be true only
  // inside Mon–Fri 13:00–16:00 Santiago time.
  const start = Date.UTC(2026, 8, 2, 0, 0, 0);
  for (let i = 0; i < 7 * 48; i += 1) {
    const now = new Date(start + i * 30 * 60 * 1000);
    const { weekday, minutes } = santiagoClock(now);
    const expected =
      weekday >= 1 && weekday <= 5 && minutes >= 780 && minutes <= 960;
    assert.equal(
      resolveExecutiveService(now).servingNow,
      expected,
      now.toISOString()
    );
  }
});

test("the presentation carries the service state in both edition states", () => {
  const offHours = at("2026-09-02T23:00:00Z"); // 19:00 Wed — after service
  const fallback = buildExecutiveMenuPresentation(null, offHours);

  assert.equal(fallback.availableToday, false);
  assert.equal(fallback.service.status, "after");
  assert.equal(fallback.service.servingNow, false);
  assert.equal(fallback.hours, EXECUTIVE_MENU_STABLE_HOURS);

  // A published edition still renders after service closes — but it must say
  // the service is over rather than implying it is on right now.
  const published = buildExecutiveMenuPresentation(
    {
      price_clp: 10990,
      price_label: "CLP $10.990",
      hours: "13:00 - 16:00",
      hero: "La ronda del mediodía.",
      subline: "Cuatro momentos. Una cuenta.",
      date_label: "HOY · MIÉ 2 SEPT",
      courses: [{ id: "bebida", numeral: "i", tag: "de la barra", name: "Una bebida" }]
    },
    offHours
  );

  assert.equal(published.availableToday, true);
  assert.equal(published.service.status, "after");
  assert.equal(published.service.servingNow, false);
  assert.equal(published.priceLabel, "CLP $10.990");
});

test("never says 'disponible ahora' when no edition is published", () => {
  // Inside the window, but nothing published: the window being open is not a
  // claim that there is something to buy.
  const inWindow = at("2026-09-02T18:20:00Z"); // 14:20 Wed
  const fallback = buildExecutiveMenuPresentation(null, inWindow);

  assert.equal(fallback.availableToday, false);
  assert.equal(fallback.service.servingNow, false);
  assert.equal(fallback.service.badge, "Sin edición publicada");
  assert.doesNotMatch(fallback.service.badge, /disponible/i);
  assert.match(fallback.service.note, /todavía no está publicada/);

  // Outside the window the honest schedule copy is unchanged.
  for (const iso of [
    "2026-09-02T14:00:00Z", // 10:00 Wed — before
    "2026-09-02T23:00:00Z", // 19:00 Wed — after
    "2026-09-05T18:00:00Z" // Saturday
  ]) {
    const service = buildExecutiveMenuPresentation(null, at(iso)).service;
    assert.equal(service.servingNow, false, iso);
    // Outside the window the badge/note come straight from the clock layer.
    assert.deepEqual(service, resolveExecutiveService(at(iso)), iso);
    assert.doesNotMatch(service.badge, /disponible/i, iso);
  }
});
