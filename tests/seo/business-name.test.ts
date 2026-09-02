import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BRAND_NAME,
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

test("the umbrella business name is Deriva Studio and the brand is unchanged", () => {
  assert.equal(SITE_NAME, "Deriva Studio");
  // Deriva is NOT rebranding. The brand the business trades under is unchanged;
  // SITE_NAME exists only to satisfy Google Ads Name Prominence on the paid
  // landing destinations.
  assert.equal(BRAND_NAME, "Deriva Coffee Studio");
  assert.notEqual(BRAND_NAME, SITE_NAME);
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

test("the nav defaults to the brand and only paid pages opt into the umbrella name", () => {
  const nav = read("src/components/landing/SiteNav.tsx");

  // The nav renders whatever `brand` it is given, defaulting to BRAND_NAME.
  assert.match(nav, /brand = BRAND_NAME/);
  assert.match(nav, /<span>{brand}<\/span>/);
  // No hardcoded name in the component itself.
  assert.doesNotMatch(nav, /"Deriva Coffee Studio"|"Deriva Studio"/);

  // Exactly the three paid landing destinations pass the umbrella name.
  for (const path of [
    "app/(landing)/page.tsx",
    "app/(landing)/menu/page.tsx",
    "app/(landing)/menu-ejecutivo/page.tsx"
  ]) {
    assert.match(read(path), /<SiteNav[^>]*brand={SITE_NAME}/, path);
  }

  // Non-paid surfaces must NOT — the umbrella name is not a rebrand.
  for (const path of [
    "app/(landing)/resenas/page.tsx",
    "app/(landing)/companion/page.tsx",
    "app/(landing)/deriva-match-up/page.tsx",
    "app/(landing)/deriva-match-up/bases/page.tsx"
  ]) {
    assert.doesNotMatch(read(path), /brand={SITE_NAME}/, path);
  }
});

test("non-paid page titles do not double the business name", () => {
  // These set their own brand-bearing title, so they must opt out of the root
  // template with `absolute` — otherwise the title renders the brand AND the
  // umbrella name back to back ("Sala · Deriva Coffee Studio · Deriva Studio").
  for (const path of [
    "app/(landing)/sala/page.tsx",
    "app/(landing)/abierto/page.tsx",
    "app/(landing)/privacidad/page.tsx"
  ]) {
    const source = read(path);
    assert.match(source, /title:\s*{\s*absolute:/, path);
    assert.doesNotMatch(source, /title:\s*"[^"]*Deriva/, path);
  }
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
