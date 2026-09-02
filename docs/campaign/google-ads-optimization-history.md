# Google Ads Optimization History

This file is the durable, non-sensitive audit trail for Deriva Coffee Studio Google Ads changes. It records business intent, before/after settings, live readback evidence and rollback guidance. It must not contain credentials, payment details, customer data or authentication identifiers.

## 2026-09-01 - Baseline review

**Requested outcome:** Understand current spending, cap monthly campaign costs, and optimize for physical visits and directions by reusing Deriva's local-SEO strategy.

**Live reporting window:** 2026-08-02 through 2026-08-31, Chile account time.

**Campaign state:**

- Type: Performance Max.
- Status: Enabled and Eligible.
- Bid strategy: Maximize conversions.
- Campaign-specific goal: Phone call leads.
- Average daily budget: CLP 17,200.
- Implied monthly spending limit: CLP 522,880.
- Store locations: one location group.
- Geographic target: 5 km around Magnere 1570, Providencia.
- Geographic inclusion: Presence or interest.
- Language: Spanish.
- Asset groups: one incomplete asset group.
- Audience signals: none.
- Final URL behavior: expansion enabled; no page feed.

**Performance baseline:**

- Spend: CLP 504,351.
- Impressions: 255,649.
- Clicks: 9,670.
- CTR: 3.78%.
- Average CPC: CLP 52.
- Primary phone-call conversions: 3.
- Cost per primary conversion: CLP 168,117.
- Google-hosted direction requests: 1,159.
- Modelled store visits: 99.50.

**Finding:** The campaign reported meaningful Maps activity and store visits but did not use either as a bidding goal. Broad local queries were therefore evaluated against phone calls rather than the desired physical outcome.

## 2026-09-01 - Budget cap

**Authorization:** User approved a CLP 125,000 monthly ceiling and explicitly confirmed the change.

**Mutation:**

- Before: CLP 17,200/day.
- After: CLP 4,100/day.
- Monthly spending limit after change: CLP 124,640.

**Read-after-write evidence:** The campaign row and account total both displayed `CLP4,100/day`; the campaign remained Enabled and Eligible.

**Rollback:** Restore CLP 17,200/day only with explicit new spending authorization.

## 2026-09-01 - Approved optimization design

**Business priority:**

1. Physical store visits.
2. Direction requests and weekday Menú Ejecutivo traffic.
3. No phone-call optimization.

**Approved design:**

- Retain the existing Performance Max campaign and its history.
- Preserve the 5 km radius and change the inclusion mode to Presence-only.
- Replace Phone call leads with Store visits and Get directions campaign goals.
- Keep the CLP 4,100/day budget and Maximize conversions initially.
- Use two SEO-aligned asset groups: Café/desayuno/brunch and Menú Ejecutivo/almuerzo.
- Restrict paid destinations to `/`, `/menu` and `/menu-ejecutivo`.
- Use the canonical Spanish local intents from `src/seo/local-business.ts`.
- Avoid further tuning during the first 14 days unless serving is broken.

**Detailed design:** `docs/plans/2026-09-01-google-ads-foot-traffic-design.md`  
**Execution plan:** `docs/plans/2026-09-01-google-ads-foot-traffic-implementation.md`

## 2026-09-01 - Foot-traffic conversion goals

**Mutation:**

- Before: campaign-specific `Phone call leads`.
- After: campaign-specific `Get directions, Store visits`.
- Bid strategy retained: Maximize conversions.
- Budget retained: CLP 4,100/day.

**Read-after-write evidence:** The campaign settings optimization summary displayed `Get directions, Store visits`; the Conversion goals field displayed `Campaign-specific: Get directions, Store visits`; Phone call leads was absent from both saved summaries.

**Platform notice:** Google Ads warned that performance may fluctuate for one to two weeks while the bid strategy adjusts to the changed campaign-specific goals.

**Rollback:** Re-select Phone call leads only if the business explicitly restores phone acquisition as a campaign objective. Do not combine it with the approved physical-outcome goals by default.

## 2026-09-01 - Presence-only geographic targeting

**Mutation:**

- Radius preserved: 5 km around Magnere 1570, Providencia.
- Before: `Presence or interest`.
- After: `Presence: People in or regularly in your included locations`.

**Read-after-write evidence:** The saved Locations panel showed one included location, the same 5 km radius, and the Presence-only radio selected. Campaign settings continued to show CLP 4,100/day and `Get directions, Store visits`.

**Rollback:** Restore Presence or interest only after a documented decision to pay for customers outside the physical service area who merely show interest in Providencia.

## 2026-09-02 - SEO-aligned asset groups and landing rules

**Mutation:** The original asset group was renamed `Café, desayuno y brunch` and a second asset group, `Menú Ejecutivo y almuerzo`, was created. Existing approved image assets were reused; no synthetic images or video were introduced.

**Café, desayuno y brunch:**

- Added local headlines for desayuno, almuerzo, brunch and Menú Ejecutivo in Providencia.
- Added long headlines and a description anchored to Magnere 1570 and weekday Menú Ejecutivo service.
- Replaced generic themes with the seven canonical Spanish local intents from `src/seo/local-business.ts`.
- Added Coffee Shop Regulars, Frequently Eats Breakfast Out and Frequently Eats Lunch Out as audience signals.
- Added an asset-group URL rule for `https://derivastudio.cl/menu`.

**Menú Ejecutivo y almuerzo:**

- Added 15 headlines, four long headlines and five descriptions focused on weekday lunch, directions and the live Menú Ejecutivo.
- Added five lunch-intent search themes, including `almuerzo en Providencia`, `Menú Ejecutivo en Providencia` and `Menú Ejecutivo de lunes a viernes`.
- Added Frequently Eats Lunch Out as the audience signal.
- Added an asset-group URL rule for `https://derivastudio.cl/menu-ejecutivo`.

**Phone treatment:** Both explicit campaign call assets were removed. Phone calls remain excluded from campaign optimization. A Business Profile phone action may still appear automatically in some Google-owned surfaces; removing the public Business Profile phone number was outside the approved scope.

**Read-after-write evidence:** The asset-group table displayed both groups as Enabled, with audience signals and the expected seven and five search-theme counts. Both refreshed groups were `Pending - Asset group under review`; the Menú Ejecutivo group also displayed `Incomplete` ad strength while review and asset eligibility were unresolved.

## 2026-09-02 - Conservative negative keywords

**Mutation:** Added eight campaign-level phrase-match negatives for clearly non-visit intent:

- `"trabajo cafetería"`
- `"empleo cafetería"`
- `"receta de café"`
- `"curso de café"`
- `"cafetera"`
- `"máquina de café"`
- `"máquina espresso"`
- `"equipamiento cafetería"`

**Reach safeguard:** Google Ads' impact preview estimated 0% conversion loss for each phrase before saving. Broad negatives such as `trabajo`, `café` or `mayorista` were intentionally not added because they could suppress legitimate local discovery.

**Read-after-write evidence:** The Negative keywords table displayed all eight entries at Campaign level for `Deriva Coffee Studio`, and Google Ads confirmed that the negative keywords were created.

## 2026-09-02 - Final live readback

- Campaign: Enabled and Eligible.
- Budget: CLP 4,100/day, equivalent to a CLP 124,640 monthly spending limit.
- Geographic reach: one preserved 5 km radius around Magnere 1570, Providencia; Presence-only inclusion was verified after saving.
- Optimization: Maximize conversions with campaign-specific `Get directions, Store visits`; no Phone call leads goal. The Goals summary showed Get directions as Healthy/Active and used by 1 of 1 campaigns. Store visits was used by 1 of 1 campaigns and retained historical modeled results, but its goal status displayed `Needs attention`; recheck this diagnostic at the first measurement checkpoint.
- Structure: two Enabled, SEO-aligned asset groups with audience signals and page-specific URL rules.
- Waste control: eight conservative phrase-match negative keywords.
- Review state: both refreshed asset groups remain pending Google review; do not interpret pending approval as final serving proof.

**Measurement checkpoints:** Use 2026-09-16 as the first 14-day comparison and 2026-10-02 as the 30-day comparison. Compare spend, impressions, targeted local reach, direction requests, modeled store visits and cost per physical action against the 2026-08-02 through 2026-08-31 baseline. Avoid structural changes before the first checkpoint unless ads stop serving or a policy issue blocks the campaign.

## 2026-09-02 - Coverage complaint and CLP 300,000 budget request

**Reported symptom:** Manual Google searches for `menu ejecutivo providencia` and `cafe en providencia` did not display Deriva ads. This was treated as a coverage warning, not as definitive auction evidence, because normal search results vary by location, auction, device, history and personalization.

**Budget request:** Increase the monthly campaign ceiling to CLP 300,000. The safe average-daily equivalent selected was CLP 9,800/day, which maps to CLP 297,920 using Google's 30.4-day monthly calculation.

**Mutation state:** Google initially requested passkey or device confirmation for a budget increase beyond its security threshold. On retry, Google presented a temporary security skip and the authorized change was saved. The campaign row and account-total row both displayed `CLP9,800/day`, equivalent to CLP 297,920 using the 30.4-day monthly calculation.

**Coverage diagnosis:**

- The campaign remained Enabled and Eligible with campaign-specific `Get directions, Store visits` goals.
- Both refreshed asset groups still displayed `Pending - Asset group under review`; the Menú Ejecutivo group also displayed `Incomplete` ad strength and zero post-creation metrics.
- Google Ads' Ad Preview and Diagnosis tool, configured for Providencia, Spanish and mobile, returned `Your ad isn't showing` for both reported queries. Its detailed reason was `No diagnoses results were found because no keywords in your account matched your query`. This account currently uses Performance Max search themes rather than Search-campaign keywords, so that diagnostic does not prove the search themes are ineligible; it confirms there is no keyword-based Search campaign matching those queries.
- Policy Manager showed the campaign-level business-name asset `Deriva Studio` as `Not eligible - Disapproved (Business Information - Name Prominence)`. The website prominently uses `Deriva Coffee Studio`, so the exact legacy name is not currently clear enough on the paid landing pages for Google's prominence check.
- Live inspection showed `https://derivastudio.cl/menu-ejecutivo` resolving to the homepage rather than retaining a dedicated Menú Ejecutivo URL, which weakens the page-specific paid-search relevance intended by that asset group's URL rule.

**Interpretation:** The lower budget materially reduced auction capacity, while asset review and the disapproved business-name asset add serving uncertainty. Raising the budget is appropriate, but a Performance Max campaign cannot guarantee impression coverage for particular search queries. If consistent coverage for these exact high-intent searches is required, plan a tightly bounded Search campaign using exact/phrase keywords after the current assets clear review.

**Business-name decision:** Keep the legacy `Deriva Studio` business-name asset because it matches the umbrella brand and `derivastudio.cl` domain. Do not rename it to `Deriva Coffee Studio`. Google's rule requires the submitted name to be clearly present on the ad landing page; the live pages currently emphasize `Deriva Coffee Studio`. Resolve the policy issue, if pursued, by making `Deriva Studio` visibly prominent on the paid landing pages or by appealing with domain/brand evidence, without changing the asset name.

## 2026-09-02 - Landing-page repair for Name Prominence and Menu Ejecutivo coverage

**Requested outcome:** Remove both blockers identified in the coverage diagnosis above — the `/menu-ejecutivo` redirect and the disapproved `Deriva Studio` business-name asset — then verify production and reopen the campaign.

### Route behaviour changed

**Previous:** `https://derivastudio.cl/menu-ejecutivo` returned `HTTP/2 302` with `location: /`. The page component existed at `app/(landing)/menu-ejecutivo/page.tsx` and was never reached.

**Root cause:** `LANDING_PREFIXES` in `src/middleware/host.ts` listed `/menu` but not `/menu-ejecutivo`. The prefix matcher accepts only an exact match or a following slash, so `/menu` never covered the sibling route and the apex-host fallback redirected it to `/`. Fail-closed allowlist: a missing entry produces a silent 302, not a 404.

**New:** `/menu-ejecutivo` is registered explicitly. Production returns `HTTP/2 200` with no `Location` header.

### Files changed

| File | Change |
| --- | --- |
| `src/middleware/host.ts` | `/menu-ejecutivo` added to `LANDING_PREFIXES` |
| `src/seo/executive-service.ts` *(new)* | `America/Santiago` service-window state machine |
| `src/seo/executive-menu.ts` | Fallback copy, rotation examples, edition-aware status, JSON-LD offer guard |
| `app/(landing)/menu-ejecutivo/page.tsx` | Metadata uses `SITE_NAME`; canonical unchanged |
| `app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx` | Status line, course notes, rotation section, fallback state, visible business name |
| `app/(landing)/menu-ejecutivo/menu-ejecutivo.module.css` | Styles for the above; 320px and 390px fixes |
| `src/seo/local-business.ts` | `SITE_NAME` -> `Deriva Studio`; `alternateName` -> `["Deriva Coffee Studio", "Deriva"]` |
| `src/components/landing/SiteNav.tsx` | Nav brand renders `SITE_NAME` |
| `app/(landing)/page.tsx` | Footer renders the business name and descriptor |
| `app/(landing)/menu/_components/CartaBody.tsx` + `carta.module.css` | Carta colophon renders the business name and descriptor |

### Menu Ejecutivo rendering

Source is the backend only: `GET /public/menu-ejecutivo?locale=es-CL`, fetched `no-store`. `src/data/menu-ejecutivo.ts` is not used by this route.

Service status resolves in `America/Santiago` through `Intl.DateTimeFormat` rather than a fixed UTC offset, because Chile's DST flip (first Sunday of September) would make a hardcoded offset wrong for roughly half the year. States: weekday before 13:00 -> service starts at 13:00; weekday 13:00-16:00 -> available now; weekday after 16:00 -> service finished; Saturday/Sunday -> returns next business day.

Availability is treated as a claim about the offer, not the clock. With no published edition the badge reads `Sin edicion publicada` even inside the service window, so the page never claims something is being served when nothing is published.

The no-edition fallback stays on `/menu-ejecutivo` at HTTP 200. It prints no price, no course and no `Offer` node in the JSON-LD, and carries `Ver la carta completa` -> `/menu` plus a `Como llegar` directions CTA.

A `Como funciona` section explains the four-part rotation using clearly labelled illustrative examples. Those examples live in `EXECUTIVE_MENU_SHAPE` and are excluded from structured data; a test asserts they contain no price or availability language.

### Business-name prominence correction

The asset name is unchanged: `Deriva Studio`. It was not renamed to `Deriva Coffee Studio`.

`Deriva Studio` is now the umbrella business name and is rendered as **visible page text** — not metadata, `aria-label` or JSON-LD alone — on all three paid landing destinations. Live readback of the rendered text, scripts and styles stripped:

- `/` — 3 visible occurrences, 0 occurrences of the legacy name.
- `/menu` — 4 visible occurrences, 0 occurrences of the legacy name.
- `/menu-ejecutivo` — 4 visible occurrences, 0 occurrences of the legacy name.

Placement: the persistent nav lockup on every landing surface, the masthead of `/menu-ejecutivo`, and the footer/colophon of all three. A one-line descriptor, `Cafe de especialidad, cocina y mate en Providencia`, sits beside the name so the identity is not narrowed to the coffee line. No keyword stuffing: a test caps repetitions per surface at three source references.

Structured data on `/`, live readback:

- `Organization` and `CafeOrCoffeeShop` — `name: Deriva Studio`, `alternateName: ["Deriva Coffee Studio", "Deriva"]`, `url: https://derivastudio.cl`.
- Exactly one `CafeOrCoffeeShop` node, linked to one `Organization` via `parentOrganization`. No rival LocalBusiness identity.

### SEO

- Canonical, live: `<link rel="canonical" href="https://derivastudio.cl/menu-ejecutivo"/>`.
- Title, live: `Menu Ejecutivo en Providencia - Deriva Studio`.
- Location present in the meta description and in the rendered footer: `Magnere 1570, Local 105, Providencia`.
- Content is server-rendered; the dish names appear in the initial HTML response.
- Active structured data carries the API-supplied price and courses. Fallback structured data omits the `Offer` and `MenuItem` nodes entirely.

### Budget

Monthly cap: CLP 300,000. Google bills on an average daily budget over an approximate 30.4-day month, so the ceiling is CLP 300,000 / 30.4 = **CLP 9,868/day**. CLP 9,868 x 30.4 = CLP 299,987, inside the cap. CLP 9,900/day would bill CLP 300,960 and breach it.

The 2026-09-02 entry above records the campaign already saved at **CLP 9,800/day** (CLP 297,920/month), which is at or below the 9,868 ceiling and therefore compliant. Raising it to 9,868 would recover about CLP 2,067/month of unused headroom; this was **not** changed, because the live account could not be reached this session (see below).

### Target searches

Unchanged from the entry above, and now matched by a real landing page: `menu ejecutivo providencia`, `menu ejecutivo providencia` (accented), `almuerzo providencia`, `almuerzo cerca`, `cafe en providencia`, `cafe providencia`.

### Conversion objectives

Unchanged and not re-verified live this session: campaign-specific `Get directions, Store visits`; `Phone call leads` remains removed. No calls objective was added.

### Tests and build

- `npm run typecheck` — clean.
- `npm run build` — clean; `/menu-ejecutivo` builds as a Partial Prerender route.
- `npm run test:seo` — 59 passed, 0 failed.
- `npm run test:menu` — 51 passed, 0 failed.
- `npm run test:routing` — 12 passed, 0 failed (new suite, `tests/routing/host.test.ts`).

New coverage: `tests/routing/host.test.ts` (apex, app-subdomain, preview/local and shared-infra routing, including `/menu` unchanged), `tests/seo/executive-service.test.ts` (all four schedule states, both sides of the DST boundary, a half-hourly sweep across a full week, and the no-edition availability guard), `tests/seo/business-name.test.ts` (visible name on each paid surface, no attribute-only satisfaction, structured-data consistency).

The routing suite was confirmed to actually catch the defect: removing the `/menu-ejecutivo` entry makes 2 of 12 tests fail; restoring it returns 12/12.

### Responsive inspection

Inspected in a real browser at 390 px, 320 px and desktop. No horizontal overflow at any width. Three defects were found and fixed during the pass: the rotation heading had silently fallen back to IBM Plex Mono instead of Cormorant Garamond; the new section missed the page gutter at 390 px because `carta.module.css` puts gutters on each block rather than on the page wrapper; and the edition strip clipped mid-word at 320 px.

### Paper review

Ported to the `Web` page of the `Deriva Studio` Paper file before deploy, per the repository's paper-first requirement: `/menu-ejecutivo - Edicion publicada - Mobile` (390), `/menu-ejecutivo - Sin edicion (fallback) - Mobile` (390), `/menu-ejecutivo - Edicion publicada - Desktop` (1440). Approved by the founder before deployment.

### Production verification evidence

Deployment: production target, aliased to `derivastudio.cl`, `www`, `app` and `admin`.

```
$ curl -sI https://derivastudio.cl/menu-ejecutivo
HTTP/2 200
(no Location header)
```

Other landing routes after the change: `/` 200, `/menu` 200, `/sala` 200, `/abierto` 200, `/resenas` 200. `https://app.derivastudio.cl/menu-ejecutivo` still returns 302 to `/inicio`, so the app-host gate is intact.

Rendered content confirmed live on `/menu-ejecutivo`: the published edition (`HOY - MIE 2 SEPT`, `Carne braseada con pure`, the `o Ensalada proteica` alternative, `CLP $10.990`), the `Disponible ahora` status matching the Santiago clock at the time of check (14:47, inside the 13:00-16:00 window), both CTAs, the illustrative-examples label, and `Deriva Studio`.

Directions CTA target resolves: `https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago` returns 200.

The no-edition fallback and the off-hours states were verified against the same shipped build by pointing the server at an unreachable backend and by injecting fixed instants into the unit tests; they could not be forced on production, where a live edition is published and the clock was inside the service window.

### Google Ads review/submission status

**Not performed this session — blocked.** `ads.google.com` returned a `Verify it's you` interstitial for `javier.soto@guardyou.cl`, stating the account must sign in again to continue to Google Ads. Completing that step requires authenticating, which the agent does not do. The pre-existing signed-in Ads tabs in the browser render from an older session and would hit the same wall on any navigation or mutation.

Consequently the following were **not** done and remain open:

- Business-name asset not resubmitted or appealed.
- Budget not re-read live and not raised from CLP 9,800 to CLP 9,868/day.
- Conversion goals not re-verified live.
- Campaign enabled/eligible/serving state not re-read.
- Ad Preview and Diagnosis not re-run for the target queries.

### Remaining reason the campaign is not yet serving these queries

Both root causes named in the coverage diagnosis are now fixed **on the website side**, but neither fix takes effect in the auction until Google re-evaluates:

1. **Business-name asset still disapproved.** The Name Prominence failure was caused by the landing pages emphasising `Deriva Coffee Studio` while the asset said `Deriva Studio`. That mismatch no longer exists. The asset stays disapproved until it is resubmitted or appealed and Google re-reviews the live pages.
2. **Asset groups still pending review** as of the previous entry, including the Menu Ejecutivo group whose URL rule pointed at the previously-redirecting `/menu-ejecutivo`. That URL now resolves, but the group must clear review.
3. **Performance Max does not guarantee query-level coverage.** The earlier Ad Preview result (`no keywords in your account matched your query`) reflects the absence of a keyword-based Search campaign, not proof that the search themes are ineligible. If guaranteed coverage of these exact high-intent searches is required, a tightly bounded Search campaign with exact/phrase keywords remains the option, after the current assets clear review.

**Do not treat the campaign as active.** The landing pages are fixed and verified in production; the business-name asset is not yet resubmitted, and serving has not been observed.

## Pending live mutations

- [x] Campaign goals changed to Store visits and Get directions.
- [x] Phone call leads removed from campaign optimization.
- [x] Geographic inclusion changed to Presence-only with the 5 km radius preserved.
- [x] Café/desayuno/brunch asset group updated and verified in the live table.
- [x] Menú Ejecutivo/almuerzo asset group created and verified in the live table.
- [x] Canonical local search themes applied.
- [x] Audience signals added where compatible.
- [x] Paid landing destinations constrained with asset-group URL rules.
- [x] Conservative negative-keyword exclusions added and verified.
- [x] Campaign eligibility and Enabled state verified.
- [ ] Google review completed for both refreshed asset groups.
- [ ] Menú Ejecutivo asset-group ad strength rechecked after policy review.
- [ ] Store-visit goal `Needs attention` status rechecked at the first measurement checkpoint.
- [x] CLP 9,800/day budget saved and verified in both campaign and account-total rows.
- [x] Landing-page prominence for `Deriva Studio` implemented and verified live on `/`, `/menu` and `/menu-ejecutivo`, with the asset name unchanged (2026-09-02).
- [x] `/menu-ejecutivo` serves HTTP 200 in production instead of redirecting to `/` (2026-09-02).
- [ ] Business-name asset resubmitted or appealed — BLOCKED on Google account re-authentication.
- [ ] Budget re-read live; optional raise from CLP 9,800 to CLP 9,868/day — BLOCKED on re-authentication.
- [ ] Conversion goals and enabled/eligible/serving state re-verified live — BLOCKED on re-authentication.
- [ ] Ad Preview and Diagnosis re-run for the six target queries — BLOCKED on re-authentication.
- [ ] Decide whether exact-query coverage warrants a separate Search campaign after asset review.
