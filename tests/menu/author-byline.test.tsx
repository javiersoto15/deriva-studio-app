import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AuthorByline } from "../../app/(landing)/menu/_components/author-byline";

function render(author: string | null | undefined, locale: "es" | "en" | "pt-BR") {
  return renderToStaticMarkup(
    createElement(AuthorByline, { author, locale, className: "byline" })
  );
}

test("omits the byline for missing, null, empty, and whitespace-only authors", () => {
  assert.equal(render(undefined, "es"), "");
  assert.equal(render(null, "es"), "");
  assert.equal(render("", "es"), "");
  assert.equal(render(" \t\n ", "es"), "");
});

test("trims a valid author and uses the Spanish prefix", () => {
  assert.equal(render("  Camila Rojas  ", "es"), '<span class="byline">Por Camila Rojas</span>');
});

test("uses the English prefix and the requested Portuguese wording", () => {
  assert.equal(render("Maya Silva", "en"), '<span class="byline">By Maya Silva</span>');
  assert.equal(render("Maya Silva", "pt-BR"), '<span class="byline">Por Maya Silva</span>');
});

test("renders names as escaped text and keeps long names intact in the markup", () => {
  const longName = "A very long coffee recipe creator name that should wrap inside the card";
  assert.equal(
    render('Ana <script>alert("x")</script> & José', "es"),
    '<span class="byline">Por Ana &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; José</span>'
  );
  assert.equal(
    render(longName, "en"),
    `<span class="byline">By ${longName}</span>`
  );
});
