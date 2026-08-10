# Specialty Coffee Local SEO Design

**Date:** 2026-08-09
**Status:** Approved for implementation

## Objective

Improve Deriva Coffee Studio's visibility for Spanish-language local searches centered on `café de especialidad en Providencia` and supported by `café de especialidad en Santiago`. The work should also make the current public menu easier for search engines and answer engines to understand without weakening Deriva's place-led voice.

## Confirmed scope

- Spanish and Chilean search intent only.
- The live `GET /public/menu?locale=es-CL` response is the sole menu source of truth.
- Only the 79 products currently placed on the public menu may appear in website content, structured data, Google Business Profile material, or AI-facing summaries.
- The 12 catalog items marked available but absent from the public presentation stay hidden everywhere.
- Do not change hidden catalog rows, deduplicate catalog records, invent products, change prices, or expose internal availability.
- Preserve the current visual system and the brand line `Café, mate y cocina. Sin atajos.`

## Current-state findings

The site already has a strong foundation: server-rendered menu HTML, canonical URLs, `CafeOrCoffeeShop` and `Menu` JSON-LD, `robots.txt`, `sitemap.xml`, and `llms.txt`. The public menu exposes names, descriptions, prices, service windows, and availability for 79 items.

The main gaps are consistency and local relevance:

- Root metadata still contains pre-opening language.
- Homepage coffee cards contain stale prices and two products not present on the public menu.
- The live menu season says `Otono 2026`, which is stale and misspelled for August.
- The sitemap includes an expired campaign and assigns a fresh `lastModified` date on every deployment.
- The homepage schema and discovery documentation have drifted apart.
- Public search results show the homepage, while the dedicated menu has not yet established comparable visibility.
- Google Business Profile copy predates the current menu breadth.

## Recommended approach

Concentrate authority on two canonical public URLs instead of creating thin keyword-targeted pages:

1. `/` owns the local business and destination intent: a café de especialidad in Providencia, Santiago.
2. `/menu` owns the complete current offering: espresso, filtrados, cafés fríos, cafés de autor, coffee beans, breakfast, food, onces, pastries, beer, and cocktails.

The homepage keeps its existing brand-led hero. Its supporting sentence, metadata, and linked data will state the local specialty-coffee proposition naturally. The menu remains the exhaustive source for products and prices.

## Website architecture

### Homepage

- Keep the current H1 and visual composition.
- Replace the stale supporting sentence with concise Spanish copy that identifies Deriva as a `cafetería de especialidad en Providencia, Santiago` and mentions real differentiators: espresso, V60/Chemex, rotating origins, Coffee Flight, and signature coffee.
- Replace hard-coded menu highlights with a selector over the live public menu. Select only configured public IDs; omit any missing or unavailable item rather than falling back to an internal catalog row.
- Use six coffee-led highlights so the landing page reinforces the primary search intent while the full menu retains the rest of the offering.
- Never hard-code a product price in the landing page when the public menu already supplies it.

### Complete menu

- Keep all 79 public products server-rendered in visible HTML.
- Keep `Menu`, `MenuSection`, `MenuItem`, and `Offer` structured data generated from the same public response used for rendering.
- Strengthen the page title and description around a complete specialty-coffee menu in Providencia, without listing hidden products or repeating keywords unnaturally.
- Link the menu entity, page entity, website entity, and café entity through stable `@id` values.

### Technical discovery

- Replace pre-opening root metadata with current operating copy.
- Use Spanish-only keyword and language signals.
- Remove expired campaign URLs from the sitemap and stop fabricating a new `lastModified` value on every build.
- Keep the host-aware robots behavior unchanged.
- Update `llms.txt` as a factual Spanish summary of the public offering. Treat it as an experimental discovery surface, not a guaranteed ranking mechanism.
- Update the engineering SEO documentation so it describes the linked-data graph actually emitted by the app.

## LocalBusiness entity design

The homepage will emit one linked JSON-LD graph containing:

- `Organization` for Deriva Coffee Studio and its logo/social identity.
- `CafeOrCoffeeShop` for the physical location, address, coordinates, hours, contact details, price range, menu URL, and real service categories.
- `WebSite` for the canonical site and publisher relationship.

The entity must use the exact public name, address, phone, hours, website, Instagram URL, and map destination. It must not add ratings, reviews, awards, or claims that cannot be verified.

## Google Business Profile design

The profile workstream will first inspect the authenticated current profile and record its exact primary category, secondary categories, address, phone, hours, website, menu link, attributes, photos, and review state. Mutations will be narrow and read back after saving.

Planned profile improvements:

- Preserve the legal/public business name without keyword stuffing.
- Keep `Cafetería` or the closest verified Google category as the primary category; add only categories actually supported by the operation and available in Google's Chilean category picker.
- Set the menu link to `https://derivastudio.cl/menu` and the website to `https://derivastudio.cl/`.
- Replace the old description with Spanish copy grounded in the public menu: espresso, cappuccino, flat white, V60/Chemex, Coffee Flight, cafés fríos, cafés de autor, beans to take home, breakfast, brunch, kitchen, onces, and pastries.
- Confirm regular and special hours, phone, Wi-Fi and other applicable attributes.
- Use real, current photos labeled operationally by subject; do not upload synthetic menu/product photography.
- Establish a review-request and response cadence without incentives, gating, or scripted keyword stuffing.

## GEO and external authority

- Keep the factual Spanish `llms.txt` entry aligned with the homepage and public menu.
- Link the café entity to its owned Instagram profile and, where semantically appropriate, reference verified editorial coverage as `subjectOf` rather than `sameAs`.
- Preserve name, address, phone, hours, and URL consistency across the site, Google Business Profile, Instagram, and verified press coverage.
- Do not manufacture citations, reviews, neighborhood pages, or AI-targeted prose that is invisible to customers.

## Measurement

Record a baseline before publishing where access permits:

- Google Business Profile discovery searches, profile views, direction requests, calls, website clicks, and menu clicks.
- Search Console impressions, clicks, average position, and indexed status for `/` and `/menu`.
- Organic visits and menu-navigation events in Vercel Analytics.

Review after 14 and 30 days. The primary success signal is increased qualified discovery for specialty-coffee searches in Providencia and Santiago, followed by menu visits and direction requests. Rankings are not guaranteed because local results also depend on distance and prominence.

## Verification and release

- Add automated assertions for Spanish metadata, sitemap membership, public-only landing highlights, and linked-data relationships.
- Run typecheck, focused SEO tests, and a production build.
- Inspect rendered HTML for title, description, canonical, visible copy, public menu items, and JSON-LD.
- Validate structured data with Schema.org Validator and Google's Rich Results Test where supported.
- Because visible homepage copy and cards change, port desktop and mobile results to Paper and obtain explicit user confirmation before deployment.
- Deploy a preview, verify it, and request explicit production approval before promotion.
- After production, request indexing for `/` and `/menu` in Search Console and verify the saved Google Business Profile fields.

