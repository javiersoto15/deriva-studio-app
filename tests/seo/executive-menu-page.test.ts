import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { EXECUTIVE_MENU_STABLE_HOURS } from "../../src/seo/executive-menu";

const pagePath = "app/(landing)/menu-ejecutivo/page.tsx";
const bodyPath =
  "app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx";
const stylePath =
  "app/(landing)/menu-ejecutivo/menu-ejecutivo.module.css";

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

test("composes the focused landing page from the Carta's fixed dark primitives", () => {
  const { body } = routeSource();

  assert.match(
    body,
    /import cartaStyles from ["']\.\.\/\.\.\/menu\/carta\.module\.css["']/
  );
  assert.match(body, /className={cartaStyles\.shell}\s+data-theme=["']dark["']/);
  assert.match(body, /cartaStyles\.masthead/);
  assert.match(body, /cartaStyles\.mastTitle/);
  assert.match(body, /cartaStyles\.mastLede/);
  assert.match(body, /cartaStyles\.insert/);
  assert.match(body, /cartaStyles\.courses/);
  assert.match(body, /className={cartaStyles\.course}/);
  assert.match(body, /className={cartaStyles\.courseNum}/);
  assert.match(body, /className={cartaStyles\.courseTag}/);
  assert.match(body, /className={cartaStyles\.courseName}/);
  assert.doesNotMatch(body, /aria-label=["'](?:Tema|Idioma)["']/);
  assert.doesNotMatch(body, /cartaStyles\.(?:toggle|toggleSeg|langGroup|langBtn)/);
});

test("links to the single Carta route with the approved CTA copy", () => {
  const { body } = routeSource();

  assert.match(
    body,
    /<Link[\s\S]*?href=["']\/menu["'][\s\S]*?>\s*Ver el menú\s*<\/Link>/
  );
  assert.doesNotMatch(body, /Ver la carta completa/);
});

test("keeps the semantic course list free of browser-default markers", () => {
  const { body } = routeSource();
  const css = readFileSync(stylePath, "utf8");
  const courseList = body.match(/<ol[\s\S]*?<\/ol>/)?.[0];

  assert.match(
    body,
    /<div className={cartaStyles\.courses}>\s*<ol className={styles\.courseList}>/
  );
  assert.match(css, /\.courseList\s*{[^}]*list-style:\s*none/s);
  assert.ok(courseList);
  assert.doesNotMatch(courseList, /cartaStyles\.insertPrice/);
  assert.match(
    body,
    /<\/ol>\s*<div className={cartaStyles\.insertPrice}>/
  );
});

test("keeps the long heading and service hours readable on mobile", () => {
  const { body } = routeSource();
  const css = readFileSync(stylePath, "utf8");

  assert.match(
    body,
    /className={`\$\{cartaStyles\.insertTop} \$\{styles\.insertTop}`}/
  );
  assert.match(
    css,
    /@media \(max-width: 520px\)[\s\S]*?\.mastTitle\s*{[^}]*max-width:\s*none;[^}]*overflow-wrap:\s*normal;/
  );
  assert.match(
    css,
    /@media \(max-width: 520px\)[\s\S]*?\.insertTop\s*{[^}]*flex-direction:\s*column;/
  );
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
