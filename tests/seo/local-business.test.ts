import assert from "node:assert/strict";
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
