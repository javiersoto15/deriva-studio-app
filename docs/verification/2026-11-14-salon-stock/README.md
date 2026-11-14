# Stock Salón verification

Status: implementation and local verification complete; actual-render Paper approval pending. No Salón production deploy, account creation, or initial production stock import has occurred.

Approved design: `docs/plans/2026-11-14-salon-stock-design.md` at workspace root. Initial source has111countedrows:40fridge,28cleaning,43storage,5zeros and102unknowncountunits. User confirmed gorro clip1pack containing100caps; Fanta pero18 preserved.

## Independent source checks

`python3 10_webapp/docs/verification/2026-11-14-salon-stock/verify-source.py` checks every source quantity in original row order, exact totals/zeros, package clarification and partial observations against an independently written expected sequence. Passed before implementation.

`verify-import.py <saved-local-api-snapshot.json>` compares every imported item against approved source quantities, units, category fields, package notes, source lines/sections/markers and observation precision, including server-owned exact10-person roster.

## Local integration setup

Primary owns disposable database `deriva_salon_ui_20261114` on loopback5432. Its base schema is from exact deployed kitchen-access release001..043, excluding unpublished localrefundmigration037. Salón migration044 was applied only locally for testing. Test suites use separate disposable databases.

Executed complete-flow acceptance used actual authorized Firebase password sign-in, a local-only matching active profile, localGoAPI, localNextproxy and local111-item audited import. Credentials/tokens stay in process memory, no new Firebase accounts and no production stock writes. Passed exact named withdrawal, immutable replay after later receipt, invalid/fridge/overdraw/stale requests, history and source independence. Source snapshot and per-flow reports are saved here.

## Visual review

Approved design prototype/reference candidates: `10_webapp/docs/plans/salon-stock-2026-11-14/`. Paper page: https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-M-0 . Reference board, actual application captures and implementation-versus-winner comparisons are ported, including390×844and1440×900. This page is ready for actual-render confirmation; it is not production approval.

## Executed checks

- `verification-summary.json`: overall result and deployment boundary.
- `local-initial-snapshot.json`: actual local API source readback, independently checked by`verify-import.py` against all111approved rows.
- `local-api-acceptance.json` and`local-persistence-readback.json`: real Firebase-verified Go/Postgres withdrawal, later receipt, immutable replay, invalid attempts,111items and113requests/movements/audits at that checkpoint.
- `production-browser-acceptance.json`: real Firebase→Next production build→exact candidate Go→Postgres at all5widths, all111share text despite filters, exact clipboard/WhatsApp payload, named withdrawal/history and signout.
- `production-recovery-browser.json`: response loss after commit→reload→injected401→actual reauthentication→identical original UUID/payload replay. A later receipt was preserved; one withdrawal for that request.
- `production-keyboard-browser.json`: roving tab navigation, modal focus trap, Escape/trigger restoration, location clearing selection, correction reason and no per-item withdrawal bypass.
- Candidate source-check JSONs plus frontend manifest: exact deployed baseline preservation and scoped overlays. Backend candidate234hashes, no unpublishedrefund037 or macOS metadata in archive.
- `backend-*.log`: complete candidate Go/vet and focused Postgres/race/bootstrap checks. Frontend17Salón,14cocina,56barra,21routing tests, main/candidate build and typecheck passed. Primary candidate17tests/typecheck logs saved here. Broader unrelated backend Postgres suites were not rerun.
- `frontend-fixture/`: actual React/Poppins component renders and modal-fit metrics; initial fixture tests do not replace the real production-build authenticated browser reports above.
- `paper-frames.json` and`review.html`: actual rendered review frames, source links, reference winners, and captured implementation regions.

All verification traffic and stock mutations were on loopback servers8765/8088 and `deriva_salon_ui_20261114` atlocalhost5432. Browsers signed out. Primary servers were stopped after review capture. The local database remains for reproducibility; its test movements are not production inventory. No Salón production deployment, account creation or WhatsApp send occurred.

Prepared frontend is a source/build-review candidate with no copied environment files. Its local prebuilt output must not be deployed without the intended production environment; use reviewed source and freshly verified production build settings after approval.
