import assert from "node:assert/strict";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/hooks";
import {
  collectAvailableAuthorCoffees,
  collectMenuPromotions,
  dailySelectionIndex,
  santiagoDateKey
} from "../../src/companion/menu-discovery";

const menu = {
  locale: "es-CL",
  name: "Carta",
  season: "actual",
  current_schedule: "weekday",
  closed_today: false,
  sections: [
    {
      id: "cafeteria",
      title: "Cafetería",
      numeral: "01",
      emphasis: "primary",
      lede: "",
      offers: [
        { id: "combo-a", title: "Combo A", description: "Descripción A" },
        { id: "combo-b", title: "Combo B", description: "Descripción B" }
      ],
      subgroups: [
        {
          id: "cafes-autor",
          label: "Café de autor",
          items: [
            { id: "author-a", name: "Autor A", description: "", available: true },
            { id: "author-sold", name: "Agotado", description: "", available: false }
          ]
        },
        {
          id: "desayunos",
          label: "Desayunos",
          items: [
            { id: "signature-breakfast", name: "Desayuno", description: "", available: true, signature: true }
          ]
        }
      ]
    },
    {
      id: "desayunos-weekday",
      title: "Desayunos",
      numeral: "02",
      emphasis: "primary",
      lede: "",
      offers: [
        { id: "combo-b", title: "Combo B duplicado", description: "No duplicar" },
        { id: "combo-c", title: "Combo C", description: "Descripción C" }
      ],
      subgroups: [
        {
          id: "cafes-autor",
          label: "Café de autor",
          items: [
            { id: "author-a", name: "Autor duplicado", description: "", available: true },
            { id: "author-b", name: "Autor B", description: "", available: true }
          ]
        }
      ]
    }
  ]
} as unknown as PublicMenuView;

test("author discovery reads only available items in cafes-autor and deduplicates ids", () => {
  assert.deepEqual(
    collectAvailableAuthorCoffees(menu).map((item) => item.id),
    ["author-a", "author-b"]
  );
});

test("current promotions keep section context and deduplicate offer ids", () => {
  assert.deepEqual(
    collectMenuPromotions(menu).map(({ sectionId, offer }) => [sectionId, offer.id]),
    [
      ["cafeteria", "combo-a"],
      ["cafeteria", "combo-b"],
      ["desayunos-weekday", "combo-c"]
    ]
  );
});

test("daily selection is stable for a Santiago date and salted by content type", () => {
  assert.equal(dailySelectionIndex(7, "2026-10-14", "author"), dailySelectionIndex(7, "2026-10-14", "author"));
  assert.ok((dailySelectionIndex(7, "2026-10-14", "promotion") ?? -1) >= 0);
  assert.equal(dailySelectionIndex(0, "2026-10-14", "promotion"), null);
});

test("Santiago date follows the cafe calendar across UTC midnight", () => {
  assert.equal(santiagoDateKey(new Date("2026-10-14T02:30:00.000Z")), "2026-10-13");
});
