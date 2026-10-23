import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveStartHere,
  START_HERE_MAX
} from "../../app/(landing)/menu/_components/start-here";

// "Recomendados de la barra" — the first-visitor photo grid on /menu (Paper alt B,
// founder pick 2026-10-05: every route carries a photo). The backend owns
// which routes exist, their order, intent labels, reasons and status (the draft
// `start_here` contract, docs/superpowers/specs/2026-09-28-start-here-design.md).
// The frontend only joins each route to the real item for name / price / photo
// and decides where the link lands. Fixture = trimmed live es-CL payload + the
// draft field, until the backend ships it.

const menu = JSON.parse(
  readFileSync("tests/menu/fixtures/public-menu-start-here.es-CL.draft.json", "utf8")
);

function clone() {
  return JSON.parse(JSON.stringify(menu));
}

test("routes join to live items in backend order", () => {
  const routes = resolveStartHere(menu);
  assert.deepEqual(
    routes.map((r) => r.item.name),
    ["Espresso Tropical", "Brunch Deriva Studio", "Pie de Frambuesa", "Once Deriva"]
  );
  // Price comes from the item, never from the route.
  assert.equal(routes[0].item.price_clp, 5190);
  assert.equal(routes[0].intentLabel, "Tu primer café de autor");
  assert.equal(routes[0].reason, "Frío y frutal: la puerta más amable a la barra.");
});

test("every route links to its item anchor, never a cart", () => {
  const routes = resolveStartHere(menu);
  assert.deepEqual(
    routes.map((r) => r.href),
    ["#item-decaf-filter", "#item-brunch", "#item-pie-frambuesa", "#item-once-deriva"]
  );
});

test("backend status + label render verbatim", () => {
  const routes = resolveStartHere(menu);
  assert.equal(routes[3].status, "later");
  assert.equal(routes[3].statusLabel, "Desde las 17:00");
});

test("plain availability carries no label — only exceptions are shown", () => {
  const routes = resolveStartHere(menu);
  assert.equal(routes[0].status, "available");
  assert.equal(routes[0].statusLabel, undefined);
  assert.equal(routes[1].statusLabel, "Hasta las 12:00");
});

test("every route has a photo; a route whose item has none is dropped", () => {
  assert.ok(resolveStartHere(menu).every((r) => typeof r.photo === "string" && r.photo.length > 0));
  const m = clone();
  delete m.sections
    .find((s: { id: string }) => s.id === "onces")
    .items.find((i: { id: string }) => i.id === "once-deriva").image_url;
  assert.deepEqual(
    resolveStartHere(m).map((r) => r.item.id),
    ["decaf-filter", "brunch", "pie-frambuesa"]
  );
});

test("a sold-out item stays a link but reads unavailable", () => {
  const m = clone();
  const pie = m.sections
    .find((s: { id: string }) => s.id === "pasteleria")
    .subgroups[0].items.find((i: { id: string }) => i.id === "pie-frambuesa");
  pie.available = false;
  // Route status still says "available" (stale) — the item's own flag wins.
  const route = resolveStartHere(m)[2];
  assert.equal(route.status, "unavailable");
  // The stale "Disponible" must not leak through; the UI falls back to the
  // localized "Agotado hoy".
  assert.equal(route.statusLabel, undefined);
  assert.equal(route.href, "#item-pie-frambuesa");
});

test("a route whose item the schedule excluded is dropped", () => {
  const m = clone();
  m.sections = m.sections.filter((s: { id: string }) => s.id !== "desayunos-weekday");
  assert.deepEqual(
    resolveStartHere(m).map((r) => r.item.id),
    ["decaf-filter", "pie-frambuesa", "once-deriva"]
  );
});

test("no field, empty field, or nothing resolvable → module hidden", () => {
  const m = clone();
  delete m.start_here;
  assert.deepEqual(resolveStartHere(m), []);
  m.start_here = [];
  assert.deepEqual(resolveStartHere(m), []);
  m.start_here = [{ ...menu.start_here[0], item_id: "no-existe" }];
  assert.deepEqual(resolveStartHere(m), []);
});

test("never more than four routes", () => {
  const m = clone();
  m.start_here = [...menu.start_here, { ...menu.start_here[0], id: "extra" }];
  assert.equal(resolveStartHere(m).length, START_HERE_MAX);
  assert.equal(START_HERE_MAX, 4);
});
