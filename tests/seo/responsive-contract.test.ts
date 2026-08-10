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
