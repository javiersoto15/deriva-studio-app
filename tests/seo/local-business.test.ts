import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LOCAL_SEO_DESCRIPTION,
  buildLocalBusinessGraph
} from "../../src/seo/local-business";
import sitemap from "../../app/sitemap";
import { GET as getLlmsTxt } from "../../app/llms.txt/route";

test("uses current Spanish local specialty-coffee positioning", () => {
  assert.match(LOCAL_SEO_DESCRIPTION, /café de especialidad en Providencia/i);
  assert.match(LOCAL_SEO_DESCRIPTION, /Providencia/);
  assert.match(LOCAL_SEO_DESCRIPTION, /Santiago/);
  assert.match(LOCAL_SEO_DESCRIPTION, /brunch/i);
  assert.match(LOCAL_SEO_DESCRIPTION, /almuerzos/i);
  assert.match(LOCAL_SEO_DESCRIPTION, /Menú Ejecutivo de lunes a viernes/i);
  assert.doesNotMatch(LOCAL_SEO_DESCRIPTION, /abrimos pronto|fecha de apertura|waitlist/i);
});

test("covers supporting local dining intents in cafe discovery facts", () => {
  const cafe = buildLocalBusinessGraph()["@graph"][1];
  const keywords = String(cafe.keywords);

  assert.match(keywords, /café de especialidad en Providencia/i);
  assert.match(keywords, /brunch en Providencia/i);
  assert.match(keywords, /Menú Ejecutivo en Providencia/i);
  assert.ok(cafe.servesCuisine.includes("Almuerzos"));
  assert.ok(cafe.servesCuisine.includes("Menú Ejecutivo"));
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
  const localBusiness = readFileSync("src/seo/local-business.ts", "utf8");

  assert.match(layout, /LOCAL_SEO_DESCRIPTION/);
  assert.match(layout, /LOCAL_SEARCH_INTENTS/);
  assert.doesNotMatch(layout, /keywords:\s*\[\s*"/);
  assert.match(localBusiness, /keywords:\s*LOCAL_SEARCH_INTENTS/);
  assert.match(homepage, /buildLocalBusinessGraph/);
  assert.doesNotMatch(
    `${layout}\n${homepage}`,
    /Únete a nuestra lista para conocer la fecha de apertura/
  );
});

test("the sitemap indexes the permanent daily Menú Ejecutivo page", () => {
  const entries = sitemap();
  const executiveMenu = entries.find(
    (entry) => entry.url === "https://derivastudio.cl/menu-ejecutivo"
  );

  assert.deepEqual(executiveMenu, {
    url: "https://derivastudio.cl/menu-ejecutivo",
    changeFrequency: "daily",
    priority: 0.9
  });
});

test("llms.txt describes broad local service without a volatile daily edition", async () => {
  const response = getLlmsTxt();
  const llms = await response.text();

  assert.match(llms, /café de especialidad en Providencia/i);
  assert.match(llms, /brunch/i);
  assert.match(llms, /Menú Ejecutivo/);
  assert.match(llms, /lunes a viernes[^\n]*13:00–16:00/i);
  assert.match(llms, /https:\/\/derivastudio\.cl\/menu-ejecutivo/);
  assert.doesNotMatch(
    llms,
    /CLP\s*\$|\$\s*10[.,]?990|Una bebida|Crema de verduras|Pollo al curry|Postre del día/i
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
  assert.doesNotMatch(
    `${sitemap}\n${llms}`,
    /deriva-match-up|Masa Madre Duo|Brochetas Mixtas|Sobrecostilla Braseada|Tiramisú/
  );
});
