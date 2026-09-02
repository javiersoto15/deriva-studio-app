import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EXECUTIVE_MENU_CARTA_CTA,
  EXECUTIVE_MENU_DIRECTIONS_CTA,
  EXECUTIVE_MENU_STABLE_HOURS
} from "../../src/seo/executive-menu";

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

  // The CTA copy is centralised so the fallback state and the footer can never
  // drift apart. /menu-ejecutivo must always offer a way into the full carta.
  assert.match(
    body,
    /<Link[\s\S]*?href=["']\/menu["'][\s\S]*?>\s*{EXECUTIVE_MENU_CARTA_CTA}\s*<\/Link>/
  );
  assert.equal(EXECUTIVE_MENU_CARTA_CTA, "Ver la carta completa");
  assert.equal(EXECUTIVE_MENU_DIRECTIONS_CTA, "Cómo llegar");
  assert.match(body, /{EXECUTIVE_MENU_DIRECTIONS_CTA}/);
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

test("renders the service-window status alongside the edition", () => {
  const { body } = routeSource();

  assert.match(body, /service\.badge/);
  assert.match(body, /service\.note/);
  assert.match(body, /data-state={service\.status}/);
  // Status is derived, never asserted as a literal in the view.
  assert.doesNotMatch(body, /Disponible ahora["']/);
});

test("renders the fondo alternative note published by the API", () => {
  const { body } = routeSource();

  assert.match(body, /course\.note \?/);
  assert.doesNotMatch(body, /Ensalada proteica/);
});

test("the rotation explainer is labelled as illustrative, not today's edition", () => {
  const { body } = routeSource();
  const seo = readFileSync("src/seo/executive-menu.ts", "utf8");
  // Scope the assertions to the EXECUTIVE_MENU_SHAPE literal itself — the rest
  // of the module legitimately handles the API-supplied CLP price.
  const shape =
    seo.split("EXECUTIVE_MENU_SHAPE = [")[1]?.split("] as const;")[0] ?? "";
  assert.ok(shape.length > 0, "EXECUTIVE_MENU_SHAPE literal not found");

  // The explainer exists…
  assert.match(body, /EXECUTIVE_MENU_SHAPE\.map/);
  assert.match(body, /Ejemplos, no la edición de hoy/);
  assert.match(body, /sólo ejemplos ilustrativos/);
  assert.match(body, /shapeExampleLabel[\s\S]*?Por ejemplo:/);

  // …and the four parts of the program are named.
  for (const part of ["Una bebida", "Una entrada", "Un fondo", "Un postre"]) {
    assert.match(shape, new RegExp(part));
  }

  // The examples are illustrative data, never a price or an availability claim.
  assert.doesNotMatch(shape, /\$|CLP|10\.?990|disponible ahora|hoy/i);
});

test("the no-edition fallback stays on /menu-ejecutivo with both CTAs", () => {
  const { page, body } = routeSource();

  // No redirect away from the route in any state.
  assert.doesNotMatch(page, /redirect\(|permanentRedirect\(/);
  assert.doesNotMatch(body, /redirect\(|permanentRedirect\(/);

  assert.match(body, /EXECUTIVE_MENU_FALLBACK_TITLE/);
  assert.match(body, /EXECUTIVE_MENU_FALLBACK_BODY/);
  // Actions() carries both the carta CTA and the directions CTA, and is
  // rendered inside the fallback branch as well as the footer.
  assert.match(body, /<Actions \/>\s*<\/div>/);
  assert.match(body, /presentation\.availableToday \?/);

  // The fallback branch must not print a price or a course list.
  const fallbackBranch = body.split("presentation.availableToday ?")[1]?.split("</section>")[0] ?? "";
  const elseBranch = fallbackBranch.split(") : (")[1] ?? "";
  assert.ok(elseBranch.length > 0);
  assert.doesNotMatch(elseBranch, /priceLabel|insertPrice|courses\.map/);
});

test("the visible umbrella business name is present on the page", () => {
  const { body } = routeSource();

  assert.match(body, /{SITE_NAME}/);
  assert.match(body, /{BUSINESS_DESCRIPTOR}/);
  assert.doesNotMatch(body, /aria-label={SITE_NAME}/);
});
