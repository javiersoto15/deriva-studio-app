# Broad Local Discovery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Deriva's owned website and Google Business Profile positioning from specialty coffee alone to specialty coffee, breakfast, brunch, lunch and the weekday Menú Ejecutivo without exposing hidden products or weakening the café identity.

**Architecture:** Keep `/menu` as the canonical complete menu and add an always-indexable `/menu-ejecutivo` route backed by the existing public daily endpoint. Centralize broad local positioning in `src/seo/local-business.ts`, link the homepage and discovery surfaces to the new route, and mirror the same hierarchy in the durable Google Business Profile copy. All menu facts remain API-backed; stable service copy is the only fallback when no daily edition is published.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, public Go API, Schema.org JSON-LD, Node test runner through `tsx`, Paper Desktop, Google Business Profile.

---

### Task 1: Broaden canonical local positioning

**Skills:** @superpowers:test-driven-development, @vercel:nextjs

**Files:**
- Modify: `src/seo/local-business.ts`
- Modify: `app/layout.tsx`
- Modify: `tests/seo/local-business.test.ts`

**Step 1: Write the failing tests**

Add assertions that the canonical Spanish description and keyword sets contain all four durable intents:

```ts
assert.match(LOCAL_SEO_DESCRIPTION, /café de especialidad en Providencia/i);
assert.match(LOCAL_SEO_DESCRIPTION, /brunch/i);
assert.match(LOCAL_SEO_DESCRIPTION, /almuerzos/i);
assert.match(LOCAL_SEO_DESCRIPTION, /Menú Ejecutivo de lunes a viernes/i);
assert.ok(cafe.keywords.includes("brunch en Providencia"));
assert.ok(cafe.keywords.includes("Menú Ejecutivo en Providencia"));
```

Also assert that `servesCuisine` includes `Almuerzos` and `Menú Ejecutivo`, and that `app/layout.tsx` consumes the centralized facts instead of duplicating a divergent list.

**Step 2: Run the test and verify it fails**

Run:

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run test:seo
```

Expected: FAIL because lunch and Menú Ejecutivo are absent from the canonical description and keyword graph.

**Step 3: Implement the minimal positioning update**

Add a canonical constant for broad local intents and update the description without turning it into a keyword list:

```ts
export const LOCAL_SEO_DESCRIPTION =
  "Deriva Coffee Studio es una cafetería de especialidad en Providencia, Santiago, con desayunos, brunch, almuerzos y Menú Ejecutivo de lunes a viernes, además de espresso, filtrados y cafés de autor.";

export const LOCAL_SEARCH_INTENTS = [
  "café de especialidad en Providencia",
  "cafetería en Providencia",
  "brunch en Providencia",
  "desayuno en Providencia",
  "almuerzo en Providencia",
  "Menú Ejecutivo en Providencia",
  "Menú Ejecutivo de lunes a viernes"
] as const;
```

Use the shared list in both JSON-LD and metadata. Preserve the business name, address, hours and all verified facts.

**Step 4: Run tests and typecheck**

Run:

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run test:seo
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run typecheck
```

Expected: all SEO tests PASS and TypeScript exits 0.

**Step 5: Commit**

```bash
git add src/seo/local-business.ts app/layout.tsx tests/seo/local-business.test.ts
git commit -m "feat(seo): broaden local dining intent"
```

### Task 2: Define a testable Menú Ejecutivo presentation model

**Skills:** @superpowers:test-driven-development

**Files:**
- Create: `src/seo/executive-menu.ts`
- Create: `tests/seo/executive-menu.test.ts`

**Step 1: Write the failing tests**

Cover both a published daily response and a missing response:

```ts
test("builds an API-backed daily Menú Ejecutivo presentation", () => {
  const result = buildExecutiveMenuPresentation(sampleMenu);
  assert.equal(result.priceLabel, "CLP $10.990");
  assert.equal(result.hours, "13:00 - 16:00");
  assert.deepEqual(result.courses.map((course) => course.name), [
    "Una bebida",
    "Crema de verduras",
    "Pollo al curry con arroz al cilantro",
    "Postre del día"
  ]);
});

test("returns stable service copy without inventing a daily edition", () => {
  const result = buildExecutiveMenuPresentation(null);
  assert.equal(result.availableToday, false);
  assert.deepEqual(result.courses, []);
  assert.equal(result.hours, "Lunes a viernes · 13:00–16:00");
});
```

Add assertions that `buildExecutiveMenuGraph(null)` has no Offer and that the live variant uses the API price and course names verbatim.

**Step 2: Run the focused test and verify it fails**

Run:

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx tsx --test tests/seo/executive-menu.test.ts
```

Expected: FAIL because the module does not exist.

**Step 3: Implement the minimal model and schema graph**

Export:

```ts
export const EXECUTIVE_MENU_URL = `${SITE_URL}/menu-ejecutivo`;
export const EXECUTIVE_MENU_STABLE_HOURS = "Lunes a viernes · 13:00–16:00";

export function buildExecutiveMenuPresentation(menu: ExecutiveMenu | null) {
  return menu
    ? { availableToday: true, dateLabel: menu.date_label, priceLabel: menu.price_label,
        priceClp: menu.price_clp, hours: menu.hours, hero: menu.hero,
        subline: menu.subline, courses: menu.courses }
    : { availableToday: false, dateLabel: undefined, priceLabel: undefined,
        priceClp: undefined, hours: EXECUTIVE_MENU_STABLE_HOURS,
        hero: "Menú Ejecutivo en Providencia", subline: "La edición del día se publica cada jornada de servicio.", courses: [] };
}
```

Build a linked `WebPage` + `Menu` graph connected to `/#cafe`. Only add `Offer` and course `MenuItem` nodes when a real response exists.

**Step 4: Run focused and full SEO tests**

Expected: all tests PASS.

**Step 5: Commit**

```bash
git add src/seo/executive-menu.ts tests/seo/executive-menu.test.ts
git commit -m "feat(seo): model weekday executive menu"
```

### Task 3: Build the permanent `/menu-ejecutivo` page

**Skills:** @superpowers:test-driven-development, @vercel:nextjs

**Files:**
- Create: `app/(landing)/menu-ejecutivo/page.tsx`
- Create: `app/(landing)/menu-ejecutivo/menu-ejecutivo.module.css`
- Create: `app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx`
- Create: `tests/seo/executive-menu-page.test.ts`

**Step 1: Write the failing source-contract test**

Assert that the page:

- exports Spanish metadata with `Menú Ejecutivo en Providencia`;
- uses `getPublicExecutiveMenu("es-CL")`;
- uses `buildExecutiveMenuPresentation` and `buildExecutiveMenuGraph`;
- renders stable Monday–Friday 13:00–16:00 copy;
- links to `/menu` and `MAPS_URL`;
- never hard-codes course names or a price in the page component.

**Step 2: Run the focused test and verify it fails**

Expected: FAIL because the route is absent.

**Step 3: Implement the page shell and dynamic content**

Use a Suspense boundary following the existing `/menu` pattern:

```tsx
async function ExecutiveMenuContent() {
  const menu = await getPublicExecutiveMenu("es-CL");
  const presentation = buildExecutiveMenuPresentation(menu);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildExecutiveMenuGraph(menu))
      }} />
      <ExecutiveMenuBody presentation={presentation} />
    </>
  );
}
```

Visible information hierarchy:

1. `Menú Ejecutivo en Providencia`
2. `Lunes a viernes · 13:00–16:00`
3. Current date, price and courses when available
4. Stable unavailable-today state when absent
5. `Ver la carta completa` and `Cómo llegar`

Reuse the established nocturnal/editorial landing vocabulary. Do not add new images unless an existing Deriva asset accurately represents weekday lunch.

**Step 4: Add responsive styles**

Meet the repository responsive contract at 1440, 430, 390, 375 and 320 px. Use `min-width: 0`, `max-width: 100%`, fluid typography and a single-column mobile composition.

**Step 5: Run tests and typecheck**

Expected: PASS.

**Step 6: Commit**

```bash
git add 'app/(landing)/menu-ejecutivo' tests/seo/executive-menu-page.test.ts
git commit -m "feat(menu): add permanent executive menu page"
```

### Task 4: Add broad discovery entry points to the homepage

**Skills:** @superpowers:test-driven-development, @vercel:nextjs

**Files:**
- Modify: `app/(landing)/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/seo/landing-coffee-highlights.test.ts`
- Modify: `tests/seo/responsive-contract.test.ts`

**Step 1: Write failing tests**

Assert that the homepage contains:

- natural hero support copy mentioning breakfast, brunch, lunch and Menú Ejecutivo;
- a visible link to `/menu-ejecutivo`;
- a substantial midday section rather than a hidden metadata-only keyword list;
- no hard-coded daily dishes or Menú Ejecutivo price;
- responsive width constraints for the new section.

**Step 2: Run tests and verify failure**

Expected: FAIL because the broader visible content and route link are absent.

**Step 3: Implement minimal visible changes**

Update the hero supporting paragraph to:

```text
Una cafetería de especialidad en Providencia, Santiago, con desayunos, brunch,
almuerzos y Menú Ejecutivo de lunes a viernes, además de espresso, filtrados y
cafés de autor.
```

Add a single editorial midday section that explains the weekday service and links to `/menu-ejecutivo`. Keep specialty coffee first in the hierarchy and avoid duplicating the full daily menu.

**Step 4: Run tests and typecheck**

Expected: PASS.

**Step 5: Commit**

```bash
git add 'app/(landing)/page.tsx' app/globals.css tests/seo/landing-coffee-highlights.test.ts tests/seo/responsive-contract.test.ts
git commit -m "feat(landing): surface brunch and weekday lunch"
```

### Task 5: Expand menu and discovery metadata

**Skills:** @superpowers:test-driven-development, @vercel:nextjs

**Files:**
- Modify: `app/(landing)/menu/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `app/llms.txt/route.ts`
- Modify: `tests/seo/local-business.test.ts`
- Modify: `tests/seo/menu-schema.test.ts`

**Step 1: Write failing tests**

Assert that:

- `/menu` metadata includes specialty coffee, breakfast, brunch, lunch, Menú Ejecutivo, onces and bakery;
- sitemap contains `/menu-ejecutivo` with a high priority and frequent refresh;
- `llms.txt` describes Menú Ejecutivo, Monday–Friday 13:00–16:00, brunch and the permanent route;
- no expired campaign or hidden-product text appears.

**Step 2: Run and verify failure**

Expected: FAIL for the missing lunch intent and route.

**Step 3: Implement the discovery updates**

Keep `/menu` canonical. Add `/menu-ejecutivo` to the sitemap with `changeFrequency: "daily"`. Keep `llms.txt` factual and Spanish-only; do not state today's courses or price there because it is cached longer than the daily edition.

**Step 4: Run full SEO tests and typecheck**

Expected: PASS.

**Step 5: Commit**

```bash
git add 'app/(landing)/menu/page.tsx' app/sitemap.ts app/llms.txt/route.ts tests/seo
git commit -m "feat(seo): index brunch and executive lunch"
```

### Task 6: Update the Google Business Profile operating copy

**Skills:** @deriva-studio

**Files:**
- Modify: `../../09_marketing/google_business_profile_copy.md`

**Step 1: Draft and count the new permanent description**

Use Chilean Spanish and keep it under 750 characters. Include specialty coffee, breakfast, brunch, lunch, Menú Ejecutivo, bakery and onces without links, promotions or repetitive keywords.

**Step 2: Add the exact profile checklist**

Document:

- primary café category retained;
- secondary categories inspected in the authenticated profile before selection;
- preferred menu URL `https://derivastudio.cl/menu`;
- proposed menu sections;
- weekday Menú Ejecutivo post cadence;
- required photos and performance metrics;
- rule that daily courses come only from the currently published endpoint.

**Step 3: Verify the character count and current public facts**

Use a UTF-8-aware character counter and compare the menu terms with the live Spanish public API.

**Step 4: Apply profile changes only in an authenticated owner/manager session**

Read the profile first, make the smallest supported edits, then verify the public result. Do not alter the registered business name or publish unsupported categories.

### Task 7: Complete automated and rendered verification

**Skills:** @superpowers:verification-before-completion, @paper-desktop:code-to-design

**Files:**
- Verify only; modify targeted files only if a test or visual review exposes a real defect.

**Step 1: Run the full automated gate**

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run test:seo
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run typecheck
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build
```

Expected: zero failed tests, TypeScript exit 0 and successful production build.

**Step 2: Verify rendered pages**

Inspect `/`, `/menu` and `/menu-ejecutivo` at 1440×900, 430, 390, 375 and 320 px. Confirm no horizontal scrolling, clipping, overlapping controls or missing primary actions.

**Step 3: Verify public data boundaries**

Confirm:

- today’s published Menú Ejecutivo is shown verbatim;
- no daily edition produces the stable unavailable state;
- all 12 hidden catalog products remain absent from visible content and structured data;
- canonical URLs, metadata, JSON-LD, sitemap and `llms.txt` are correct.

**Step 4: Port visual changes to Paper**

Create or update 1440×900 and 390×844 artboards using the actual rendered copy, brand tokens and layout. Capture screenshots, evaluate spacing, typography, contrast, alignment and artboard fit, then call `finish_working_on_nodes`.

**Step 5: Obtain explicit user approval**

Show both Paper screenshots. Do not run any Vercel deployment command until the user explicitly approves the visuals.

**Step 6: Deploy and verify production after approval**

Deploy a preview, verify it, promote to production, and then re-check `/`, `/menu`, `/menu-ejecutivo`, `sitemap.xml`, `llms.txt` and rendered JSON-LD. Only after production verification should Google Business Profile menu links or posts point to the new permanent page.
