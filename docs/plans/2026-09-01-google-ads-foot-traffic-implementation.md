# Google Ads Foot-Traffic Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconfigure the existing Deriva Coffee Studio Performance Max campaign to maximize physical store visits and direction requests within CLP 124,640 per month while reusing the website's canonical local-SEO intent architecture.

**Architecture:** Keep one Performance Max campaign and its historical Maps/store-visit data. Use campaign-specific offline goals, presence-only geographic targeting, two SEO-aligned asset groups, constrained landing destinations and narrow negative controls. Record every live mutation with read-after-write evidence in a durable campaign history.

**Tech Stack:** Google Ads web console, Performance Max, Google-hosted local actions, Deriva Next.js SEO facts, Markdown operational history.

---

### Task 1: Preserve the approved budget cap

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** Read the live campaign budget.

Expected before state: CLP 17,200/day.

**Step 2:** Set the average daily budget to CLP 4,100.

Expected monthly spending limit: CLP 124,640.

**Step 3:** Read the campaign table again.

Expected: campaign and account total both show `CLP4,100/day`.

**Step 4:** Record the before state, after state, evidence and rollback value in the history file.

**Step 5:** Commit the documentation.

```bash
git add docs/campaign/google-ads-optimization-history.md
git commit -m "docs(ads): record monthly budget cap"
```

### Task 2: Correct campaign-specific conversion goals

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** Read current campaign goals.

Expected: campaign-specific `Phone call leads` with Maximize conversions.

**Step 2:** Edit campaign-specific goals.

Select only:

- Store visit.
- Get directions.

Remove Phone call lead from campaign optimization.

**Step 3:** Save and read the campaign settings again.

Expected: the optimization summary names store visits and directions and no longer names phone-call leads.

**Step 4:** Record the exact live result and rollback procedure.

### Task 3: Make geographic targeting physically local

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** Confirm the existing included location.

Expected: 5 km around Magnere 1570, Providencia.

**Step 2:** Preserve the radius and change Location options to:

`Presence: People in or regularly in your included locations`.

**Step 3:** Save and reopen Locations.

Expected: the same 5 km radius and Presence-only inclusion mode.

**Step 4:** Record the exact result and rollback procedure.

### Task 4: Align assets and search signals with canonical SEO

**Files:**
- Reference: `src/seo/local-business.ts`
- Reference: `src/seo/executive-menu.ts`
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** Read the existing asset group, assets, search themes, audience signals and final URL controls.

Expected: one incomplete asset group, no audience signal, generic themes and unrestricted final URL expansion.

**Step 2:** Complete or rename the first asset group as `Café, desayuno y brunch` and use `/menu` as its primary destination.

**Step 3:** Create the second asset group as `Menú Ejecutivo y almuerzo` and use `/menu-ejecutivo` as its primary destination.

**Step 4:** Reuse existing Deriva images and write factual Spanish assets grounded in the canonical site copy.

**Step 5:** Add the seven canonical local search themes from `LOCAL_SEARCH_INTENTS`.

**Step 6:** Add audience signals based on local café, breakfast, brunch and weekday-lunch intent when the console exposes compatible segments. Signals must not broaden the 5 km presence-only boundary.

**Step 7:** Add or configure a page feed restricted to `/`, `/menu` and `/menu-ejecutivo`; disable unrestricted final URL expansion if required to enforce the page set.

**Step 8:** Remove call-oriented assets and clearly irrelevant search themes.

**Step 9:** Read back both asset groups, their destinations, search themes, audience signal status and final URL control.

**Step 10:** Record exact saved values and any platform limitation in the history file.

### Task 5: Verify the complete live configuration

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** Reopen campaign settings and read budget, goals, bidding, store locations, geography, languages and URL controls.

**Step 2:** Reopen asset groups and read status, ad strength, destinations, themes and audience signals.

**Step 3:** Confirm the campaign remains Enabled and Eligible.

**Step 4:** Record the final configuration snapshot and timestamp.

**Step 5:** Commit the completed operational history.

```bash
git add docs/plans/2026-09-01-google-ads-foot-traffic-design.md \
  docs/plans/2026-09-01-google-ads-foot-traffic-implementation.md \
  docs/campaign/google-ads-optimization-history.md
git commit -m "docs(ads): record foot traffic optimization"
```

### Task 6: Review after the learning period

**Files:**
- Modify: `docs/campaign/google-ads-optimization-history.md`

**Step 1:** After 14 days, record spend, impressions, clicks, reach, direction requests, modelled store visits and cost per result.

**Step 2:** Compare against the normalized baseline of approximately 25 modelled visits and 287 direction requests per CLP 124,640.

**Step 3:** Do not optimize from a single low-volume day. Record any recommended change before applying it.

**Step 4:** Repeat the full comparison after 30 days.

