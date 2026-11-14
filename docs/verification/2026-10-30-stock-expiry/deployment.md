# Production release — 2026-10-30

User explicitly authorized frontend deployment and live verification after reviewing the implemented Paper screens. This supersedes the earlier plan no-deploy boundary.

- Project: `prj_PHkZ3OMuP64BW0PCOxyqfkKAQmpP` (`deriva-studio`).
- Team: `team_xkCzA4cr1GCRtFWkqn39uHFI`.
- Local source commit: `a4630030b789f6f9d4592d2ec0fd449f3db6c266`. No remote Git push.
- Deployment: `dpl_Hj6rCBbPieAx1r6SwduoxwDsiJGQ`.
- URL: https://deriva-studio-80y6ok7q6-javiersoto15s-projects.vercel.app
- Rollback deployment: `dpl_HeoXaJrET7psT6Ay7Sy6ymoxcXii` — https://deriva-studio-q1gn23ykh-javiersoto15s-projects.vercel.app

CLI 62.2.0 staged production using `deploy --prod --skip-domain`, explicit project/team, and sourceCommit metadata. Source was an isolated export of the local commit, excluding docs, tests, env files, and local authentication state. Vercel downloaded 309 files. Remote build completed successfully, including TypeScript and 56 routes. Existing Sentry, middleware and Browserslist warnings were emitted; npm additionally reported allowScripts notices. The Sentry build had no auth token for source map upload. No credentials were changed.

The staged production deployment reported READY, and `/stock` returned HTTP 200. Only the generic project alias was attached before promotion. The Vercel connector promoted that exact deployment without rebuilding. Alias API then confirmed admin.derivastudio.cl, derivastudio.cl, app.derivastudio.cl, www.derivastudio.cl and both Vercel project aliases. Independent CLI inspect of admin.derivastudio.cl resolved the new deployment as production READY.

Immediate deployment-specific error-log query (`--level error --since 1h --limit 50`) returned no logs. This is a short post-release observation, not proof of long-term error absence. Drain inspection through the connector returned HTTP 404, so drain configuration remains unverified.

## Authenticated live verification

Root agent reloaded the production stock page in authenticated Chrome after promotion. The list loaded 37 items with 1 uncounted item. Opening Share fetched a fresh server reading at 20:11 America/Santiago; the preview contained 11 positive products and the 1-uncounted footer. The decoded WhatsApp URL text exactly matched the visible preview, and the copy button was enabled. No WhatsApp navigation/send or count action was performed. Screenshot: `live-share.png`.

At this initial frontend-release verification, all six shelf-life-tracked products had zero quantity and no open lots. Consequently, zero expiry-breakdown rows in the live DOM is expected. Positive dated-lot rendering is verified by the local actual-component fixtures and tests, not by production inventory. No fabricated stock was added to production.

`live-assets.json` verifies the actual Chrome-loaded production chunk `/_next/static/chunks/0jj7yfc5.olr4.js`, SHA-256 `61f2582bf7550f2f0dd313ff2c9e66494f28bce87b2dd9bd356ae25a82383140`. It contains six new feature markers: `stock-expiry__entry`, `Desglose de vencimientos de`, `plazo no disponible`, `invalid now for tracked inventory`, `vencidas`, and `unavailable-deadline`. This confirms the new implementation is served in production; it does not claim that a positive dated production row was observed.

No backend deployment, database mutation, production stock edit, or WhatsApp send was performed by this release.

Later owner-approved backend policy activation and whole-pie live UI proof are recorded in `docs/agent_memory/2026-10-30-standalone-stock-lifespans.md` at the workspace root. The initial zero-stock observation above is historical; live unknown-age breakdown rows are now verified.
