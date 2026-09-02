import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync("app/globals.css", "utf8");

test("hero text is constrained to the viewport inside its flex column", () => {
  assert.match(
    css,
    /\.landing-hero__headline\s*{[^}]*width:\s*100%;[^}]*max-width:\s*100%;/s
  );
  assert.match(
    css,
    /\.landing-hero__lede\s*{[^}]*width:\s*100%;[^}]*max-width:\s*540px;/s
  );
});

test("the secondary navigation cue cannot crowd compact mobile widths", () => {
  assert.match(
    css,
    /@media \(max-width:\s*430px\)[\s\S]*?\.landing-nav__cue\s*{[^}]*display:\s*none;/
  );
});

test("the midday editorial section stays within the viewport", () => {
  assert.match(
    css,
    /\.landing-midday\s*{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*min-width:\s*0;/s
  );
  assert.match(
    css,
    /\.landing-midday__inner\s*{[^}]*width:\s*100%;[^}]*max-width:\s*[^;]+;[^}]*min-width:\s*0;/s
  );
});

test("the midday editorial section becomes one column on mobile and compact widths", () => {
  assert.match(
    css,
    /@media \(max-width:\s*900px\)[\s\S]*?\.landing-midday__inner\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/
  );
  assert.match(
    css,
    /@media \(max-width:\s*430px\)[\s\S]*?\.landing-midday\s*{[^}]*padding-inline:\s*20px;/
  );
});

test("the hero enters safe document flow on short compact viewports", () => {
  assert.match(
    css,
    /@media \(max-width:\s*430px\) and \(max-height:\s*640px\)[\s\S]*?\.landing-hero\s*{[^}]*height:\s*auto;[^}]*min-height:\s*720px;/
  );
  assert.match(
    css,
    /@media \(max-width:\s*430px\) and \(max-height:\s*640px\)[\s\S]*?\.landing-hero__content\s*{[^}]*position:\s*relative;[^}]*left:\s*auto;[^}]*right:\s*auto;[^}]*bottom:\s*auto;[^}]*min-height:\s*720px;/
  );
});

test("the midday link has a touch-sized target and visible keyboard focus", () => {
  assert.match(
    css,
    /\.landing-midday__link\s*{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*min-height:\s*44px;/s
  );
  assert.match(
    css,
    /\.landing-midday__link:focus-visible\s*{[^}]*outline:\s*[^;]+;[^}]*outline-offset:\s*[^;]+;/s
  );
});

// ── Offers plate (public /menu) ───────────────────────────────────────────
// The carta lives in a CSS module, so it gets its own source handle. These
// assert the mobile-first contract for the offer variant work: the two-column
// tariff is opt-in above a breakpoint, and every fixed-width slot is narrow
// enough to survive a 320px rail (390 minus the 20px page padding each side,
// minus the 16px plate padding each side = 318px of content).
const cartaCss = readFileSync("app/(landing)/menu/carta.module.css", "utf8");

test("the variant tariff stacks by default and only splits on wide viewports", () => {
  // Base rule: a single column. No width media query involved.
  assert.match(cartaCss, /\.tariffWrap\s*{[^}]*flex-direction:\s*column;/s);
  // The side-by-side treatment is gated behind a min-width, so mobile never
  // gets the 250px inclusions column.
  assert.match(
    cartaCss,
    /@media \(min-width:\s*720px\)[\s\S]*?\.tariffColShared\s*{[^}]*flex:\s*0 0 250px;/
  );
});

test("no fixed-width slot in the offers plate can overflow a 320px rail", () => {
  const fixedWidths = [...cartaCss.matchAll(/\.(vprice|incQty|indexNum)\s*{[^}]*?width:\s*(\d+)px/gs)];
  assert.equal(fixedWidths.length, 3, "expected three fixed-width slots to audit");
  for (const [, name, px] of fixedWidths) {
    assert.ok(Number(px) <= 120, `${name} is ${px}px, too wide for a 320px rail`);
  }
});

test("flexible cells in the tariff can shrink instead of forcing overflow", () => {
  // Long variant labels and long index names must wrap, not push the price
  // column off-screen. min-width:0 is what allows a flex child to shrink.
  assert.match(cartaCss, /\.vlabel\s*{[^}]*min-width:\s*0;/s);
  assert.match(cartaCss, /\.indexBody\s*{[^}]*min-width:\s*0;/s);
  assert.match(cartaCss, /\.tariffColShared,\s*\.tariffColRates\s*{[^}]*min-width:\s*0;/s);
});

test("service-window pills wrap rather than scroll sideways", () => {
  assert.match(cartaCss, /\.winRow\s*{[^}]*flex-wrap:\s*wrap;/s);
});

test("the offers disclosure is a real button with a visible focus ring", () => {
  assert.match(cartaCss, /\.plateCue:focus-visible\s*{[^}]*outline:\s*2px solid var\(--accent\);/s);
});

test("prices line up as a column of digits", () => {
  assert.match(cartaCss, /\.vprice\s*{[^}]*font-variant-numeric:\s*tabular-nums;/s);
});
