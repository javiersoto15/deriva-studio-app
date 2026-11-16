# Barra bean frontend proposal — approved

Backend merged at 0fedbffa67117711f9a33f65e86d85e1f678287d; not deployed or initialized in production. User approved the concrete Paper proposal on 2026-11-16.

Recommended: Productos / Granos switch in the existing Barra workspace, dense stock rows, desktop side panel and mobile sheet. Alternatives: adding beans to the integer Products list risks confusing units and unknown values; a separate app duplicates authentication/navigation and hides the menu relationship.

Nine beans begin unknown, distinct from zero. Exact kg decimal entry accepts comma/dot and up to three decimals. Unknown only permits setting a total. Count, history and menu links share a panel. Staff count/read history and menu names; managers edit searchable links. A link without a configured origin option is marked pending configuration. Only the two approved premium beans get the premium label. No initial create form, fake counts or public price changes.

Sharing includes every returned bean, including unknown and zero, independent of filters. Copy and WhatsApp use a complete separate bean report.

Pending count/link operations persist exact request IDs and bodies per UID before sending. Ambiguous outcomes retry the same operation; 401 requires same-account sign-in; 409 reloads and requires explicit review. Successful immutable receipts do not override fresh server snapshots. Backend 404 differs from a valid empty result.

Implementation needs an additive staff-readable bean snapshot of menu item names/configured origin IDs and links; never bypass manager-only menu endpoints. Verify exact gram parsing, roles, old integer stock regressions, replay/conflict/auth/account-switch recovery, complete sharing, and real desktop/mobile flows. Port actual implementation renders to Paper before release approval.

Paper: https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-N-0

Visual review: mobile controls fit 390 px, rows retain independent quantity lanes; desktop uses existing 420 px panel; initial unknowns and pending menu configuration are visible. Screens are proposals, not running application evidence.
