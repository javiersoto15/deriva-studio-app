# Specialty Coffee Local SEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Deriva Coffee Studio more discoverable for Spanish searches for specialty coffee in Providencia and Santiago while keeping the live 79-item public menu as the only product source of truth.

**Architecture:** Centralize stable local-business facts and linked-data builders in testable TypeScript modules. Keep `/` focused on the physical café and derive its coffee highlights from `GET /public/menu?locale=es-CL`; keep `/menu` exhaustive and build visible content plus structured data from that same response. Treat Google Business Profile and Search Console as verified external surfaces with read-before-write and read-after-write checks.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Schema.org JSON-LD, `tsx --test`, Vercel, Google Business Profile, Google Search Console, Paper Desktop.

---

### Task 1: Add testable Spanish local-search facts and linked-data builders

**Files:**
- Create: `src/seo/local-business.ts`
- Create: `tests/seo/local-business.test.ts`
- Modify: `package.json`

**Step 1: Add the failing test command**

Add this script to `package.json`:

```json
"test:seo": "tsx --test tests/seo/*.test.ts"
```

Create tests asserting that the canonical description:

- contains `café de especialidad`, `Providencia`, and `Santiago`;
- contains no pre-opening or waitlist language;
- uses only the confirmed address, phone, hours, website, menu URL, and Instagram URL;
- produces linked `Organization`, `CafeOrCoffeeShop`, and `WebSite` nodes with stable `@id` references;
- does not contain `aggregateRating`, `review`, hidden product names, or English keyword targets.

**Step 2: Run the tests and confirm failure**

Run:

```bash
npm run test:seo
```

Expected: FAIL because `src/seo/local-business.ts` does not exist.

**Step 3: Implement the minimal facts module**

Export immutable values for:

```ts
export const SITE_URL = "https://derivastudio.cl";
export const SITE_NAME = "Deriva Coffee Studio";
export const MENU_URL = `${SITE_URL}/menu`;
export const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";
export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago";
export const LOCAL_SEO_DESCRIPTION =
  "Deriva Coffee Studio es una cafetería de especialidad en Providencia, Santiago: espresso, filtrados V60 y Chemex, cafés de autor, desayunos y cocina en Magnere 1570 Local 105.";
```

Add `buildLocalBusinessGraph()` returning a single `@graph` with linked Organization, Café, and WebSite nodes. Preserve the verified phone, email, address, coordinates, hours, price range, payment methods, and menu URL from the current homepage schema. Use Spanish service categories only.

**Step 4: Run the focused tests**

Run:

```bash
npm run test:seo
```

Expected: PASS.

**Step 5: Commit**

```bash
git add package.json src/seo/local-business.ts tests/seo/local-business.test.ts
git commit -m "test(seo): centralize local business facts"
```

### Task 2: Replace stale root metadata and emit the linked business graph

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(landing)/page.tsx`
- Modify: `tests/seo/local-business.test.ts`

**Step 1: Extend the failing assertions**

Add source-level assertions that root metadata imports `LOCAL_SEO_DESCRIPTION`, the homepage imports `buildLocalBusinessGraph`, and the old sentence `Únete a nuestra lista para conocer la fecha de apertura` no longer exists.

**Step 2: Run the tests and confirm failure**

Run `npm run test:seo`.

Expected: FAIL on stale metadata or missing imports.

**Step 3: Update root metadata**

In `app/layout.tsx`:

- use `LOCAL_SEO_DESCRIPTION`;
- keep the title `Deriva Coffee Studio | Café de especialidad en Providencia`;
- reduce keywords to natural Spanish intent: café de especialidad, cafetería en Providencia, café en Santiago, espresso, café filtrado, V60, Chemex, café de autor, Coffee Flight, granos de café, desayunos, brunch;
- retain the Spanish `es-CL` canonical language signal;
- keep index/follow and social metadata unchanged except for the current description.

In `app/(landing)/page.tsx`, replace inline business objects with one serialized `buildLocalBusinessGraph()` result. Do not add unverifiable rating or review data.

**Step 4: Run tests and typecheck**

```bash
npm run test:seo
npm run typecheck
```

Expected: both PASS.

**Step 5: Commit**

```bash
git add app/layout.tsx 'app/(landing)/page.tsx' tests/seo/local-business.test.ts
git commit -m "feat(seo): align homepage with local specialty coffee intent"
```

### Task 3: Derive homepage coffee highlights from the public menu

**Files:**
- Create: `src/seo/landing-coffee-highlights.ts`
- Create: `tests/seo/landing-coffee-highlights.test.ts`
- Modify: `src/components/landing/CartaScroller.tsx`
- Modify: `app/(landing)/page.tsx`

**Step 1: Write failing selector tests**

Build a small `PublicMenuView` fixture containing public items plus hidden-looking distractors. Assert that the selector:

- traverses section items and subgroup items;
- considers only `available: true` public items;
- selects configured public coffee IDs in stable order;
- formats CLP from `price_label` when present and otherwise from `price_clp`;
- returns no internal catalog item not present in the supplied public view;
- returns fewer cards when a configured item is missing instead of inventing a fallback.

Initial preferred IDs:

```ts
[
  "espresso",
  "cappuccino",
  "pour-over",
  "coffee-flight",
  "espresso-tropical",
  "bolsa-cafe-250g"
]
```

Resolve the exact live IDs before finalizing the fixture and configuration; do not guess them from display names.

**Step 2: Run the tests and confirm failure**

Run `npm run test:seo`.

Expected: FAIL because the selector does not exist.

**Step 3: Implement the pure selector**

Create `selectLandingCoffeeHighlights(menu: PublicMenuView): CartaChip[]`. Keep presentation-only metadata such as photo slug and split display name in a map keyed by public menu ID, but take `name`, `description`, and price from the live public item.

Update `CartaScroller` to accept a `seasonLabel` prop and display `Carta vigente` when the backend season is absent. Do not hard-code `Otoño 2026`.

**Step 4: Replace hard-coded homepage cards**

In `app/(landing)/page.tsx`:

- remove `cartaChips` and all hard-coded product prices;
- add a cached `getPublicMenuView({ locale: "es-CL" })` read inside a Suspense-compatible server component;
- render selected public highlights when available;
- render a compact, non-product fallback with a link to `/menu` if the public response is unavailable;
- update the hero supporting sentence to naturally include `cafetería de especialidad en Providencia, Santiago` while retaining the existing H1 and visual hierarchy.

**Step 5: Run tests and build checks**

```bash
npm run test:seo
npm run typecheck
npm run build
```

Expected: PASS; build completes with the homepage fallback available during prerender.

**Step 6: Commit**

```bash
git add src/seo/landing-coffee-highlights.ts tests/seo/landing-coffee-highlights.test.ts src/components/landing/CartaScroller.tsx 'app/(landing)/page.tsx'
git commit -m "feat(menu): source landing coffee highlights from public carta"
```

### Task 4: Strengthen menu metadata and linked structured data

**Files:**
- Create: `src/seo/menu-schema.ts`
- Create: `tests/seo/menu-schema.test.ts`
- Modify: `app/(landing)/menu/page.tsx`

**Step 1: Write failing structured-menu tests**

Use a `PublicMenuView` fixture with visible and unavailable items. Assert that the schema builder:

- creates `WebPage`, `Menu`, `MenuSection`, `MenuItem`, and `Offer` nodes;
- links the page to `${SITE_URL}/#website` and `${SITE_URL}/#cafe`;
- includes only items present in the supplied public menu view;
- reflects visible prices and availability;
- never introduces the 12 hidden catalog names.

**Step 2: Run tests and confirm failure**

Run `npm run test:seo`.

Expected: FAIL because `src/seo/menu-schema.ts` does not exist.

**Step 3: Extract and improve the schema builder**

Move `menuItemJsonLd` and `buildMenuJsonLd` into `src/seo/menu-schema.ts`. Return a linked graph with stable IDs such as:

```ts
`${MENU_URL}#webpage`
`${MENU_URL}#menu`
`${MENU_URL}#section-${section.id}`
```

Keep markup aligned with visible HTML. Do not add reviews, ratings, nutritional claims, or availability not present in the response.

Update menu metadata to:

- title: `Carta de café de especialidad en Providencia`;
- description: a natural Spanish summary of the complete current offering and location;
- canonical: `https://derivastudio.cl/menu`.

**Step 4: Run focused and compile checks**

```bash
npm run test:seo
npm run typecheck
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/seo/menu-schema.ts tests/seo/menu-schema.test.ts 'app/(landing)/menu/page.tsx'
git commit -m "feat(seo): link public menu structured data"
```

### Task 5: Clean discovery surfaces and engineering documentation

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/llms.txt/route.ts`
- Modify: `docs/engineering/deployment-and-seo.md`
- Modify: `tests/seo/local-business.test.ts`

**Step 1: Add failing sitemap and discovery assertions**

Assert that:

- the sitemap includes `/`, `/menu`, `/resenas`, and `/privacidad`;
- it excludes `/deriva-match-up` and `/deriva-match-up/bases`;
- it does not use `new Date()` as a fake content modification time;
- `llms.txt` is Spanish, links the canonical menu, and names only verified public categories and specialty-coffee preparations.

**Step 2: Run tests and confirm failure**

Run `npm run test:seo`.

Expected: FAIL on expired campaign URLs and fabricated timestamps.

**Step 3: Implement the cleanup**

- Remove the expired campaign URLs from `app/sitemap.ts`.
- Omit `lastModified` until it can be sourced from a real content timestamp.
- Update `llms.txt` to Spanish-only local intent and the current public coffee program.
- Remove the stale claim that the homepage emits a different schema graph than the code.
- Replace stale `Claim Google Business Profile` language with a neutral inspect-and-verify workflow until live ownership state is confirmed.

**Step 4: Run tests and full build**

```bash
npm run test:seo
npm run typecheck
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add app/sitemap.ts app/llms.txt/route.ts docs/engineering/deployment-and-seo.md tests/seo/local-business.test.ts
git commit -m "chore(seo): remove stale discovery signals"
```

### Task 6: Correct the live public-menu season without exposing hidden items

**Files:**
- Read: `../13_companion_backend/AGENTS.md`
- Read: `../13_companion_backend/docs/openapi.yaml`
- Runtime only: `GET/PUT /admin/public-menu`

**Step 1: Authenticate without printing credentials**

From `../13_companion_backend`:

```bash
eval "$(make --silent menu-agent-env)"
```

**Step 2: Read and save the complete live payload**

Resolve the production API URL using the configured Cloud Run service or the currently verified production fallback. Fetch `GET /admin/public-menu` and record counts and the current season without logging the bearer token.

Expected preflight: season `Otono 2026`; the full administrative layout contains more rows than the schedule-filtered public view.

**Step 3: Apply the smallest mutation**

Change only the top-level season to `Invierno 2026`. Preserve every section, subgroup, item ID, offer, service window, schedule, and ordering field exactly. Submit the complete payload to `PUT /admin/public-menu`.

**Step 4: Verify admin and public state**

Read back:

```bash
GET /admin/public-menu
GET /public/menu?locale=es-CL&schedule=weekday
GET /public/menu?locale=es-CL&schedule=weekend
GET /public/menu?locale=en&schedule=weekday
GET /public/menu?locale=pt-BR&schedule=weekday
```

Expected:

- season is `Invierno 2026`;
- Spanish public item count remains 79 for the current presentation;
- the 12 hidden catalog products remain absent;
- all existing locale responses continue to work;
- no price, availability, section, or ordering delta exists besides season.

### Task 7: Verify rendered SEO and visual behavior locally

**Files:**
- No new source files unless a defect is found.

**Step 1: Start the app with the bundled runtime**

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" \
npm run dev -- --hostname 127.0.0.1 --port 3000
```

**Step 2: Inspect rendered pages**

Verify `/` and `/menu` at desktop plus 430, 390, 375, and 320 px widths. Confirm:

- no layout overflow;
- brand H1 remains intact;
- supporting copy names specialty coffee and location naturally;
- homepage cards use current public names and prices;
- `/menu` still renders the complete current menu;
- hidden products do not appear.

**Step 3: Inspect rendered HTML**

Use `curl` against the local server and assert title, description, canonical, JSON-LD graph IDs, sitemap membership, and Spanish `llms.txt` text.

**Step 4: Run final automated verification**

```bash
npm run test:seo
npm run typecheck
npm run build
```

Expected: all PASS.

### Task 8: Port visible changes to Paper and obtain release approval

**Files:**
- Paper Desktop artboards; no repository path unless exported references are requested.

**Step 1: Use the required design workflow**

Use `paper-desktop:code-to-design` to create or update homepage artboards from the verified local render.

**Step 2: Produce required breakpoints**

- Mobile: 390 × 844
- Desktop: 1440 × 900
- Add tablet only if the composition changes materially.

**Step 3: Show screenshots to the user**

Call out the revised supporting copy, current coffee cards, and corrected live menu season. Wait for explicit visual confirmation before any Vercel deployment.

### Task 9: Audit and optimize the authenticated Google Business Profile

**Files:**
- Modify outside the webapp repo: `../09_marketing/google_business_profile_copy.md`

**Step 1: Inspect the current profile**

Use the user's authenticated browser session if available. Record the current business name, verification state, primary/secondary categories, description, address, map pin, phone, regular and special hours, website, menu URL, attributes, photos, and review counts. Do not change anything during this pass.

**Step 2: Prepare exact Spanish changes**

Update `../09_marketing/google_business_profile_copy.md` with:

- a current description under 750 characters grounded in the public menu;
- exact field-by-field recommendations;
- photo subjects and upload cadence;
- compliant review-request and response guidance;
- a dated baseline of visible profile facts.

Do not add links, prices, promotions, or keyword stuffing to the description.

**Step 3: Apply narrow profile changes**

When authenticated owner controls are available:

- preserve the exact business name;
- select only verified categories available in Google's Chilean picker;
- set website to `https://derivastudio.cl/`;
- set menu URL to `https://derivastudio.cl/menu`;
- update the approved Spanish description;
- correct only factual hours/contact/attributes confirmed by the live operation.

**Step 4: Verify saved public state**

Reload the profile in customer/public view and confirm every edited field. Report any field pending Google's review separately from fields confirmed live.

### Task 10: Deploy, request indexing, and record the baseline

**Files:**
- Modify if needed: `docs/engineering/deployment-and-seo.md`

**Step 1: Deploy a preview after Paper approval**

Use the repository's Vercel deployment workflow. Verify `/`, `/menu`, `/sitemap.xml`, `/robots.txt`, and `/llms.txt` on the preview URL.

**Step 2: Request explicit production approval**

Show preview evidence and wait for a new explicit `ship`, `promote`, or equivalent instruction.

**Step 3: Promote to production and verify**

Check production HTML, JSON-LD, menu counts, public-only highlights, sitemap, and HTTP status. Confirm hidden products remain absent.

**Step 4: Request indexing**

In Search Console URL Inspection, request indexing for:

```text
https://derivastudio.cl/
https://derivastudio.cl/menu
```

Submit or re-read `https://derivastudio.cl/sitemap.xml` and confirm there are no submission errors.

**Step 5: Record baseline and review dates**

Capture available Search Console and Google Business Profile performance metrics without exposing customer data. Schedule comparisons at 14 and 30 days; do not promise a ranking position.

