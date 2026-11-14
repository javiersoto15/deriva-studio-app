import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IngredientSuggestions } from "../../app/(admin)/stock-cocina/_components/IngredientSuggestions";
const item = {
  id: "kitchen_a",
  name: "Tomate",
  category: "verduras" as const,
  unit: "unidades",
  package_note: "",
  quantity: "29",
  revision: 1,
  counted_at: "2026-11-14T15:52:00Z",
  updated_at: "2026-11-14T15:52:00Z",
};
test("combobox suggestions are options without nested interactive controls", () => {
  const markup = renderToStaticMarkup(
    createElement(IngredientSuggestions, {
      matches: [item],
      activeIndex: 0,
      disabled: false,
      onSelect: () => {},
    }),
  );
  assert.match(markup, /role="listbox"/);
  assert.match(markup, /role="option" aria-selected="true"/);
  assert.match(markup, /Tomate/);
  assert.doesNotMatch(markup, /<button|<a\s|tabindex/);
});
