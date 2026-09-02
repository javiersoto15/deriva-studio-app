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

## Pending live mutations

- [ ] Campaign goals changed to Store visits and Get directions.
- [ ] Phone call leads removed from campaign optimization.
- [ ] Geographic inclusion changed to Presence-only with the 5 km radius preserved.
- [ ] Café/desayuno/brunch asset group completed and verified.
- [ ] Menú Ejecutivo/almuerzo asset group created and verified.
- [ ] Canonical local search themes applied.
- [ ] Audience signals added where compatible.
- [ ] Paid landing destinations constrained to the approved page set.
- [ ] Final campaign eligibility and serving state verified.

