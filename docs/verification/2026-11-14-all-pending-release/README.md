# Frontend release verification — 2026-11-14

The combined source includes kitchen and salón stock, stock navigation, the previously published Google Maps identifier, the Uber Eats OAuth proxy and privacy copy.

Fresh verification against this combined source passed: 275 tests across nine groups, `npm run typecheck`, and `npm run build` using Node 24.20.0. Logs are in this directory. The OAuth tests cover the canonical admin-host gate, caller bearer forwarding, temporary-code/state POST forwarding, state-cookie propagation, provider-error sanitization and service-worker cache exclusion. Tests first reproduced the missing OAuth service-worker exclusion; both OAuth routes now use NetworkOnly before document caching.

`privacy-390.png` and `privacy-1440.png` capture the actual production-build legal page, with fonts loaded. Neither viewport overflows horizontally. The existing legal-page typography and layout remain unchanged. These are code-render evidence for the Paper record, not deployment evidence.

Staff-specific account access reports and screenshots remain local because this repository is public. No credential values, environment files or browser authentication snapshots are included.
