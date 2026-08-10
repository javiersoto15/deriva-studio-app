import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { EXECUTIVE_MENU_STABLE_HOURS } from "../../src/seo/executive-menu";

const pagePath = "app/(landing)/menu-ejecutivo/page.tsx";
const bodyPath =
  "app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx";

function routeSource() {
  return {
    page: readFileSync(pagePath, "utf8"),
    body: readFileSync(bodyPath, "utf8")
  };
}

test("publishes the permanent Spanish Menú Ejecutivo route contract", () => {
  const { page, body } = routeSource();
  const source = `${page}\n${body}`;

  assert.match(page, /title:\s*["'][^"']*Menú Ejecutivo en Providencia/);
  assert.match(page, /alternates:\s*{\s*canonical:\s*EXECUTIVE_MENU_URL\s*}/);
  assert.match(page, /getPublicExecutiveMenu\("es-CL"\)/);
  assert.match(page, /buildExecutiveMenuPresentation\(menu\)/);
  assert.match(page, /buildExecutiveMenuGraph\(menu\)/);
  assert.match(source, /Menú Ejecutivo en Providencia/);
  assert.equal(EXECUTIVE_MENU_STABLE_HOURS, "Lunes a viernes · 13:00–16:00");
  assert.match(body, /EXECUTIVE_MENU_STABLE_HOURS/);
  assert.match(source, /href=["']\/menu["']/);
  assert.match(source, /href={MAPS_URL}/);
});

test("keeps daily dishes and pricing API-backed", () => {
  const { page, body } = routeSource();
  const source = `${page}\n${body}`;

  assert.doesNotMatch(
    source,
    /Crema de verduras|Pollo al curry|Postre del día|CLP \$10\.990|10990/
  );
  assert.match(body, /presentation\.priceLabel/);
  assert.match(body, /presentation\.courses\.map/);
});

test("escapes hostile closing tags before embedding JSON-LD", () => {
  const { page } = routeSource();
  const hostile = JSON.stringify({ name: "</script><script>alert(1)</script>" }).replace(
    /</g,
    "\\u003c"
  );

  assert.doesNotMatch(hostile, /<\/script>/);
  assert.match(hostile, /\\u003c\/script>/);
  assert.ok(
    page.includes(
      'JSON.stringify(buildExecutiveMenuGraph(menu)).replace(\n    /</g,\n    "\\\\u003c"\n  )'
    )
  );
  assert.match(page, /dangerouslySetInnerHTML={{\s*__html:/s);
});
