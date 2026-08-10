import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LOCAL_SEO_DESCRIPTION,
  buildLocalBusinessGraph
} from "../../src/seo/local-business";

test("uses current Spanish local specialty-coffee positioning", () => {
  assert.match(LOCAL_SEO_DESCRIPTION, /café de especialidad/i);
  assert.match(LOCAL_SEO_DESCRIPTION, /Providencia/);
  assert.match(LOCAL_SEO_DESCRIPTION, /Santiago/);
  assert.doesNotMatch(LOCAL_SEO_DESCRIPTION, /abrimos pronto|fecha de apertura|waitlist/i);
});

test("links the organization, cafe, and website without unverified claims", () => {
  const graph = buildLocalBusinessGraph();
  const serialized = JSON.stringify(graph);

  assert.equal(graph["@context"], "https://schema.org");
  assert.deepEqual(
    graph["@graph"].map((node) => node["@id"]),
    [
      "https://derivastudio.cl/#organization",
      "https://derivastudio.cl/#cafe",
      "https://derivastudio.cl/#website"
    ]
  );
  assert.match(serialized, /Magnere 1570, Local 105/);
  assert.match(serialized, /https:\/\/derivastudio\.cl\/menu/);
  assert.match(serialized, /https:\/\/www\.instagram\.com\/deriva\.coffee\.studio\//);
  assert.doesNotMatch(serialized, /aggregateRating|review/);
  assert.doesNotMatch(
    serialized,
    /Masa Madre Duo|Brochetas Mixtas|Sobrecostilla Braseada|Tiramisú/
  );
});

test("the app consumes canonical SEO facts instead of stale launch copy", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const homepage = readFileSync("app/(landing)/page.tsx", "utf8");

  assert.match(layout, /LOCAL_SEO_DESCRIPTION/);
  assert.match(homepage, /buildLocalBusinessGraph/);
  assert.doesNotMatch(
    `${layout}\n${homepage}`,
    /Únete a nuestra lista para conocer la fecha de apertura/
  );
});

test("discovery surfaces contain only current canonical public routes", () => {
  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  const llms = readFileSync("app/llms.txt/route.ts", "utf8");

  assert.match(sitemap, /`\$\{siteUrl\}\/menu`/);
  assert.match(sitemap, /`\$\{siteUrl\}\/resenas`/);
  assert.match(sitemap, /`\$\{siteUrl\}\/privacidad`/);
  assert.doesNotMatch(sitemap, /deriva-match-up|new Date\(\)/);

  assert.match(llms, /café de especialidad en Providencia/i);
  assert.match(llms, /V60|Chemex/);
  assert.match(llms, /\$\{siteUrl\}\/menu/);
  assert.doesNotMatch(llms, /specialty coffee Santiago|English/i);
});
