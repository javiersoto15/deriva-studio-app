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
