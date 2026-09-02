import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  clp,
  commonComponents,
  formatWeekdays,
  formatWindow,
  formatWindowTime,
  hasControlledSelection,
  offerShape,
  offersCollapsible,
  OFFERS_COLLAPSE_AT,
  resolveComponents,
  summarizeVariantCount,
  summarizeWindows,
  type OfferServiceWindow,
  type PublicMenuOffer
} from "../../src/api/offer-variants";
import type { Locale } from "../../src/i18n/locale";

// The offer variant work is verified against the three backend draft payloads
// (13_companion_backend/docs/examples/public-menu-offers, commit de078ae),
// converted to public shape by scripts/build-offer-fixtures.ts. CartaBody
// imports a CSS module that node:test can't load, so — as with the origin
// pricing tests — these cover the shared decision layer that drives the UI.

function offers(locale: Locale | "es-CL"): PublicMenuOffer[] {
  return JSON.parse(
    readFileSync(`tests/menu/fixtures/public-menu-offers.${locale}.draft.json`, "utf8")
  );
}

const es = offers("es-CL");
const [oficina, once, ruta] = es;

// ----- Shape discrimination -------------------------------------------------

test("an offer with variants takes the tariff treatment", () => {
  assert.equal(offerShape(oficina), "variants");
  assert.equal(oficina.variants?.length, 9);
});

test("a legacy detail offer is untouched by the variant path", () => {
  // Shape of the live happy-hour offers: detail, no variants.
  const legacy = {
    id: "happy-hour-cervezas",
    title: "Happy Hour · Cervezas",
    description: "Pide dos de la misma cerveza…",
    detail: { items: [{ item: { id: "michelob", name: "Michelob Ultra" }, quantity: 2 }] }
  } as unknown as PublicMenuOffer;
  assert.equal(offerShape(legacy), "detail");
});

test("a legacy offer with neither detail nor variants stays a plain row", () => {
  const plain = {
    id: "cafeteria-cake-combo",
    title: "Café simple + torta del día",
    description: "CLP $6.490. Incluye café simple sin leche."
  } as unknown as PublicMenuOffer;
  assert.equal(offerShape(plain), "plain");
});

test("variants win over detail when an offer carries both", () => {
  const both = { ...oficina, detail: { items: [] } } as unknown as PublicMenuOffer;
  assert.equal(offerShape(both), "variants");
});

test("an empty variants array is not a variant offer", () => {
  assert.equal(offerShape({ ...oficina, variants: [] } as PublicMenuOffer), "plain");
});

// ----- Fixed item vs controlled selection -----------------------------------

test("a fixed item component resolves to the backend item name", () => {
  const resolved = resolveComponents(oficina.variants?.[0].components);
  assert.deepEqual(resolved[0], {
    kind: "item",
    id: "coffee",
    quantity: 2,
    name: "Americano",
    available: true
  });
});

test("a display_label component resolves as a controlled selection", () => {
  const resolved = resolveComponents(oficina.variants?.[0].components);
  assert.deepEqual(resolved[1], {
    kind: "selection",
    id: "daily-pastry",
    quantity: 2,
    label: "Selección diaria de pastelería"
  });
  assert.equal(hasControlledSelection(oficina.variants ?? []), true);
});

test("an offer of only fixed items has no controlled selection", () => {
  assert.equal(hasControlledSelection(once.variants ?? []), false);
  assert.equal(hasControlledSelection(ruta.variants ?? []), false);
});

test("a component with neither item nor display_label is dropped", () => {
  // The backend `continue`s past a menu_item_id it cannot resolve, so a variant
  // can arrive with fewer components than were authored.
  const resolved = resolveComponents([
    { id: "ghost", quantity: 1 },
    { id: "real", quantity: 2, display_label: "Selección diaria" }
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, "real");
});

test("a blank display_label is treated as absent, not printed empty", () => {
  assert.deepEqual(resolveComponents([{ id: "blank", quantity: 1, display_label: "   " }]), []);
});

// ----- Shared inclusions are an intersection, never a merge -----------------

test("only components identical across every variant are declared once", () => {
  // Once en Compañía: the croissant and pie are common; the coffee differs.
  const shared = commonComponents(once.variants ?? []);
  assert.deepEqual(
    shared.map((component) => [component.quantity, component.kind]),
    [
      [1, "item"],
      [1, "item"]
    ]
  );
  const names = shared.map((component) =>
    component.kind === "item" ? component.name : component.label
  );
  assert.deepEqual(names, ["Clásico", "Pie de Limón"]);
  // The differing coffee must NOT appear in the shared block.
  assert.ok(!names.includes("Americano"));
});

test("an offer whose variants share nothing gets no shared block", () => {
  // Oficina Deriva: both the coffee AND the pastry quantity move with party
  // size, so there is no honest shared line to print.
  assert.deepEqual(commonComponents(oficina.variants ?? []), []);
});

test("a single-variant offer treats all its components as shared", () => {
  const shared = commonComponents(ruta.variants ?? []);
  assert.deepEqual(
    shared.map((component) => [
      component.quantity,
      component.kind === "item" ? component.name : component.label
    ]),
    [
      [2, "Coffee Flight"],
      [1, "Pie de Limón"]
    ]
  );
});

// ----- Money ----------------------------------------------------------------

test("prices render in Chilean format from the backend value", () => {
  assert.equal(clp(10500), "$10.500");
  assert.equal(clp(15200), "$15.200");
  assert.equal(clp(0), "$0");
});

test("every fixture price comes straight from price_clp", () => {
  assert.deepEqual(
    oficina.variants?.map((variant) => variant.price_clp),
    [10500, 12000, 12000, 15800, 17900, 17900, 20900, 23800, 23800]
  );
  assert.equal(ruta.variants?.[0].price_clp, 15200);
});

// ----- Service windows ------------------------------------------------------

test("a contiguous run of weekdays renders as a range", () => {
  assert.equal(formatWeekdays(["monday", "tuesday", "wednesday", "thursday"], "es"), "Lun a Jue");
  assert.equal(formatWeekdays(["monday", "tuesday", "wednesday", "thursday"], "en"), "Mon to Thu");
  assert.equal(
    formatWeekdays(["monday", "tuesday", "wednesday", "thursday"], "pt-BR"),
    "Seg a Qui"
  );
});

test("a short list of weekdays renders as a list", () => {
  assert.equal(formatWeekdays(["friday", "saturday"], "es"), "Vie y Sáb");
  assert.equal(formatWeekdays(["friday", "saturday"], "en"), "Fri and Sat");
  assert.equal(formatWeekdays(["friday", "saturday"], "pt-BR"), "Sex e Sáb");
});

test("weekdays are ordered Monday-first regardless of payload order", () => {
  assert.equal(formatWeekdays(["thursday", "monday", "wednesday", "tuesday"], "es"), "Lun a Jue");
});

test("a closed window shows both ends", () => {
  const window = oficina.service_windows?.[0] as OfferServiceWindow;
  assert.equal(formatWindowTime(window, "es"), "08:00–12:00");
  assert.equal(formatWindow(window, "es"), "Lun a Jue · 08:00–12:00");
  assert.equal(formatWindow(window, "en"), "Mon to Thu · 08:00–12:00");
});

test("an open-ended window never invents a closing time", () => {
  const window = ruta.service_windows?.[0] as OfferServiceWindow;
  assert.equal(window.end_time, undefined);
  assert.equal(formatWindowTime(window, "es"), "desde 18:30");
  assert.equal(formatWindowTime(window, "en"), "from 18:30");
  assert.equal(formatWindowTime(window, "pt-BR"), "a partir das 18:30");
  // The shop's closing hour must not leak in.
  assert.ok(!formatWindow(window, "es").includes("21:00"));
});

test("two windows are summarized by count and day union, never a merged time", () => {
  const windows = ruta.service_windows as OfferServiceWindow[];
  assert.equal(windows.length, 2);
  const summary = summarizeWindows(windows, "es");
  assert.equal(summary, "2 horarios · Lun a Sáb");
  // Flattening to a single start time would claim Monday at 18:00.
  assert.ok(!summary?.includes("18:00"));
  assert.ok(!summary?.includes("18:30"));
  assert.equal(summarizeWindows(windows, "en"), "2 times · Mon to Sat");
  assert.equal(summarizeWindows(windows, "pt-BR"), "2 horários · Seg a Sáb");
});

test("a single window is summarized in full", () => {
  assert.equal(
    summarizeWindows(oficina.service_windows as OfferServiceWindow[], "es"),
    "Lun a Jue · 08:00–12:00"
  );
});

test("an offer with no service windows summarizes to nothing", () => {
  assert.equal(summarizeWindows(undefined, "es"), null);
  assert.equal(summarizeWindows([], "es"), null);
});

// ----- Counts, not prices ---------------------------------------------------

test("multi-variant offers report an option count", () => {
  assert.equal(summarizeVariantCount(oficina.variants, "es"), "9 opciones");
  assert.equal(summarizeVariantCount(oficina.variants, "en"), "9 options");
  assert.equal(summarizeVariantCount(oficina.variants, "pt-BR"), "9 opções");
  assert.equal(summarizeVariantCount(once.variants, "es"), "3 opciones");
});

test("a single-variant offer reports no count", () => {
  assert.equal(summarizeVariantCount(ruta.variants, "es"), null);
});

test("the decision layer never composes a 'from' price", () => {
  // A range label is a price claim, and price claims are backend-owned. Guard
  // against anyone re-adding a min()-based summary to this module.
  const source = readFileSync("src/api/offer-variants.ts", "utf8");
  assert.ok(
    !/Math\.(min|max)/.test(source),
    "offer-variants must not reduce prices to a minimum or maximum"
  );
  // "desde 18:30" is a TIME and is fine; "desde ${clp(…)}" would be a composed
  // price claim, which belongs to the backend's price_label.
  assert.ok(
    !/(desde|from|a partir)[^`\n]*\$\{\s*clp/i.test(source),
    "offer-variants must not compose a 'from <price>' label"
  );
});

// ----- Locale coverage ------------------------------------------------------

test("each locale gets backend copy verbatim, in that locale", () => {
  const en = offers("en");
  const pt = offers("pt-BR");
  assert.equal(oficina.title, "Oficina Deriva");
  assert.equal(en[0].title, "Deriva Office");
  assert.equal(pt[0].title, "Escritório Deriva");
  // Component items and display labels are localized by the backend too.
  assert.deepEqual(resolveComponents(en[0].variants?.[0].components)[1], {
    kind: "selection",
    id: "daily-pastry",
    quantity: 2,
    label: "Daily pastry selection"
  });
  assert.equal(
    (resolveComponents(pt[1].variants?.[0].components)[2] as { name: string }).name,
    "Torta de Limão"
  );
});

test("variant labels are backend-authored in every locale", () => {
  const en = offers("en");
  assert.deepEqual(
    en[0].variants?.slice(0, 3).map((variant) => variant.label),
    ["2× Americano", "2× Cappuccino", "2× Latte"]
  );
  assert.equal(offers("pt-BR")[2].variants?.[0].label, "Para dois");
});

// ----- Missing optional fields ----------------------------------------------

test("an offer with variants but no service windows still renders", () => {
  const noWindows = { ...oficina, service_windows: undefined } as PublicMenuOffer;
  assert.equal(offerShape(noWindows), "variants");
  assert.equal(summarizeWindows(noWindows.service_windows, "es"), null);
});

test("a variant with no components resolves to an empty inclusion list", () => {
  assert.deepEqual(resolveComponents(undefined), []);
  assert.deepEqual(commonComponents([{ id: "solo", label: "Solo", price_clp: 5000 }]), []);
});

// ----- Section-level disclosure threshold ------------------------------------

test("today's production sections stay open at the current threshold", () => {
  // Live GET /public/menu offer counts on 2026-09-01. Raising the threshold to
  // 4 is what keeps the shipped carta unchanged until the new offers publish.
  assert.equal(OFFERS_COLLAPSE_AT, 4);
  assert.equal(offersCollapsible(3), false, "cafeteria (3 legacy combos) must stay open");
  assert.equal(offersCollapsible(2), false, "cervezas-cocteles (2 happy hours) must stay open");
  assert.equal(offersCollapsible(1), false, "desayunos-weekday (1 offer) must stay open");
});

test("the plate appears once the new offers publish", () => {
  // Cafeteria gains Oficina Deriva and Ruta de Origen → 5 offers.
  assert.equal(offersCollapsible(5), true);
  assert.equal(offersCollapsible(4), true);
});
