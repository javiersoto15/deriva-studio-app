# Google Ads Foot-Traffic Optimization Design

**Date:** 2026-09-01  
**Status:** Approved for implementation  
**Campaign:** Deriva Coffee Studio  
**Market:** People physically in or regularly within 5 km of Magnere 1570, Providencia

## Objective

Use the existing Google Ads campaign to increase qualified physical visits and direction requests while keeping the approved monthly spending limit below CLP 125,000. Reuse Deriva's canonical local-SEO positioning so paid and organic discovery reinforce the same customer intents.

Phone calls are explicitly out of scope as an optimization goal.

## Baseline

Live account review for 2026-08-02 through 2026-08-31:

| Metric | Baseline |
| --- | ---: |
| Spend | CLP 504,351 |
| Impressions | 255,649 |
| Clicks | 9,670 |
| CTR | 3.78% |
| Average CPC | CLP 52 |
| Primary conversions | 3 phone-call leads |
| Cost per primary conversion | CLP 168,117 |
| Google-hosted direction requests | 1,159 |
| Modelled store visits | 99.50 |

Channel cost distribution:

- Maps: CLP 221,415, approximately 44%.
- Discover: CLP 177,172, approximately 35%.
- Google Search: CLP 98,790, approximately 20%.
- Display, Gmail, YouTube and Search partners: approximately CLP 7,000 combined.

The top ten visible search terms spent CLP 114,071 with no phone-call conversions. Most were broad variants of `cafetería cerca de mí`. The campaign nevertheless recorded substantial Maps direction requests and modelled store visits, which were reported but excluded from campaign bidding.

## Current-State Gaps

- Campaign-specific bidding optimizes only for phone-call leads.
- Store visits and directions are not selected for the campaign.
- The 5 km radius uses `Presence or interest`, allowing traffic from people outside the physical service area.
- The sole asset group is incomplete and has no audience signals.
- Search themes include generic terms such as `cafe`, `café espresso`, `cafe descafeinado en grano` and `cafetería cerca de mí` without the canonical Providencia intent hierarchy.
- Final URL expansion is enabled without a page feed, so paid traffic is not explicitly constrained to the three intended discovery destinations.
- The website's tested local-SEO strategy already has a stronger intent architecture than the paid campaign.

## Chosen Approach

Retain and rehabilitate the existing Performance Max campaign instead of creating a new Search campaign.

This preserves the campaign's Maps and store-visit history, avoids splitting the small budget, and keeps access to local Google inventory. The trade-off is that channel allocation remains automated. Targeting, conversion goals, landing destinations and creative themes will provide the control layer.

## Campaign Design

### Budget and bidding

- Average daily budget: CLP 4,100.
- Monthly spending limit: CLP 124,640 using Google's 30.4 multiplier.
- Initial bid strategy: Maximize conversions without a target CPA.
- Do not raise the budget during the first 30-day observation period.

### Conversion goals

Use campaign-specific goals:

1. Store visits as the primary physical-outcome signal.
2. Get directions as the supporting high-intent local action.

Remove phone-call leads from campaign optimization. Keep page views, engagement and other account goals available for reporting but not campaign bidding.

### Geography

- Preserve the existing 5 km radius around Magnere 1570.
- Change the inclusion mode from `Presence or interest` to `Presence: People in or regularly in the included location`.
- Do not broaden the radius during the first observation period.

### Intent and landing architecture

Reuse the canonical SEO hierarchy from `src/seo/local-business.ts`:

1. `café de especialidad en Providencia`
2. `cafetería en Providencia`
3. `desayuno en Providencia`
4. `brunch en Providencia`
5. `almuerzo en Providencia`
6. `Menú Ejecutivo en Providencia`
7. `Menú Ejecutivo de lunes a viernes`

Paid landing destinations:

- `/` for the physical place and brand.
- `/menu` for coffee, breakfast and brunch intent.
- `/menu-ejecutivo` for weekday lunch intent.

Restrict final URL expansion through an explicit page feed or equivalent campaign control so other application routes cannot receive paid traffic accidentally.

### Asset groups

Use two coherent asset groups inside the existing campaign:

1. **Café, desayuno y brunch**
   - Destination: `/menu`
   - Positioning: specialty coffee, espresso, filtrados, cafés de autor, breakfast and brunch in Providencia.
2. **Menú Ejecutivo y almuerzo**
   - Destination: `/menu-ejecutivo`
   - Positioning: weekday lunch, Monday to Friday 13:00-16:00, current edition and directions to Magnere 1570.

Reuse existing Deriva images and factual website language. Do not invent promotions, prices, awards, availability or product photography. Remove call-oriented copy and assets.

### Search controls

- Replace generic themes with the canonical local-intent set.
- Add only clearly irrelevant negative themes at first: employment, recipes, courses, coffee machines and wholesale-equipment intent.
- Do not exclude `near me` or equivalent local-discovery language until the corrected store-visit and direction goals have produced comparable data.

## Measurement

The old campaign generated approximately 19.7 modelled visits and 230 direction requests per CLP 100,000. At the new monthly cap, an unchanged-efficiency baseline is approximately:

- 25 modelled store visits per month.
- 287 direction requests per month.

These are baselines, not promises. The optimization should preserve or improve qualified reach while reducing irrelevant geographic and intent leakage.

Primary KPI: modelled store visits.  
Secondary KPI: Google-hosted direction requests.  
Guardrails: total monthly spend, cost per modelled visit, cost per direction, local reach, impressions and click volume.

Review after 14 and 30 days. Avoid intervening changes during the initial 14-day learning period unless spending, eligibility or serving is broken.

## Change-Control Rules

- Record every live mutation and read-after-write result in `docs/campaign/google-ads-optimization-history.md`.
- Never record customer data, payment details, account authentication data or bearer tokens.
- Keep budget, goals, geography, assets and search controls as separate history entries even when applied in one session.
- Preserve a rollback description for every material change.

