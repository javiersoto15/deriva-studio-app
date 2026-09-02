# Google Ads Search Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add exact/phrase Search coverage for Deriva's high-intent local menu, specialty-coffee, filtrados, breakfast, mate and cowork café searches without exceeding CLP 300,000/month.

**Architecture:** Two intent-specific Search campaigns receive CLP 3,400/day each while the existing Performance Max campaign is reduced to CLP 3,000/day. Search uses tightly themed ad groups, relevant landing pages, Presence-only local targeting, campaign-specific directions/store-visit goals, and phrase negatives.

**Tech Stack:** Google Ads web console, Google Ads Keyword Planner, Deriva production website, Markdown change history.

---

### Task 1: Record the approved structure

**Files:**
- Create: `docs/plans/2026-09-02-google-ads-search-expansion-design.md`
- Create: `docs/plans/2026-09-02-google-ads-search-expansion-implementation.md`

1. Record the approved campaigns, budget split, keyword sets, exclusions, schedules, bidding guardrail and verification criteria.
2. Confirm the daily total is CLP 9,800 and the 30.4-day monthly equivalent is CLP 297,920.
3. Commit the planning documents before making live account mutations.

### Task 2: Stage the Menú Ejecutivo Search campaign

**Live surface:** Google Ads account 934-597-8419

1. Create `Search | Menú Ejecutivo | Providencia` as a Search campaign.
2. Set CLP 3,400/day, Maximize Clicks, and a CLP 900 max CPC.
3. Set Spanish, the existing 5 km Magnere 1570 radius, and Presence-only targeting.
4. Use campaign-specific `Get directions` and `Store visits`; exclude phone-call goals.
5. Set Monday-Friday 10:30-16:00.
6. Create the approved exact/phrase keyword set with `/menu-ejecutivo` as the final URL.
7. Add a Responsive Search Ad using only the published four-time menu, weekday-hours, Providencia location and directions claims.
8. Add sitelinks and the approved phrase negatives. Do not add a call asset.
9. Stop before the final action that publishes spend unless action-time confirmation has been obtained.

### Task 3: Stage the Café Search campaign

**Live surface:** Google Ads account 934-597-8419

1. Create `Search | Café, Filtrados y Desayuno | Providencia` at CLP 3,400/day with Maximize Clicks and CLP 900 max CPC.
2. Reuse Spanish, the 5 km Presence-only location, and campaign-specific directions/store-visit goals.
3. Create four ad groups: `Café de especialidad`, `Filtrados y orígenes`, `Desayuno y brunch`, and `Mate y cowork`.
4. Add the approved exact/phrase keywords, including the narrow mate and cowork café additions.
5. Point product/menu intent to `/menu`; use `/` only where it improves brand/cowork relevance.
6. Create Responsive Search Ads using menu-verified claims. Do not claim Wi-Fi, desks, outlets, terrace or unlimited stays.
7. Add the shared sitelinks and phrase negatives. Do not add a call asset.
8. Stop before the final action that publishes spend unless action-time confirmation has been obtained.

### Task 4: Rebalance Performance Max and publish

**Live surface:** Google Ads account 934-597-8419

1. Obtain action-time confirmation covering both Search campaign publications and the Performance Max budget reduction.
2. Reduce `Deriva Coffee Studio` from CLP 9,800/day to CLP 3,000/day.
3. Publish both Search campaigns at CLP 3,400/day each.
4. Confirm the account's combined daily budget is CLP 9,800/day.
5. Add only the safe missing Performance Max exclusions after reviewing Google's impact warning.

### Task 5: Verify the live configuration

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

1. Read back all three campaign statuses and daily budgets.
2. Verify directions/store-visit goals, no phone-call optimization, no call assets, Presence-only location, Spanish, schedules, keyword match types and negatives.
3. Re-run Ad Preview and Diagnosis for `menú ejecutivo providencia`, `almuerzo providencia`, `café de especialidad providencia`, `café filtrado`, `mate providencia`, and `cowork café providencia`.
4. Record whether each campaign is draft, pending review, eligible or serving; do not equate publication with serving.
5. Append the exact timestamp, settings and readback evidence to the campaign history.
6. Commit the history update separately from the pre-mutation plan.

### Task 6: First performance checkpoint

**Timing:** After enough data accumulates, normally 7-14 days.

1. Review search terms, impressions, clicks, CPC, directions and store-visit evidence by campaign and ad group.
2. Add negatives for irrelevant queries, especially employment, recipes, equipment, café con piernas and non-foot-traffic intent.
3. Keep exact/phrase terms that generate qualified local traffic; pause wasteful terms only with evidence.
4. Reallocate within the unchanged CLP 9,800/day total rather than increasing the monthly cap.
5. Record every change and its reason in the optimization history.
