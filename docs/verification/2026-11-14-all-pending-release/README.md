# Frontend release verification — 2026-11-14

The combined source includes kitchen and salón stock, stock navigation, the previously published Google Maps identifier, the Uber Eats OAuth proxy and privacy copy.

Fresh verification against this combined source passed: 275 tests across nine groups, `npm run typecheck`, and `npm run build` using Node 24.20.0. Logs are in this directory. The OAuth tests cover the canonical admin-host gate, caller bearer forwarding, temporary-code/state POST forwarding, state-cookie propagation, provider-error sanitization and service-worker cache exclusion. Tests first reproduced the missing OAuth service-worker exclusion; both OAuth routes now use NetworkOnly before document caching.

`privacy-390.png` and `privacy-1440.png` capture the actual production-build legal page, with fonts loaded. Neither viewport overflows horizontally. The existing legal-page typography and layout remain unchanged. These are code-render evidence for the Paper record, not deployment evidence.

Staff-specific account access reports and screenshots remain local because this repository is public. No credential values, environment files or browser authentication snapshots are included.

## Production release confirmed

Backend code32b3bc095dfdc0e38da98dd9f5a7f2c8a064552a is serving100% on revision `deriva-companion-api-all-32b3bc0-20261114`. Build92aaa50b-0d41-4e67-89e4-bf2045006759 produced immutable digest `sha256:f719435da88988392386ea3ff69b4b4bd4a905f0f7f0b97ead753c884d2c9e3c`. Zero-traffic health/OpenAPI verification preceded promotion. All runtime settings, flags, secret references, Cloud SQL settings and old review tags were preserved. Migrations044/045 applied successfully.

Salón111rows were explicitly imported through the authenticated application API using source-stable idempotency keys. Full readback matched every supplied source field and all111initial histories. Database counts:111items,111movements,111request records,111audits. Kitchen73items and all3kitchen-only profiles retained. Kitchen, barra, shelf-life, admin menu and public es-CL/en/pt-BR snapshots matched the fresh baseline. No valid withdrawal, refund reconciliation, points award, payment or WhatsApp send was performed during production verification.

Frontend `dpl_7F1ccL3Jba5jhSVMDvVHwvwubRTh` from codeca41639aca9e233fa7555ec895473431fe3e8979 is READY and promoted; all6aliases independently resolve to that deployment. Live actual Firebase login→frontend→Go→Postgres verified111Salón/73kitchen items, all3Salón tabs, exact10takers, indexed item selection, scoped duplicates, disabled overdraw, confirmation visible, complete111-item clipboard/WhatsApp payload despite filters, widths320/375/390/430/1440without overflow, empty withdrawal history and sign-out without page errors. Withdrawal confirmation was inspected but never submitted.

The independent release review found malformed SumUp event arrays could establish a zero-refund baseline. The parser-to-real-claim regression reproduced an incorrect100pointaward, then passed after explicit known-kind/status validation. Documented payout types/statuses remain supported; payout deductions/adverse outcomes prevent automatic earning. Full final Go tests/vet, focused race and final real Postgres suites passed. Existing provider OAuth credentials remain unconfigured and sandbox flags disabled; code is deployed but no external Uber connection or provisioning was activated.

Actual privacy390/1440renders are recorded on [Paper](https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-M-0), alongside the actual Salón frames. User's explicit deploy-all direction including privacy authorizes this release. Production privacy200, stock page200/API401no-store, canonical OAuth401no-store and wrong-domainOAuth404no-store probes passed.

Sanitized durable proofs: `backend-production.json`, `production-api-verification.json`, `production-browser.json`, `production-aliases.json`, `production-probes.json`. Private account evidence remains local.
