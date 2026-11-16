import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BeanList,
  BeanCountForm,
} from "../../app/(admin)/stock/_components/BeanView";
const item = {
  id: "bean_" + "a".repeat(32),
  name: "House Blend",
  origin_id: "house",
  tier: "regular" as const,
  unit: "kg" as const,
  quantity_kg: null,
  revision: 0,
  updated_at: "2026-11-16T12:00:00Z",
};
test("bean rows preserve unknown versus zero and configured versus reference-only menu links", () => {
  const html = renderToStaticMarkup(
    createElement(BeanList, {
      items: [
        item,
        {
          ...item,
          id: "bean_" + "b".repeat(32),
          name: "Brazil",
          quantity_kg: "0",
          origin_id: "brazil",
        },
      ],
      menuItems: [
        {
          id: "pourover",
          name: "Pour Over",
          available: true,
          origin_ids: ["house"],
        },
      ],
      links: [
        { bean_id: item.id, menu_item_id: "pourover" },
        { bean_id: "bean_" + "b".repeat(32), menu_item_id: "pourover" },
      ],
      locked: false,
      onOpen: () => {},
    }),
  );
  assert.match(html, /Sin contar/);
  assert.match(html, />0<\/span>/);
  assert.match(html, /Por configurar/);
  assert.match(html, /Configurado/);
});
test("decimal count form accepts keyboard decimals and disables unknown add/subtract", () => {
  const html = renderToStaticMarkup(
    createElement(BeanCountForm, {
      item,
      mode: "set",
      amount: "0,250",
      reason: "",
      locked: false,
      onChange: () => {},
      onSave: () => {},
    }),
  );
  assert.match(html, /inputMode="decimal"/);
  assert.match(html, /250 g/);
  assert.match(html, /disabled=""[^>]*>Sumar/);
  assert.match(html, /Sin contar/);
});
