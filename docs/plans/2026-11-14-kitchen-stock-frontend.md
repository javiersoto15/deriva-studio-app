# Kitchen stock frontend delivery

Implements the approved independent kitchen inventory at `/stock-cocina`. The dashboard and barra header link to it. No deployment or production data mutation is part of this change.

## Owned surfaces

- `app/(admin)/stock-cocina/`: Firebase-authenticated app, inventory workspace, responsive kitchen styles, and accessible suggestion rows.
- `src/kitchen-stock/`: typed contract validation, fixed-point decimal previews, Spanish/diacritic search, approximate suggestions, inventory message formatting, authenticated client, and per-account pending request recovery.
- `app/api/kitchen-stock/` and `src/server/kitchen-stock-proxy.ts`: fixed-path bearer-forwarding kitchen proxy. Reuses transport plumbing from barra; performs no menu invalidation and does not call barra inventory routes.
- `src/sw/routing.ts`: kitchen page/API requests stay network-only.
- `tests/kitchen-stock/`: model, proxy, persisted recovery and suggestion semantics tests. `npm run test:kitchen-stock` is included in `npm test`.

## Behavior and safety

All six categories are independent of barra. Count editors support exact decimal set/add/subtract, zero and uncounted states, package notes, optimistic revision conflicts and history pagination. Matching normalizes accents/case/whitespace, ranks exact matches ahead of partial/singular/plural/near-typo matches, and offers existing ingredients before creation. Backend uniqueness remains authoritative.

The share panel refreshes the complete saved catalog, includes known zero quantities and package details, identifies read and count times separately, and provides manual clipboard/WhatsApp handoff. Unknown quantities are explicitly summarized and excluded from count lines. No automatic WhatsApp sends.

Before dispatch, mutations are persisted in tab `sessionStorage` under the authenticated Firebase UID. The same request ID and immutable payload survive reload and are restored into the editor. Requests from another UID are never restored. While a mutation is unresolved, form changes, ordinary navigation and logout are blocked; beforeunload prompts on browser exits. Replays remain unresolved after auth/role/transport or unknown retry failures, because those failures do not prove the original request failed. A replay-checked `revision_conflict` or `duplicate_ingredient` response containing a valid current item definitively resolves a never-committed request: clear the saved request, install the returned current ingredient, and let the operator review and submit a fresh change. An explicit reauthentication action preserves the pending record; signing back into the same account restores it. Storage unavailable blocks mutation dispatch rather than dropping replay protection.

Successful mutations refresh the current server snapshot before unlocking; immutable idempotent replay results cannot overwrite a later concurrent adjustment. If that reconciliation read fails, the confirmed outcome is shown with the list read-only until refresh. Session unmounts and generation checks prevent late reads from installing data into another session/panel.

Dialogs trap keyboard focus, restore the triggering element on close, and inert background navigation. The ingredient combobox uses `aria-activedescendant` with arrow/Enter selection and pointer-selectable option rows without nested interactive controls.

## Verification performed by frontend worker

- Observed failing tests before implementing missing modules and auth replay recovery.
- `npm run test:kitchen-stock`: 14 passed after recovery and accessibility corrections.
- Kitchen + barra tests: 65 passed before the additional recovery/accessibility tests.
- Kitchen + routing tests: 30 passed before the additional recovery/accessibility tests.
- `npm run typecheck`: passed after final changes.
- Production `npm run build`: passed with Node24 and command-only `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false`; local environment files unchanged.
- `git diff --check`: passed.

Primary agent owns final authenticated browser/Postgres verification, responsive screenshots, complete build, Paper port and release approval. No browser outcome or production build is claimed here before that evidence is recorded.
