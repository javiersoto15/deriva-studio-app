import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BUSINESS_DESCRIPTOR,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
  SITE_URL,
  buildLocalBusinessGraph
} from "../../src/seo/local-business";

const read = (path: string) => readFileSync(path, "utf8");

// The three paid Google Ads landing destinations.
const PAID_LANDING_SURFACES = {
  "/": "app/(landing)/page.tsx",
  "/menu": "app/(landing)/menu/_components/CartaBody.tsx",
  "/menu-ejecutivo":
    "app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx"
} as const;

test("the umbrella business name is Deriva Studio", () => {
  assert.equal(SITE_NAME, "Deriva Studio");
  // The coffee-specific name is retained as an alternate, never as the primary
  // identity — the business is coffee AND kitchen AND mate.
  assert.deepEqual([...SITE_ALTERNATE_NAMES], ["Deriva Coffee Studio", "Deriva"]);
  assert.equal(SITE_URL, "https://derivastudio.cl");
});

test("every paid landing destination renders the business name as visible text", () => {
  for (const [route, path] of Object.entries(PAID_LANDING_SURFACES)) {
    const source = read(path);
    assert.match(
      source,
      /{SITE_NAME}/,
      `${route} must render SITE_NAME as page content`
    );
    // Not satisfied by metadata, aria-label, alt text, or JSON-LD alone.
    assert.doesNotMatch(
      source,
      /aria-label={SITE_NAME}|alt={SITE_NAME}|content={SITE_NAME}/,
      `${route} must not hide the business name in an attribute`
    );
  }
});

test("the persistent nav carries the business name on every landing surface", () => {
  const nav = read("src/components/landing/SiteNav.tsx");
  assert.match(nav, /<span>{SITE_NAME}<\/span>/);
  assert.doesNotMatch(nav, /Deriva Coffee Studio/);
});

test("offerings are described separately from the umbrella name", () => {
  // Name prominence must not be achieved by keyword stuffing: the descriptor
  // is one short line and the name itself stays neutral.
  assert.equal(BUSINESS_DESCRIPTOR, "Café de especialidad, cocina y mate en Providencia");
  assert.doesNotMatch(SITE_NAME, /café|coffee|menu|almuerzo/i);

  for (const path of Object.values(PAID_LANDING_SURFACES)) {
    const occurrences = read(path).match(/{SITE_NAME}/g) ?? [];
    assert.ok(
      occurrences.length <= 3,
      `${path} repeats the business name ${occurrences.length} times`
    );
  }
});

test("structured data names Deriva Studio consistently with no rival identity", () => {
  const graph = buildLocalBusinessGraph();
  const named = graph["@graph"].filter((node) => "name" in node);

  assert.ok(named.length >= 3);
  for (const node of named) {
    assert.equal(node.name, "Deriva Studio", String(node["@id"]));
    assert.equal(node.url, "https://derivastudio.cl", String(node["@id"]));
  }

  const organization = graph["@graph"][0];
  const cafe = graph["@graph"][1];
  assert.deepEqual([...organization.alternateName], [
    "Deriva Coffee Studio",
    "Deriva"
  ]);
  assert.deepEqual([...cafe.alternateName], ["Deriva Coffee Studio", "Deriva"]);

  // Exactly one LocalBusiness-type identity, linked to one Organization.
  const localBusinessNodes = graph["@graph"].filter(
    (node) => node["@type"] === "CafeOrCoffeeShop"
  );
  assert.equal(localBusinessNodes.length, 1);
  assert.deepEqual(localBusinessNodes[0].parentOrganization, {
    "@id": "https://derivastudio.cl/#organization"
  });
});

test("the menu-ejecutivo page keeps its canonical and Providencia title", () => {
  const page = read("app/(landing)/menu-ejecutivo/page.tsx");

  assert.match(page, /alternates:\s*{\s*canonical:\s*EXECUTIVE_MENU_URL\s*}/);
  assert.match(page, /title:\s*["']Menú Ejecutivo en Providencia["']/);
  // Root layout template appends " · Deriva Studio".
  assert.match(read("app/layout.tsx"), /template:\s*`%s · \$\{SITE_NAME}`/);
  assert.match(page, /Magnere 1570, Providencia/);
});
