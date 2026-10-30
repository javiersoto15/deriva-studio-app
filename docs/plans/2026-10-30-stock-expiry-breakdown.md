# Stock expiry breakdown implementation plan

> Execution: Astra medium owns decisions and review; one Luna 6 max worker owns the coherent frontend implementation and relevant checks. User approved “Implement this” on 2026-10-30. No deployment or commit is authorized by this plan.

**Goal:** Show how many units expire at each distinct deadline in stock rows and repeat the same quantities, deadlines, and time remaining in the existing share message.

**Architecture:** A shared pure shelf-life presenter groups positive open-lot quantities by expiry instant, orders deadlines, and preserves explicit expired and unknown-age states. The stock list and existing share formatter consume that presentation using the freshly read `StockSnapshot.now`, not the client wall clock. Backend quantities, stored dates, menu visibility, filters, and FIFO adjustments remain unchanged.

**Tech stack:** Next.js / React, TypeScript, existing stock CSS, Node test runner through tsx.

## Approved design and evidence

Always-visible full-width details below each name/count row; the 116px count control stays stable. Dates use America/Santiago and es-CL. Example local snapshot is 2026-10-30T22:00:00Z (19:00): Brownie Chips 8 = 3 due Fri 30 Oct 21:00 (2 h) + 5 due Sun 1 Nov 10:00 (1 d 15 h). Lúcuma Manjar 4 = 2 expired Fri 18:00 + 2 unknown age. Never create these fixtures in production.

Alternatives considered: expandable detail hides urgency; editor-only detail fails the at-a-glance request. Inline detail is approved.

Paper: https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-K-0 . Reference board W63-0; proposed mobile W73-0 and desktop/share WAK-0. This proposal is not a claim that the new implementation already exists.

Integrated visual references (actual images inspected and compared on Paper):
- Uvodo inventory, stable name/quantity lanes (row winner): https://mobbin.com/screens/00a34dc2-db3f-4a71-a408-0508f3e061ff
- Amie, explicit no-date grouping: https://refero.design/pages/57ffa397-9adf-4278-b432-89d417ae8480
- Rise, overdue/today/no-date distinction; reject kanban: https://refero.design/pages/8c382d38-9173-4a87-9943-f288d4f05dc2
- Square timestamped preview (share winner): https://mobbin.com/screens/9f910080-5b50-475e-95f7-503d66b2d2fb
- Lemon Squeezy content preview: https://refero.design/pages/d18b68d3-d7b9-4444-a35f-5336c2c95377
- Workable text-message preview alternative: https://mobbin.com/screens/e863def8-b8d6-49e1-b42e-1026f6b10830

Retain the current Poppins / IBM Plex Mono stock system and warm flat ledger. Refero styles Wispr Flow, Incident, and Telescope support restrained surfaces, utility typography, and sparse decoration; no palette or page redesign. Quantity-specific expiry is a domain adaptation, not a rule claimed from those sources.

## Task 1 — shared expiry presentation, tests first

Files: `src/stock/shelf-life.ts`, `tests/stock/shelf-life.test.ts`.

1. Add failing tests for same-instant grouping, distinct deadlines on one date, earliest-first ordering, zero-lot exclusion, unknown age, unavailable known deadline, expiry boundary, duration floors and Santiago formatting.
2. Run `npm run test:stock` and verify the new tests fail for the missing behavior.
3. Implement one reusable presentation. Preserve backend states and existing `shelfStatus` semantics; do not promote aggregate `last_sale_day` into every bucket. Unknown ages get no invented deadline. A known lot without a valid deadline says `plazo no disponible`.
4. Duration is never rounded up: days/hours above a day, hours/minutes below a day, minutes below an hour, `menos de 1 min` below one minute; nonpositive time is `vencidas, retirar ahora`. Include local month and include year when different from snapshot year.
5. Verify the new tests pass.

## Task 2 — stock row and share message, tests first

Files: `app/(admin)/stock/_components/StockApp.tsx`, `app/(admin)/stock/_components/StockShare.tsx`, `app/(admin)/stock/stock.css`, `src/stock/share.ts`, `tests/stock/share.test.ts` (existing test filename may differ; use the current suite).

1. Add meaningful share assertions for multi-deadline quantity breakdown, unknown/expired rows, ordinary zero exclusion, unchanged untracked/unit/portion formats, and `Se acabó ...` same-day depletion.
2. Render shared details under the existing name/count row, with semantic reading order and wrapping at 320px. Preserve existing status/filter/count/edit behavior.
3. Share uses the exact same detail lines. Keep current title, buttons, error/retry/copy states, and ordinary line formats.
4. Anchor both presentation and the share/depletion cutoff to a valid freshly read server `snapshot.now`. Do not silently replace a missing server clock with an unlabelled client clock for tracked expiry. Preserve supported legacy untracked behavior.
5. Run the stock suite, typecheck, and build with bundled Node.

## Task 3 — review and responsive proof

Use an isolated local fixture or mocked API only; never mutate production. Verify actual rendered list and share at 320, 375, 390, 430, and 1440px; inspect overflow, date wrapping, reading order, count targets, preview scrolling, and reachable share actions. Verify client time-zone/clock drift cannot change the server-anchored output and reopening share fetches fresh data. No WhatsApp send.

Port actual rendered 390x844 and 1440x900 screens to Paper and compare them beside the component winners; record intentional deviations. Run only further tests warranted by changes or failures. Production deployment still requires the project's explicit Paper confirmation/deploy gate.

## Commands

Run from `10_webapp` with:

```sh
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run test:stock
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run typecheck
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build
```

Expected: all checks pass; failures must be diagnosed, not hidden. Report exact checks run, changed paths, screenshot locations, and remaining limitations. Do not commit or deploy.

## Completed local verification

Implemented on 2026-10-30 after explicit user approval. Stock tests 56/56, typecheck, and build passed. Responsive actual-component verification passed list/share at 320/375/390/430/1440, device clock/time-zone drift, fresh share reads, focus return, and a simulated 409 revision-conflict snapshot refresh. Evidence and limitations: `docs/verification/2026-10-30-stock-expiry/README.md`. Actual 390×844 and 1440×900 renders are mirrored on the same Paper page. No production deployment or commit was performed.
