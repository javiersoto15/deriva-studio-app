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

## 2026-09-02 (later same day) - Ads console reached; appeal submitted and live state read back

The earlier entry recorded the Ads work as blocked by a `Verify it's you` interstitial. The founder re-authenticated. The console session lives in a **different Chrome profile** from the one first used, which is why the first tab kept hitting the sign-in wall while other Ads tabs looked signed in; the browser named `Deriva` holds the working session. Everything below is live readback from account 934-597-8419.

### Business-name asset - APPEAL SUBMITTED

Asset row before: `Deriva Studio` - Business name - Campaign level - `Not eligible / Disapproved (Business Information - Name Prominence)`, last updated May 22 2026.

The appeal was submitted from the asset's policy panel with:

- Reason for appeal: **Made changes to comply with policy** (accurate - the landing pages were changed and verified in production earlier today).
- Scope: **All affected ads in the account**.
- The attestation checkbox was accepted on the basis that the fix is real and verifiable at `https://derivastudio.cl/`, `/menu` and `/menu-ejecutivo`.

Google returned **`Appeal accepted.`** and the panel's action changed from `Appeal` to **`Track appeal`**. The asset name was NOT changed: it remains `Deriva Studio`.

The asset status stays `Not eligible` while the review runs - Google states explicitly that the status will not change during the review process.

### Budget - verified compliant

Live campaign row: **`CLP9,800/day`**. Account total row: **`CLP9,800/day`**. That is CLP 297,920 over Google's 30.4-day month, inside the CLP 300,000 cap and below the CLP 9,868/day ceiling. **Not changed** - it was already compliant. Raising it to 9,868 would recover about CLP 2,067/month; left alone deliberately rather than touching a live budget for a ~0.7% gain.

### Conversion objectives - verified, calls are off

From Goals > Conversions > Summary, read directly off the goal cards:

| Goal | Campaigns using it | Status |
| --- | --- | --- |
| Get directions | **1 of 1** | Active |
| Store visit | **1 of 1** | Needs attention |
| Phone call lead (account-default) | **0 of 1** | Needs attention |
| Contact | **0 of 1** | Active |

Calls are **not** a campaign objective (`0 of 1`). Directions and store visits are the campaign's conversion intent, and Get directions - the primary physical-visit signal - is **Active**.

The `Needs attention` on Store visit resolves to the generic notice: *"You may need to fix some issues to use this goal in optimization and see it in results reporting. Check your conversion actions' Status and Actions columns for issues."* It is a measurement/reporting caveat on store-visit modelling, not a serving block, and Get directions is unaffected.

### Campaign state - enabled, eligible, and serving

Precise distinction, since these are not the same thing:

- **Enabled** - yes. Green status dot on the campaign row.
- **Eligible** - yes. Status column reads `Eligible`.
- **Asset groups** - both `Café, desayuno y brunch` and `Menú Ejecutivo y almuerzo` are enabled and now read **`Eligible`**. This is a change from the previous entry, where both were `Pending - Asset group under review`. Ad Strength on both is still **`Incomplete`**.
- **Actually serving** - yes. Reporting window Aug 26 - Sep 1 2026: **62,215 impressions, CLP 109,358 cost**, optimization score 81%. The campaign is transacting in the auction. (That window still contains days at the old CLP 17,200/day budget; the reduction to CLP 9,800/day was made on 2026-09-02, so this spend rate is not the go-forward rate.)

So the campaign is serving in aggregate. What is *not* demonstrated is serving on the six specific target queries.

### Ad Preview and Diagnosis - all six target searches

Tool configured for Location `Providencia, Santiago Metro...`, Language `Spanish`, Device `Mobile`, Audience `Users not in any audience`.

| Query | Result |
| --- | --- |
| menu ejecutivo providencia | Your ad isn't showing |
| menú ejecutivo providencia | Your ad isn't showing |
| almuerzo providencia | Your ad isn't showing |
| almuerzo cerca | Your ad isn't showing |
| café en providencia | Your ad isn't showing |
| cafe providencia | Your ad isn't showing |

Every query returned the same Results-tab reason: **`No diagnoses results were found because no keywords in your account matched your query`**.

**This is not evidence that the search themes are ineligible.** Ad Preview and Diagnosis is a keyword-based diagnostic. This account runs Performance Max, which uses search themes, not keywords, so the tool has nothing to match against and cannot report on PMax eligibility for a given query. The correct reading is: *this diagnostic cannot answer the question for this campaign type*. It is the same result recorded in the earlier entry and it did not change with the landing-page fix, because the fix does not create keywords.

### Cause attribution for the six queries

Ranked by what the evidence actually supports:

1. **Diagnostic blind spot (confirmed).** The tool cannot evaluate PMax search themes. Absence in Ad Preview is uninformative here.
2. **Business-name asset still not eligible (confirmed).** Appeal submitted today, under review; status will not change until Google finishes.
3. **Ad Strength `Incomplete` on both asset groups (confirmed).** Weaker asset coverage limits how often PMax can assemble an eligible ad for a given query.
4. **Ad Rank / auction dynamics at CLP 9,800/day (not measurable from here).** A lower budget reduces auction participation; PMax never guarantees coverage of a named query.
5. **Not a targeting or budget-exhaustion issue** as far as can be shown: geo, language and device match the intended Providencia audience, the campaign is Eligible, and it is spending.

**Conclusion:** the two web-side blockers are fixed and verified in production, the appeal is submitted and accepted, budget and conversion goals are confirmed correct, and the campaign is enabled, eligible and serving. The specific high-intent queries remain unproven, and the honest next lever - if guaranteed coverage of those exact searches is the goal - is a tightly bounded Search campaign with exact/phrase keywords, which would also make Ad Preview meaningful. That decision is still open.

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
- [x] Business-name asset appealed as `Made changes to comply with policy`; Google returned `Appeal accepted.` Asset name unchanged (2026-09-02).
- [x] Budget verified live at CLP 9,800/day on both campaign and account rows — within the CLP 9,868/day ceiling. Deliberately not raised.
- [x] Conversion goals verified live: Get directions 1 of 1 Active, Store visit 1 of 1, Phone call lead 0 of 1.
- [x] Campaign verified Enabled + Eligible and demonstrably serving (62,215 impressions, CLP 109,358, Aug 26 - Sep 1).
- [x] Both asset groups now read `Eligible` (previously pending review); Ad Strength still `Incomplete` on both.
- [x] Ad Preview and Diagnosis run for all six target queries — all `Your ad isn't showing`, all with the keyword-matching diagnostic limitation.
- [ ] Google review of the business-name appeal completed — pending; status stays `Not eligible` during review.
- [ ] Ad Strength raised from `Incomplete` on both asset groups.
- [ ] Decide whether exact-query coverage warrants a separate Search campaign after asset review.

## 2026-09-02 17:19 CLT - Search campaigns published; 20% café weighting applied

The founder approved publication and then requested that the Café Search campaign be 20% larger than the Menú Search campaign. The final whole-peso allocation preserves the existing account ceiling:

| Campaign | Type | Live daily budget | Live status |
| --- | --- | ---: | --- |
| `Deriva Coffee Studio` | Performance Max | CLP 3,000 | Enabled / Eligible |
| `Search | Menú Ejecutivo | Providencia` | Search | CLP 3,091 | Enabled / Eligible (Learning) |
| `Search | Café, Filtrados y Desayuno | Providencia` | Search | CLP 3,709 | Enabled / Eligible (Learning) |
| **Account total** |  | **CLP 9,800/day** | **CLP 297,920 per 30.4-day month** |

CLP 3,709 / CLP 3,091 = 1.19994, the nearest whole-peso allocation to exactly 20% while keeping Performance Max at CLP 3,000 and the account total at CLP 9,800/day.

### Menú Ejecutivo Search campaign

- Campaign ID: `24204239910`.
- Published 2026-09-02 and read back in the live campaign table as Enabled / Eligible (Learning).
- Maximize Clicks with a CLP 900 maximum CPC.
- 13 exact/phrase keywords covering Menú Ejecutivo, almuerzo, menú del día and local lunch intent.
- Final URL: `https://derivastudio.cl/menu-ejecutivo`.
- Schedule: Monday-Friday, 10:30-16:00, Chile account time.
- Network: Google Search only; Search Partners and Display expansion disabled.
- Location: 5 km around Magnere 1570, Presence-only.
- Language: Spanish.
- Campaign goals: Get directions and Store visits. Phone-call goals were removed and Phone calls was not selected as a result type.
- AI Max broad search-term expansion was left off; review stated `Using only your keywords and match types`.

### Café, Filtrados y Desayuno Search campaign

- Campaign ID: `24204249834`.
- Published 2026-09-02 and read back in the live campaign table as Enabled / Eligible (Learning).
- Maximize Clicks with a CLP 900 maximum CPC.
- 50 exact/phrase keywords covering café de especialidad, cafetería Providencia, V60, Chemex, pour over, coffee flight, café de autor, espresso tonic, descafeinado, café en grano, breakfast/brunch/pastry, brand, mate and cowork-café intent.
- User-requested mate coverage includes `mate providencia`, `mate en providencia`, `servicio de mate`, `servicio de mate providencia`, `cafetería con mate`, and `café y mate providencia`.
- User-requested cowork coverage includes `cowork café`, `cowork café providencia`, `café cowork providencia`, `cafetería para trabajar providencia`, and `café para trabajar`.
- Final URL: `https://derivastudio.cl/menu`.
- Schedule: Monday-Friday 08:00-21:00 and Saturday 10:00-21:00, matching the published Deriva hours; Sunday excluded.
- Network: Google Search only; Search Partners and Display expansion disabled.
- Location: 5 km around Magnere 1570, Presence-only.
- Language: Spanish.
- Campaign goals: Get directions and Store visits. Phone-call goals were removed and Phone calls was not selected as a result type.
- Review stated `Using only your keywords and match types`. The launch uses one consolidated ad group so low-volume exact/phrase terms can gather data before evidence-based theme splitting.
- The responsive Search Ad mentions café de especialidad, filtrados, desayuno, mate, V60, Chemex, brunch and café para trabajar. It does not claim Wi-Fi, desks, outlets, terrace access or unlimited stays.

### Live verification

The final Campaigns table contained all three enabled campaigns with budgets CLP 3,000, CLP 3,091 and CLP 3,709, and the account-total row read **CLP 9,800/day**. Both Search campaigns read **Eligible (Learning)** and showed `Maximize clicks`; Performance Max read **Eligible**. Publication is confirmed, but zero initial impressions/clicks on the new campaigns are expected immediately after launch and are not yet serving proof for individual queries.

### Post-launch checks still pending

- [ ] Confirm first impressions and qualified search terms after Google's initial review/learning period.
- [ ] Run Ad Preview and Diagnosis for the six priority Search queries once the campaigns have had time to enter auctions.
- [ ] Add Search-campaign negative keywords only after impact preview and early search-term review.
- [ ] Add and verify `Carta`, `Menú Ejecutivo`, `Cómo llegar` and `Reseñas` sitelinks.
- [ ] Inspect the Search asset view and explicitly confirm that no call asset is attached.

## 2026-09-03 - Maps visibility regression diagnosis

**Reported symptom:** Deriva stopped appearing for `cafetería en Providencia` after the 2026-09-02 campaign changes, while immediately adjacent competitors such as Caos and Creta remained visible. The founder requested consolidation to one or two campaigns.

**Reproduction:** A Maps search centered on Deriva's exact coordinates did not include Deriva in the initial result list. `Caos dinning and coffee`, approximately 20 metres away, appeared with primary category `Espresso bar`, rating 4.8 and 145 reviews. `Creta Café`, also approximately 20 metres away, has primary category `Espresso bar`, rating 4.5 and 52 reviews. Deriva's listing is active and managed, with primary category `Coffee shop`, secondary categories Restaurant, Brunch restaurant and Breakfast restaurant, rating 4.6 and 30 reviews.

**Business Profile health:** No suspension, verification or core-information error was visible. The profile strength is complete; address, hours, website, menu, dining options and categories are populated. Google Ads Data Manager shows the Business Profile linked, and the enabled account-level location asset reported 6,865 impressions and 150 clicks in the same-day view.

**Confirmed paid-distribution change:** Before the split, Performance Max held CLP 9,800/day and had the historical Maps evidence recorded above: 1,159 hosted direction requests and 99.50 modelled store visits in the August baseline. On 2026-09-02, Performance Max was reduced to CLP 3,000/day and CLP 6,800/day was allocated to two new Search campaigns using Maximize Clicks. This is a 69.4% reduction in the campaign designed around Get directions and Store visits and is the change most directly capable of reducing paid Maps placement.

**Organic versus paid distinction:** Google Ads changes cannot directly demote the organic Maps listing. They can remove or reduce a sponsored Maps placement that visually resembles a normal local result. The current organic comparison also shows a prominence disadvantage: Deriva has 30 reviews versus Creta's 52 and Caos's 145 at essentially the same distance.

**Entity consistency observation:** The live website now visibly uses `Deriva Studio`, but Google's indexed organic result and the Business Profile description still contain `Deriva Coffee Studio`. The Ads business-name asset remains disapproved for Name Prominence while its appeal is pending. This is a real cross-surface inconsistency during re-crawl, but there is not enough evidence to attribute the Maps regression to it rather than to the confirmed PMax budget reduction.

**Recommended consolidation:** Keep two campaigns, not one: (1) Performance Max for Maps, directions and store visits; (2) one Search campaign for controlled high-intent queries, with separate tightly themed ad groups for Café and Menú Ejecutivo. Consolidating to only Performance Max would lose exact-query control; consolidating to only Search would weaken Maps/local inventory.

## 2026-09-03 - Two-campaign recovery and local-search expansion

The founder approved consolidating to two active campaigns while preserving the CLP 9,800/day account ceiling and prioritizing paid Maps reach. The live allocation was changed to:

| Campaign | Type | Live daily budget | Live status after change |
| --- | --- | ---: | --- |
| `Deriva Coffee Studio` | Performance Max | CLP 6,000 | Enabled / Eligible |
| `Search | Café, Filtrados y Desayuno | Providencia` | Search | CLP 3,800 | Enabled / Eligible (Limited) |
| `Search | Menú Ejecutivo | Providencia` | Search | CLP 3,091 | Paused |
| **Active account total** |  | **CLP 9,800/day** | **CLP 297,920 per 30.4-day month** |

Performance Max therefore receives 61.2% of the active budget and consolidated Search receives 38.8%; CLP 6,000 is 57.9% larger than CLP 3,800. This is no longer a direct Café-versus-Menú weighting because Performance Max contains both Café and Menú/Almuerzo asset groups. Those groups continue to cover Maps, directions, store visits and lunch intent. The separate Menú Search campaign was paused, not deleted, so its configuration and history remain recoverable.

### Café Search keyword expansion

Twenty exact/phrase local-intent keywords were added to the existing café ad group, increasing the live keyword count from 50 to 70:

- `[cafetería en providencia]`, `"cafetería en providencia"`
- `[café de especialidad en providencia]`, `"café de especialidad en providencia"`
- `[filtrados providencia]`, `"filtrados providencia"`
- `[mejor café de providencia]`, `"mejor café de providencia"`
- `[mejor cafetería en providencia]`, `"mejor cafetería en providencia"`
- `[cafeterías en providencia]`, `"cafeterías en providencia"`
- `[cafés en providencia]`, `"cafés en providencia"`
- `[café especialidad providencia]`, `"café especialidad providencia"`
- `"café de especialidad cerca de mí"`, `"café filtrado cerca de mí"`
- `"mejor café providencia"`, `"mejores cafeterías providencia"`

Immediate readback showed the principal category terms (`cafetería en providencia`, `cafeterías en providencia`, `cafés en providencia`, `café de especialidad cerca de mí`, and `mejores cafeterías providencia`) pending review. Several longer variants immediately showed `Low search volume`; they remain useful exact-intent coverage but should not be expected to generate steady traffic alone. No broad-match keywords or AI Max expansion were enabled.

### Responsive Search Ad improvement

A second responsive Search Ad was prepared with all 15 headline slots and all four description slots. Its live editor score improved from **Poor** to **Good** before submission. The copy uses truthful local signals including `Cafetería en Providencia`, `Café de Especialidad`, `Filtrados en Providencia`, `Café Cerca de Mí`, `Café Providencia`, `Café Para Trabajar`, `V60`, `Chemex`, `Magnere 1570`, directions and `Deriva Studio`. It deliberately does not claim to be the best café; `mejor café` is used only as search intent.

Google account verification was completed from the founder's iPhone on 2026-09-03. The ad was then submitted successfully. Google's save confirmation stated that it found no policy issues. Read-after-write in the live Ads table showed the second RSA as **Enabled / Eligible**, with all 15 headlines and four descriptions present. Its ad-strength column was still `Pending` immediately after submission while Google processed the new version; the original Poor-strength RSA remains eligible during that review.

### Preserved controls and next checks

- Active daily budget remains CLP 9,800, approximately CLP 297,920 per 30.4-day month.
- Search remains 5 km around Magnere 1570, Presence-only, Spanish and Google Search only.
- Optimization remains Get directions and Store visits; phone-call leads remain excluded.
- Re-run Ad Preview and Diagnosis after the new keywords and RSA finish review.
- Compare paid Maps presence plus Search impression share after at least one full business day; judge direction/store-visit trends after 7 days.
- Review actual search terms before adding negatives or widening match types.

### Immediate post-submission visibility diagnosis

Ad Preview and Diagnosis was run as a mobile user in Providencia, Spanish, immediately after the stronger RSA was published. This is an auction sample, not a guarantee that the same result occurs on every search.

| Search | Immediate result | Google diagnosis |
| --- | --- | --- |
| `cafetería en providencia` | Not shown in this sample | Exact keyword matched; Google says the ad is probably shown at times but was not shown for this diagnosis. |
| `café de especialidad en providencia` | Not shown in this sample | Four keywords matched. Some candidate ads lost to other ads from the same ad group with equal or higher Ad Rank; one candidate was probably shown at other times; another had no specific explanation. |
| `filtrados providencia` | Not shown | Google found no currently eligible matching keyword, consistent with the newly added exact/phrase variants still processing or carrying low-search-volume status. |
| `mejor café de providencia` | Not shown in this sample | Two keywords matched. One candidate was probably shown at times; another lost to an ad with equal or higher Ad Rank. |

This verifies that the founder's visibility complaint is real even though the campaign is enabled and spending. The immediate problem is not a missing campaign or exhausted account budget: it is a combination of auction rank, intermittent serving, and keyword eligibility/review. The newly submitted stronger RSA is intended to improve relevance and Ad Rank but must be re-tested after processing. Do not claim first position or sponsored Maps coverage until Ad Preview, impression-share/top-impression metrics and a live Maps test provide evidence.

### Monitoring instruction

A daily thread monitor named `Deriva Ads visibility and visits` was created for 10:30 Chile time. It must remain read-only unless the founder explicitly authorizes another mutation. It checks the two-campaign budgets and statuses, runs the four priority query diagnoses, compares impressions/clicks/cost plus Search top-impression metrics when available, and compares Get directions and Store visits against the saved baseline and prior run. It only reports meaningful changes, review completion, configuration drift, actionable blockers or enough data for the seven-day decision.

## 2026-09-03 - Narrow filtered-coffee cleanup and serving proof

The founder asked to stop spending keyword attention on narrow `filtrados` searches while continuing to communicate that Deriva offers filtered coffee. The following three zero-impression, low-search-volume targets were permanently removed from the consolidated Search campaign:

- `[filtrados providencia]`
- `"filtrados providencia"`
- `"café filtrado cerca de mí"`

The live Enabled/Paused keyword count decreased from 70 to 67. Filtered coffee remains represented by the broader `[café filtrado]` and `"café filtrado"` keywords, V60, Chemex, pour-over terms, and the responsive Search Ad copy that mentions filtrados, V60 and Chemex. No budget, schedule, location, goal or network setting changed.

### Fresh delivery and query diagnostics

- Search campaign readback: Enabled / Eligible (Limited), CLP 3,800/day, with Google describing the limitation as `Missing enough relevant keywords` while the expanded set continues processing.
- Yesterday's Search keyword report: 520 impressions, 23 clicks, 4.42% CTR and CLP 4,741 cost.
- `cafetería en providencia`: the official mobile/Spanish/Providencia diagnosis matched `[cafetería en providencia]`; Google reported that the ad is probably shown at times but was not shown for that individual auction sample.
- `mejor cafetería en providencia`: the diagnosis matched three keywords. One candidate explicitly reported `Your ad is showing`; the other candidates lost to equal-or-higher-ranked ads from the same ad group. This confirms campaign eligibility and intermittent serving, not guaranteed placement on every personalized search.
- The enabled Business Profile location asset is linked at account level to all locations. Its live row for `Deriva Studio`, Magnere 1570, Loc 105, Providencia reported 513 impressions, 23 clicks, 4.48% CTR and CLP 4,741 cost yesterday.
- The separate `Deriva Studio` business-name asset remains disapproved for `Business Information - Name Prominence`. This asset-level branding review does not disable the enabled location asset or the serving Search ads.

The active account ceiling remains CLP 9,800/day: CLP 6,000/day Performance Max plus CLP 3,800/day consolidated Search, approximately CLP 297,920 per 30.4-day month. Organic Maps order is separate from paid eligibility and cannot be guaranteed by an Ads mutation.

## 2026-09-03 - Specialty-coffee and live Maps confirmation

A fresh official Ad Preview and Diagnosis test used mobile, Spanish and Providencia for `café de especialidad en providencia`. Four keywords matched. The exact `[café de especialidad providencia]` candidate explicitly returned **Your ad is showing**; two broader candidates lost to equal-or-higher-ranked ads from the same ad group and one candidate returned no specific reason. This proves eligible specialty-coffee serving in the tested auction without implying that every auction or personalized search will show the ad.

A separate live Google Maps search for `cafetería en providencia` returned **Deriva Studio as the first visible result**, labeled **Sponsored**, with category `Coffee shop`, the Magnere 1570 address and the current opening-hours summary. This is direct evidence of recovered paid Maps placement in that test. It does not establish first-place organic ranking because the observed result was sponsored.

### Business-name asset diagnosis

- The campaign-level `Deriva Studio` business-name asset remains Not eligible / Disapproved for `Business Information - Name Prominence`; its last-updated timestamp is Sep 2, 2026 at 5:18 PM.
- Google's policy defines Name Prominence as the advertiser's business name not being clearly present on the ad landing page.
- Current live readback of `https://derivastudio.cl/menu` shows `DERIVA STUDIO` in the primary navigation and `Deriva Studio` in the page title. The business name also matches the `derivastudio.cl` domain identity. The current page therefore contains the requested legacy name prominently; the disapproval reflects an earlier review or crawler state.
- Policy Manager shows one Sep 2 appeal with reason `Made changes to comply with policy`. Its status is **In progress**, while the Results column reads **Error: try again**.
- No duplicate appeal was submitted. Wait for the existing appeal to resolve or become retryable; meanwhile, the separate Business Profile location asset remains Enabled and the live Maps test confirms it can serve.

## 2026-09-03 - Fresh backend appeal submitted for business-name asset

After the Sep 2 Policy Manager appeal remained stuck with **Status: In progress** and **Results: Error: try again**, Google Ads Help Center support reviewed the `Deriva Studio` business-name asset and the current landing-page text. Its assessment found `Deriva Studio` clearly present on `https://derivastudio.cl/menu` and described the disapproval as a possible automated misclassification, while noting that its visual page analysis had timed out and that the assessment could be imperfect.

With the founder's explicit approval, Google support submitted a fresh backend appeal for business-name asset `363658264059` in campaign `24204249834` (`Search | Café, Filtrados y Desayuno | Providencia`).

- Appeal ID: `59103255`
- Submission result shown by Google: successfully submitted
- Expected result channel: Google Ads **Policy Manager / Appeal History**, not email
- No campaign budget, keywords, targeting, bidding, schedule, goals or other assets were changed during this support action.

The appeal submission is confirmed, but approval is not. Continue tracking the asset in Policy Manager until Google records a final result.

## 2026-09-04 review brief prepared

### Changes to carry into the next-day analysis

- Account ceiling: CLP 9,800/day, approximately CLP 297,920 per 30.4-day month.
- Active distribution: Performance Max CLP 6,000/day and consolidated Café Search CLP 3,800/day; Menú Search remains paused.
- Search intent focuses on cafeteria, specialty coffee, best-café and local Providencia discovery. Narrow `filtrados providencia` variants were removed, while filtered coffee remains represented through `café filtrado`, V60, Chemex and truthful ad copy.
- The stronger responsive Search Ad was submitted and read back as Enabled / Eligible.
- Phone-call goals remain excluded. Direction requests, store visits and foot traffic remain the business outcomes.
- Targeting remains 5 km around Magnere 1570, Presence-only, Spanish and Google Search.
- The latest live Maps evidence showed Deriva Studio first and Sponsored for `cafetería en providencia`; this was paid placement, not proof of first-place organic ranking.
- Business-name asset appeal `59103255` was successfully submitted through Google support and is awaiting a final Policy Manager decision.

### Next-day comparison checklist

1. Diagnose `cafetería en providencia`, `café de especialidad en providencia`, `cafetería de especialidad en providencia`, `mejor café de providencia` and `menú ejecutivo providencia` from Providencia on mobile.
2. Run a live Maps search for `cafetería en providencia` and report Sponsored and organic placement separately.
3. Compare impressions, clicks, CTR, cost, Search impression share, top-impression rate, directions and store visits with the September 3 baseline.
4. Check the review state of the stronger responsive Search Ad and Appeal ID `59103255`.
5. Verify budgets, targeting and conversion-goal exclusions have not drifted. Do not mutate the account during analysis without fresh approval.

## 2026-09-04 - First full next-day visibility and performance readback

This was a read-only review of the live Google Ads account. Google reporting was complete through September 3; September 4 intraday reporting was not yet available in the date selector.

### Live configuration

| Campaign | Current status | Current budget | September 3 impressions | Clicks | CTR | Cost |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `Deriva Coffee Studio` | Enabled / Eligible | CLP 6,000/day | 6,356 | 108 | 1.70% | CLP 5,057 |
| `Search | Café, Filtrados y Desayuno | Providencia` | Enabled / Eligible (Limited) | CLP 3,800/day | 2,335 | 80 | 3.43% | CLP 3,906 |
| `Search | Menú Ejecutivo | Providencia` | Paused | CLP 3,091/day while paused | 242 | 12 | 4.96% | CLP 6,106 |
| **Account total** | Two campaigns active | **CLP 9,800/day active ceiling** | **8,933** | **200** | **2.24%** | **CLP 15,069** |

The September 3 cost includes delivery before the Menú Search pause and budget redistribution completed during that transition day, so it must not be interpreted as the steady-state daily cost of the final two-campaign configuration.

The active Search campaign still uses Maximize clicks, a 5 km radius around Magnere 1570, Google Search only, and campaign-specific Get directions and Store visits goals. Search partners, Display Network, AI Max, automatically created assets and campaign-level broad match are off. Phone call lead remains assigned to 0 of 3 campaigns.

### Search performance versus the September 2 baseline

- Search impressions increased from 520 to 2,335: **+1,815 / +349.04%**.
- Search clicks increased from 23 to 80: **+57 / +247.83%**.
- Average CPC fell from approximately CLP 206 to **CLP 49**, a **76.31% reduction**.
- Search cost fell from CLP 4,741 to **CLP 3,906**, down **17.61%**.
- CTR declined from 4.42% to **3.43%**, down 0.99 percentage points, as reach expanded.
- Search impression share was **16.13%**; Search top impression share was **11.29%**; absolute-top impression share was **below 10%**.
- Search lost impression share from rank was **0.00%**. Search lost impression share from budget was **83.87%**. The campaign-level constraint is therefore budget coverage, not Ad Rank, for this reporting day.

The original Poor-strength RSA delivered 2,301 impressions, 80 clicks, 3.48% CTR and CLP 3,906 cost. The new Good-strength RSA was Enabled / Eligible but received only 34 impressions and no clicks on its first reporting day. Google therefore still labels the campaign's ad-strength diagnostic as Poor even though the new Good ad is approved and beginning to serve.

### Official mobile diagnosis from Providencia in Spanish

| Query | September 4 sampled result | Google's diagnosis |
| --- | --- | --- |
| `cafetería en providencia` | Not shown | Exact keyword matched; probably shown at times, but not in this sampled auction. |
| `café de especialidad en providencia` | Not shown | Four keywords matched. Two variants lost to equal-or-higher-ranked ads from the same ad group; Google gave no specific reason for the two specialty-coffee variants. |
| `cafetería de especialidad en providencia` | Not shown | Three keywords matched. One was probably shown at times; two lost to equal-or-higher-ranked ads from the same ad group. |
| `mejor café de providencia` | Not shown | Three keywords matched. One was probably shown at times; two lost to equal-or-higher-ranked ads from the same ad group. |
| `menú ejecutivo providencia` | Not shown | No active Search keyword matched. The dedicated Menú Search campaign is paused; Performance Max is not represented by keyword matching in this diagnostic. |

The five-query snapshot is weaker than the prior same-tool specialty-coffee sample that returned `Your ad is showing`. It does not mean the Search campaign stopped delivering: the previous day recorded 2,335 Search impressions and the live search-term list contains `cafeteria en providencia`, `cafetería en providencia`, `café de especialidad cerca de mi`, `cafetería de especialidad cerca de mi` and related local queries. It does confirm that paid Search presence is not reliable in every priority auction under the current budget share.

### Maps, outcomes and landing-page coverage

- A live Google Maps search for `cafetería en providencia` again returned **Deriva Studio as the first visible result**, labeled **Sponsored**, with category Coffee shop and Magnere 1570. Paid Maps visibility is therefore active in this sample.
- This sponsored result does not establish Deriva's organic Maps rank. Google suppresses a duplicate organic listing in the same result set, so organic order could not be isolated from this ad-bearing view.
- September 3 reported **0.00 Store visits** and **0.00 Directions**. Directions remains Active; Store visits is marked `Needs attention`. Cost per direction or visit is therefore not defined for the day. These modeled/local-action metrics can lag and need a longer window before a performance decision.
- The live landing page continues to show `Deriva Studio`, `Café de especialidad`, `Espresso, filtrados y bebidas con café`, V60, Chemex, pour over, Coffee Flight and mate. Filtered coffee remains strongly represented without using narrow `filtrados providencia` as the primary acquisition target.

### Business-name appeal result

Policy Manager now shows the fresh September 4 appeal for the `Deriva Studio` business-name asset as **Dispute decision / Not reviewed / Failed**. Appeal ID `59103255` therefore did not produce a manual approval. The original September 2 appeal still shows **In progress / Error: try again**, and the asset remains disapproved for Name Prominence. This branding-asset failure is separate from the enabled location asset and the confirmed Sponsored Maps delivery.

### Decision checkpoint

Do not make another same-day change from this single transition-day result. The data proves materially higher Search reach and much lower CPC, but also shows that the CLP 3,800/day Search allocation leaves most eligible impressions uncovered. Any next optimization should explicitly choose between preserving CLP 6,000/day for Performance Max Maps coverage and reallocating part of it to Search, or raising the CLP 300,000 monthly ceiling. Continue measuring the stable two-campaign configuration before changing bids, budgets or match types.

## 2026-09-04 - Human-review escalation and seven-day decision plan

The founder approved a seven-day stabilization period through the September 11, 2026 review. No bidding, budget, keyword, ad, asset, goal or Business Profile mutation should be made during this period unless a material failure requires fresh approval.

### Human-review escalation draft

The failed backend appeal must not be resubmitted as another automated appeal. The next request asks Google Ads support to open a human policy case and manually review the asset:

> Please escalate this case to a human Google Ads policy specialist. Account 934-597-8419, campaign 24204249834, business-name asset 363658264059 (`Deriva Studio`). Backend appeal 59103255, submitted September 4, shows `Dispute decision / Not reviewed / Failed`, so it was not manually reviewed. The original September 2 appeal remains `In progress / Error: try again`. The landing page https://derivastudio.cl/menu visibly shows `DERIVA STUDIO` in the primary navigation, `Deriva Studio` in the page title, and the same identity as the derivastudio.cl domain and linked Google Business Profile. Google Ads Help Center previously assessed this as a possible automated misclassification. Please open a human support case, manually review the Name Prominence disapproval, and provide the case/reference number and the exact evidence required if you still consider the asset non-compliant. Do not file another automated backend appeal.

This message is prepared but must be sent only after action-time confirmation.

### September 11 primary KPIs

1. **Search visibility:** Search impression share and Search top impression share for the consolidated Search campaign. Baseline: 16.13% overall share and 11.29% top share. The decision threshold is sustained impression share below 20% with more than 70% lost to budget.
2. **Local reach:** daily live Maps result for `cafetería en providencia`, recorded separately as Sponsored and organic/unknown. The guardrail is preserving Sponsored Maps placement in at least five of seven sampled days before reallocating Performance Max budget.
3. **Foot-traffic outcomes:** Get directions plus modeled Store visits, reported separately and together. Treat zero or delayed modeled visits cautiously; the seven-day trend is a decision input, not definitive incrementality proof.

### Driver and efficiency guardrails

- Diagnose `cafetería en providencia`, `café de especialidad en providencia`, `cafetería de especialidad en providencia`, `mejor café de providencia` and `menú ejecutivo providencia` daily from Providencia on mobile.
- Track impressions, clicks, CTR and average CPC. Guardrails: CTR at or above 3.0% and average CPC at or below CLP 100 while reach expands.
- Track the Good-strength RSA's share of impressions and clicks. It needs enough delivery to compare with the original Poor-strength RSA; do not judge it from the initial 34-impression sample.
- Keep the active budget ceiling at CLP 9,800/day and phone-call goals excluded.

### September 11 decision ladder

- **Hold the 6,000 / 3,800 allocation** if paid Maps remains present, Search impression share reaches at least 20%, top share improves and direction/store-visit signals begin accumulating.
- **Propose a bounded reallocation within the same CLP 9,800/day ceiling** if Maps is stable in at least five of seven samples while Search share remains below 20% and budget loss remains above 70%. The first candidate is Performance Max CLP 5,300/day and Search CLP 4,500/day; it requires fresh founder approval before implementation.
- **Do not solve weak visibility by broadening indiscriminately.** If CTR falls below 3%, CPC rises above CLP 100 or irrelevant search terms grow, clean query quality before adding budget.
- **Escalate measurement separately** if Directions remains zero and Store visits remains `Needs attention`; campaign allocation should not be optimized against a broken or materially delayed outcome signal.
