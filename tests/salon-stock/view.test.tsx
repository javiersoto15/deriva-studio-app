import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SalonWorkspace } from "../../app/(admin)/stock-salon/_components/SalonWorkspace";
import {
  WithdrawalEditor,
  CountEditor,
} from "../../app/(admin)/stock-salon/_components/SalonEditors";
import {
  EXPECTED_WITHDRAWAL_TAKERS,
  type SalonItem,
  type Snapshot,
  type Location,
} from "../../src/salon-stock/types";
const item = (location: Location): SalonItem => ({
  id: "salon_" + location,
  name: "Coca-cola normal",
  location,
  category: "bebidas",
  category_label: "Bebidas",
  category_is_inferred: false,
  quantity: "5",
  unit: null,
  package_note: "",
  source_markers: [],
  source_notes: [],
  source_line: "5 Coca-cola normal",
  source_row_id: "test",
  source_section: "BEBIDAS",
  observation: {
    observed_at: null,
    date: null,
    period: null,
    precision: "unknown",
    source: null,
  },
  revision: 1,
  updated_at: "2026-11-14T18:00:00Z",
});
const snapshot: Snapshot = {
  items: [item("storage"), item("fridge"), item("cleaning")],
  now: "2026-11-14T18:00:00Z",
  withdrawal_takers: [...EXPECTED_WITHDRAWAL_TAKERS],
};
test("Registrar retiro is one global location action, absent for fridge and never repeated per row", () => {
  const storage = renderToStaticMarkup(
    createElement(SalonWorkspace, {
      initialSnapshot: snapshot,
      initialLocation: "storage",
    }),
  );
  assert.equal((storage.match(/>Registrar retiro</g) ?? []).length, 1);
  const fridge = renderToStaticMarkup(
    createElement(SalonWorkspace, {
      initialSnapshot: snapshot,
      initialLocation: "fridge",
    }),
  );
  assert.ok(!fridge.includes(">Registrar retiro<"));
  assert.ok(!storage.includes("base de conteo sin unidad indicada"));
});
test("withdrawal form offers exact server names, no fridge, positive explicitly selected item before confirm", () => {
  const base = {
    draft: {
      location: "storage" as const,
      itemId: "",
      query: "Coca-cola normal",
      taker: "Benja",
      amount: "1",
      reason: "",
    },
    snapshot,
    locked: false,
    onChange: () => {},
    onSubmit: () => {},
  };
  const unselected = renderToStaticMarkup(
    createElement(WithdrawalEditor, base),
  );
  assert.match(unselected, /disabled="">Confirmar retiro/);
  assert.ok(!unselected.includes('value="fridge"'));
  const takerSelect = unselected.match(
    /<select id="withdraw-taker"[^>]*>([\s\S]*?)<\/select>/,
  )![1];
  for (const name of snapshot.withdrawal_takers)
    assert.ok(takerSelect.includes(`value="${name}"`));
  assert.equal((takerSelect.match(/<option/g) ?? []).length, 11);
  const selected = renderToStaticMarkup(
    createElement(WithdrawalEditor, {
      ...base,
      draft: { ...base.draft, itemId: "salon_storage" },
    }),
  );
  assert.ok(selected.includes("Disponible:"));
  assert.ok(!selected.includes("withdraw-reason"));
  assert.ok(!selected.includes("base de conteo sin unidad indicada"));
  assert.match(selected, />Confirmar retiro</);
});
test("storage/cleaning count editor cannot bypass attribution with a Restar control and requires correction reason", () => {
  for (const location of ["storage", "cleaning"] as const) {
    const html = renderToStaticMarkup(
      createElement(CountEditor, {
        item: item(location),
        draft: { mode: "set", amount: "4", reason: "" },
        locked: false,
        onChange: () => {},
        onSubmit: () => {},
        onHistory: () => {},
      }),
    );
    assert.ok(!html.includes(">Restar conteo<"));
    assert.match(html, /id="salon-adjust-reason"[^>]*required=""/);
    assert.match(html, /disabled="">Guardar conteo/);
  }
});
