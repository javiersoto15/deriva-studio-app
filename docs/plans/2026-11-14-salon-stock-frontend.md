# Stock Salón frontend delivery

Implements the approved `/stock-salon` inventory with independent Salón API paths and request storage. No Salón deployment, production import, account creation or cloud mutation was performed by this frontend task.

## Behavior

- Three persistent, keyboard-operable location tabs: Refrigerador, Bodega, Limpieza. Product search/category filters and duplicate suggestions are scoped to the selected location.
- One global Registrar retiro action on Bodega/Limpieza, none on Refrigerador and none per row. The modal requires an exact server-configured person, explicit existing-item selection and positive exact decimal amount, with stock-before → stock-after preview.
- Storage/cleaning row editors provide Agregar ingreso and Corregir conteo only. Corrections require a reason. Global Retiros and item history are separately paginated and distinguish selected taker from authenticated recorder.
- Complete saved inventory is refreshed for sharing, independent of current filters. Location/category grouping preserves zeros, unknown units, package conditions, source markers and partial/unknown physical-count observations. Lookup/import/movement timestamps are never substituted for an original stocktake time.
- Staff copy excludes internal reconciliation instructions; backend operator notes remain concise and retain real conditions/uncertainties.
- Immutable mutations are stored before dispatch under a Salón-specific, authenticated-UID key. Forms/navigation lock while uncertain; same-ID replay survives reload and reauthentication. Confirmed replays reconcile a fresh snapshot before further edits. Replay-checked definitive current-item conflicts release the failed request for operator review; auth/transport/unknown conflicts preserve it. Invalid restored records are not replayed or silently overwritten; they leave writes disabled with a review explanation.
- Withdrawal confirmation fits above the fold at 390×844 after removing repeated selection text and an unrequested optional-note input. The request's optional reason remains an empty string for a fresh withdrawal. Corrections retain their mandatory reason field.

## Owned code

New paths: `app/(admin)/stock-salon/`, `app/api/salon-stock/`, `src/salon-stock/`, `src/server/salon-stock-proxy.ts`, `tests/salon-stock/`. Narrow additions: admin-console Salón link, service-worker network-only matching, package test script and aggregate-test inclusion. Existing kitchen/barra implementation and unrelated privacy/Uber Eats changes remain preserved.

## Verification

- Observed red/green tests for missing model/proxy/pending features, invalid restored person and internal-note leakage.
- Main checkout: Salón 17, cocina 14, barra 56 and routing 21 tests passed; TypeScript and production build passed using the existing Node24 runtime.
- Actual component fixture used the authenticated local Go/Postgres 111-item snapshot supplied by primary, actual SalonWorkspace/Editors and local cached Poppins fonts. Preview browser screenshots at widths 320,375,390,430 and desktop1440 showed no horizontal overflow. The selected 5→3.75 withdrawal preview and enabled confirmation were visible at every checked width; 390×844 confirmation bottom was676px.
- Escape closed the modal and restored trigger focus. Roving tab keyboard navigation selected Refrigerador, focused its tab, displayed40 rows and removed the global withdrawal action.
- Actual React fixture fault injection committed18→17.875 but lost its response; fields/header locked with the original Benja/location/item/amount/UUID persisted. A concurrent receipt changed the saved balance to18.125; same-ID retry reconciled18.125/revision3, cleared pending storage and did not repeat the subtraction.
- Fixture browser tab closed and own HTTP server PID9037/port3035 stopped. Primary independently owns real Firebase→Next→Go→Postgres integration, production-build smoke and Paper review; its evidence is separate from this injected-API fixture.

Screenshots: [fixture evidence folder](../verification/2026-11-14-salon-stock/frontend-fixture/main-390.png), [390px modal](../verification/2026-11-14-salon-stock/frontend-fixture/modal-390.png), [fit measurements](../verification/2026-11-14-salon-stock/frontend-fixture/modal-fit.json).

## Isolated local candidate

Candidate: `/tmp/deriva-salon-frontend-candidate-20261114-rcbj90ky`.

Baseline is the exact430 uploaded source files of the provided deployed kitchen frontend `dpl_FdoaJsJni7mMi988jf765UANbBXx`, verified against `/tmp/deriva-kitchen-reconciled-staged-files.json`. It retains the concurrent published SEO change and all existing kitchen/barra source. Apply only22 Salón overlay files:19 new and3 existing (`admin-console/page.tsx`, `src/sw/routing.ts`, `package.json`). Unrelated local privacy/Uber Eats changes are excluded.

Candidate Salón17 tests, production build and TypeScript passed. Its first build rejected a node_modules symlink outside Turbopack's root; installing candidate-local dependencies from the unchanged lockfile resolved that environment issue without source changes. No environment file or credentials were copied. This is a local source/build-review candidate, not a deployed artifact or a production-environment prebuilt release.

[Candidate source/check manifest](../verification/2026-11-14-salon-stock/frontend-candidate-manifest.json). Any eventual release must recheck the then-live baseline and intended production environment, preserve later concurrent work, and follow the actual-render Paper approval gate.
