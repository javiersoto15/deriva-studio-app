# Barra bean frontend verification — 16 November 2026

Implemented on `feat/barra-bean-stock-ui-20261116`. Approved proposal and visual reference research: `docs/plans/2026-11-16-barra-beans-frontend/`. No deployment or production bean initialization performed.

## Behavior

- Productos/Granos switch inside the existing Firebase-authenticated Barra workspace. Old product integer counts retain their original model, editor and share behavior.
- Exact kilogram entry to three decimal places, comma/dot input, unknown distinct from zero, no deltas before first count, no overdraw. Nine records remain backend setup-owned; no invented frontend records.
- History with exclusive revision pagination. Staff can read menu links; managers can edit searchable links. Configured origin options are distinguished from references awaiting menu configuration. No price changes.
- Sharing refreshes the authoritative snapshot before enabling copy/WhatsApp; includes all beans despite filters, including unknown and zero.
- Exact pending operation/body/request ID stored per Firebase UID before sending. Ambiguous operations survive reload and 401 reauthentication; retry same ID. Conflict fetches current state and requires review. A historical replay receipt is displayed separately from fresh current stock. Fresh definite rejections retain editable drafts; stale-account responses cannot sign out the replacement account.

## Checks passed

- Full `npm test`: **298 tests**, all passed (includes 23 bean tests and old stock/menu/routing/kitchen/salon/companion regressions).
- `npm run typecheck` and `npm run build`: passed. Existing Sentry/middleware/Browserslist deprecation warnings remain.
- `node tests/bean-stock/browser.mjs`: actual React component code + real bean client in Chrome against a controlled API/auth fixture. 320/375/390/430/1440 widths, no horizontal overflow, exact decimal save, history, manager links, staff read-only links, fresh complete sharing, clipboard/WhatsApp text, lost committed response followed by reload/401/same UID replay, authoritative read after replay, conflict review, definitive rejection and account-switch regressions; empty resource versus unavailable feature. No page errors.
- `node tests/bean-stock/bff.mjs`: real production Next server and new BFF routes against a controlled HTTP upstream; caller bearer passthrough/no-store, fixed paths, pagination rejection, successful count/link cache invalidation without runtime errors, existing `/stock` page200.
- Actual Next development `/stock` login inspected at390px, no page errors.
- Backend metadata: new HTTP regressions, `go test ./...`, `go vet ./...`; root repeated HTTP/beanstock tests and inspected the diff. Complete staff menu catalog includes paused/depleted items, retains manual availability, and exposes only IDs/names/configured origin IDs. `/admin/menu` remains manager-only.

The browser fixture is not a production session and does not prove a live deployment. UI/browser and real Go metadata behavior were verified separately; no single browser-to-real-Go-to-Postgres run was performed in this frontend turn. Prior bean service/Postgres integration evidence remains in backend `docs/verification/2026-11-16-bean-stock/`.

## Screens and Paper

Screenshots are controlled fixture data only, with no real accounts or credentials. `*-final.png` reflect the actual shared TopBar and BeanWorkspace code, including decimal editor/mobile sheet and desktop metadata. Initial weights are unknown; entered0.250 is an unsaved example.

Actual render artboards are in [Paper](https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-N-0), labeled `Actual code`. Mobile390×844 and desktop1440×900 editor captures plus full lists. Paper retains the approved proposal and reference board separately. All artboards reviewed; no clipping in editor screenshots, quantity lanes aligned, configuration labels visible on desktop.

Before deployment, show these actual renders for explicit approval per `10_webapp/AGENTS.md`. Both the backend metadata and the previously merged bean backend must deploy before the frontend feature can be used; initial nine-bean setup is an explicit backend operation, still not run on production.
