import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicMenuView } from "../../src/api/server";
import {
  HIGHLIGHT_CANDIDATES,
  LANDING_CHIP_COUNT,
  selectLandingCoffeeHighlights
} from "../../src/seo/landing-coffee-highlights";
import { derivaPhotos } from "../../src/data/photos";

function publicMenu(items: Array<{
  id: string;
  name: string;
  description: string;
  price_clp?: number;
  price_label?: string;
  available: boolean;
}>): PublicMenuView {
  return {
    name: "Carta Deriva Coffee Studio",
    season: "Invierno 2026",
    closed_today: false,
    current_schedule: "weekday",
    closed_label: "",
    sections: [
      {
        id: "cafeteria",
        title: "Cafetería",
        lede: "Café de especialidad.",
        items: [],
        subgroups: [{ id: "espresso", items }]
      }
    ]
  } as unknown as PublicMenuView;
}

const visibleItems = [
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso y leche texturizada.",
    price_label: "$3.200",
    available: true
  },
  {
    id: "latte",
    name: "Latte",
    description: "Espresso con leche.",
    price_clp: 3500,
    available: true
  },
  {
    id: "pourover",
    name: "Pour Over",
    description: "Preparación manual en V60 o Chemex.",
    price_clp: 4290,
    available: true
  },
  {
    id: "decaf-filter",
    name: "Espresso Tropical",
    description: "Maracuyá, tónica y espresso Etiopía.",
    price_clp: 5190,
    available: true
  },
  {
    id: "capuccino-mediterraneo",
    name: "Cappuccino Mediterráneo",
    description: "Cappuccino de autor.",
    price_clp: 5490,
    available: true
  },
  {
    id: "bosque-valdiviano",
    name: "Bosque Valdiviano",
    description: "Café de autor del sur.",
    price_clp: 5490,
    available: true
  },
  {
    id: "espresso-rose",
    name: "Espresso Rose",
    description: "Reserva con fotografía propia.",
    price_clp: 5490,
    available: true
  },
  {
    id: "espresso",
    name: "Espresso",
    description: "Sin fotografía — no debe aparecer en la tira.",
    price_clp: 2000,
    available: true
  },
  {
    id: "tiramisu",
    name: "Tiramisú",
    description: "Producto fuera del foco público.",
    price_clp: 7000,
    available: true
  }
];

test("selects current public coffee highlights in a stable order", () => {
  const chips = selectLandingCoffeeHighlights(publicMenu(visibleItems));

  assert.deepEqual(
    chips.map((chip) => chip.slug),
    [
      "cappuccino",
      "latte",
      "pourover",
      "decaf-filter",
      "capuccino-mediterraneo",
      "bosque-valdiviano"
    ]
  );
  assert.deepEqual(
    chips.map((chip) => chip.price),
    ["$3.200", "$3.500", "$4.290", "$5.190", "$5.490", "$5.490"]
  );
  assert.equal(chips.some((chip) => chip.name === "Tiramisú"), false);
  // `espresso` is live and available but has no photography, so it must not be
  // featured — a photo-less chip renders as a bare text placeholder.
  assert.equal(chips.some((chip) => chip.slug === "espresso"), false);
});

test("every rendered chip carries a photo — never a bare text placeholder", () => {
  const chips = selectLandingCoffeeHighlights(publicMenu(visibleItems));

  assert.ok(chips.length > 0);
  for (const chip of chips) {
    assert.ok(chip.photo, `chip ${chip.slug} has no photo`);
    assert.ok(
      chip.photo && chip.photo in derivaPhotos,
      `chip ${chip.slug} points at an unregistered photo slug: ${chip.photo}`
    );
  }
});

test("every configured candidate points at a registered photo slug", () => {
  assert.ok(HIGHLIGHT_CANDIDATES.length >= LANDING_CHIP_COUNT);
  for (const candidate of HIGHLIGHT_CANDIDATES) {
    assert.ok(
      candidate.photo in derivaPhotos,
      `candidate ${candidate.id} points at an unregistered photo slug: ${candidate.photo}`
    );
  }
  // No duplicate items, and no photo reused across two chips in one strip.
  const ids = HIGHLIGHT_CANDIDATES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const photos = HIGHLIGHT_CANDIDATES.map((c) => c.photo);
  assert.equal(new Set(photos).size, photos.length);
});

test("an unavailable item is backfilled by the next candidate, not left as a hole", () => {
  const menu = publicMenu(
    visibleItems.map((item) =>
      item.id === "capuccino-mediterraneo" ? { ...item, available: false } : item
    )
  );
  const chips = selectLandingCoffeeHighlights(menu);

  assert.equal(chips.length, LANDING_CHIP_COUNT);
  assert.equal(chips.some((chip) => chip.slug === "capuccino-mediterraneo"), false);
  // The reserve steps up rather than the strip shrinking.
  assert.ok(chips.some((chip) => chip.slug === "espresso-rose"));
  // Numbering stays gapless.
  assert.deepEqual(
    chips.map((chip) => chip.index),
    ["01", "02", "03", "04", "05", "06"]
  );
});

test("omits missing and unavailable configured items instead of inventing fallbacks", () => {
  const menu = publicMenu([
    visibleItems[0],
    { ...visibleItems[1], available: false },
    visibleItems[2]
  ]);

  assert.deepEqual(
    selectLandingCoffeeHighlights(menu).map((chip) => chip.slug),
    ["cappuccino", "pourover"]
  );
});

test("the homepage reads public menu highlights and has no stale card prices", () => {
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");
  const scroller = readFileSync(
    "src/components/landing/CartaScroller.tsx",
    "utf8"
  );

  assert.match(homepage, /getPublicMenuView/);
  assert.match(homepage, /selectLandingCoffeeHighlights/);
  assert.match(homepage, /cafetería de especialidad en Providencia, Santiago/i);
  assert.doesNotMatch(homepage, /\$3\.900|\$5\.200|Tostada Italiana|Kasler House/);
  assert.match(scroller, /seasonLabel/);
  assert.doesNotMatch(scroller, /Otoño 2026/);
});

test("the homepage visibly introduces breakfast, brunch, and weekday lunch", () => {
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");

  assert.match(homepage, /desayunos/i);
  assert.match(homepage, /brunch/i);
  assert.match(homepage, /almuerzos/i);
  assert.match(homepage, /Menú Ejecutivo de lunes a viernes/i);
  assert.match(homepage, /href="\/menu-ejecutivo"/);
});

test("the homepage includes a substantial visible midday editorial section", () => {
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");

  assert.match(
    homepage,
    /<section[^>]*className="landing-midday"[^>]*aria-labelledby="midday-title"[\s\S]*?<h2[^>]*id="midday-title"[\s\S]*?<p className="landing-midday__body">[\s\S]{120,}?<\/p>[\s\S]*?<Link[^>]*href="\/menu-ejecutivo"[^>]*>[\s\S]*?<\/Link>[\s\S]*?<\/section>/
  );
});

test("the homepage does not freeze a daily executive menu or its current price", () => {
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");

  assert.doesNotMatch(homepage, /10[.]?990/);
  assert.doesNotMatch(
    homepage,
    /Entrada|Fondo|Principal|Postre|Bebida|Sopa del día|Plato del día/i
  );
});
