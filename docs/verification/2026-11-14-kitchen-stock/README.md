# Kitchen stock — local verification

**Production release completed:** backend and frontend are now live at https://admin.derivastudio.cl/stock-cocina. See [release provenance, initialization and rollback references](../../../../docs/agent_memory/2026-11-14-kitchen-stock-release.md). The sections below retain the original local verification context; their no-deploy boundary was superseded by explicit user authorization.

Production evidence: `backend-deployment.json`, `backend-release-manifest.json`, `frontend-release-manifest.json`, `frontend-promotion.json`, `production-inventory-verification.json`, `production-backend-regression.json`, `production-browser.json`, `production-domain-probes.json`, and `production-*.png`. Authenticated production UI verifies all 73 source rows, duplicate suggestions, history, exact clipboard/WhatsApp message and sign-out. Kitchen uses production migration 042 to preserve existing menu 040/041; runtime settings and old review tags are unchanged. Nothing was sent through WhatsApp.

All runtime checks used Firebase Auth emulator on 9099, the local API on 8080, local Next development server on 3000, and a new `deriva_kitchen_ui_20261114` Postgres database on localhost:5432. No production credentials were used for these checks. Test users and disposable ingredient rows were local only. Temporary ingredient rows were removed afterward; the local kitchen inventory retains exactly the original 73 entries. The original observation time is 14 Nov 2026 at 12:52 Santiago.

## Confirmed behavior

- `api-report.json`: all 73 source names, quantities, units and package notes match; five explicit zeros; normalized-name duplicate rejected with existing item; 1.5+0.125=1.625; replay returns identical JSON; stale revision conflicts; history recorded. Barra's 18 populated inventory entries and the seeded public menu remain unchanged by kitchen mutations.
- `browser-report.json`: real staff login, live Postgres counts, ingredient suggestions, accent/case duplicate prevention, full 73-item share text, exact clipboard content and WhatsApp encoded payload. Desktop1440 and mobile430/390/375/320 screenshots have no horizontal overflow. WhatsApp was not opened or sent.
- `fault-report.json`: adjustment commits but response is dropped; navigation locks; original request ID survives page reload. Another actor changes count before retry; same-ID replay does not double the adjustment and reconciliation displays latest 1.875 at revision 3. UI creation, history, revision0/uncounted ingredient and first zero count also pass.
- `auth-recovery-report.json`: after the committed/lost response, retry 401 preserves original request; explicit reauthentication and same-UID login restore it; retry remains exactly once.
- `conflict-recovery-report.json`: original request is aborted before reaching backend; another actor changes the count; retry 409 releases the never-committed request, installs latest count and allows a reviewed submission with new revision. No permanent retry loop.

## Automated checks

`web-tests.log` records 14 kitchen, 56 existing barra stock and21 routing tests, all passing. `typecheck.log` and `build.log` record the final TypeScript and production-build runs. Build used Node 24 and command-only `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false`; environment files were not changed. Existing middleware/Sentry/Browserslist warnings are unrelated to this feature.

`go-test.log` records the full backend suite; `go-vet.log` is empty on success. Backend author and independent reviewer also ran isolated Postgres persistence/concurrency/atomic-audit tests, including race detection. Those databases were separate from the UI database and from existing databases. The full repository-wide Postgres integration suite was not run.

The source initial manifest is also validated by `go run ./cmd/import-kitchen-stock` without database writes. Importer tests enforce an explicit 5432 port, kitchen local/test/UI database names, and active staff profile; default/different PGPORT cannot redirect the command to the documented Cloud SQL proxy.

## Visual review

[Paper review](https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-L-0) includes actual rendered fidelity captures at 1440×900 and 390×844 for list, ingredient suggestions and sharing, with a side-by-side Refero/Mobbin reference board. The app keeps barra's tokens, typography and editor structure; group filters replace menu-related controls. Long lists/forms scroll within the app. Paper screenshots were inspected for spacing, hierarchy, contrast, alignment and frame fit. The implementation is editable in the repository; the Paper fidelity captures are raster images of the actual browser output.

## Release boundary

This original no-deploy boundary was superseded by the verified production release above. The ordinary checkout omits released standalone barra commit`e79f736` and migration 039. Kitchen uses independent migration 040. A release must overlay the kitchen delta on the production baseline, preserving that released shelf-life behavior and excluding unrelated unfinished refunds/Uber Eats/privacy changes. Never deploy this entire dirty checkout directly. User Paper confirmation is required by the webapp AGENTS instructions before deployment.
