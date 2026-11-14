# Stock expiry breakdown — local rendered verification

Verified 2026-10-30 after user approval of the inline stock-row and share-message design.

The screenshots render the actual `StockApp`, its child components, stock client/normalizers, and the current global tokens/stock CSS. An isolated esbuild harness stubs Firebase authentication and serves local read-only stock/history fixtures. It is **not production data**, an authentication test, or a claim about live inventory. Every non-loopback browser request and every non-GET request is blocked. No stock mutations or WhatsApp sends occurred.

`local-fixture.json` anchors server time to 2026-10-30 19:00 America/Santiago. Brownie Chips has 3 units due at 21:00 Friday and 5 due at 10:00 Sunday. Lúcuma Manjar has 2 expired units and 2 unknown-age units. Other items prove ordinary zero exclusion, same-day depletion, untracked item format, and uncounted item exclusion.

## Evidence

- `report.json`: 10 successful layout checks (list/share at 320, 375, 390, 430, and 1440px), no horizontal overflow, mobile count controls at least 48px high, no JavaScript errors or external requests.
- `*-list.png`, `*-share.png`: full-page screenshots at each viewport.
- `390-share-viewport.png`, `1440-share-viewport.png`: exact 390×844 / 1440×900 views mirrored in Paper.
- `*-share-message.txt`: actual generated text and WhatsApp URL payload equality checked.
- Clock drift: client fixed to 2028-01-02 in Asia/Tokyo still displays server-anchored Friday 19:00 and the same expiry details.
- Freshness: reopening share performs a fresh snapshot read; new server time 19:01 changes the 2h bucket to 1h59m and the message heading to 19:01.
- Closing share restores focus to the share trigger.

Pure stock tests passed 56/56; typecheck, production build, and whitespace diff validation passed. Build emitted existing Sentry/middleware/Browserslist warnings only. These local checks preceded release. The frontend was subsequently committed and deployed with explicit user approval; see `deployment.md` for production evidence and limitations.

Paper proposal/reference page: https://app.paper.design/file/01KPY2FP2KH33ASDC7SKRA10K7/p-K-0 . Actual implementation mirrors are labelled “Implementado · prueba local”. Compared with the approved references: the stable quantity lane and full-width expiry detail remain; the current summary/status line stays intact; the share preview uses the same text and retains its current actions.

## Conflict refresh regression

After the review fix to the `409 revision_conflict.current` path, the local browser intercepted one adjustment request and returned a simulated 409; it sent no mutation to any server. The existing notice remained: “El conteo cambió de 8 unid. a 7 unid. mientras editabas. No se guardó nada tuyo.” A second snapshot read supplied coherent server time 20:00, and the new quantity bucket displayed “2 unid. · queda 1 h”. See `conflict-report.json` and `1440-conflict-refresh.png`. The 56 stock tests, typecheck, and build passed again after this one-line fix.

Actual Paper mirrors: mobile share `WEJ-0` (390×844), desktop list/share `WEK-0` (1440×900), on the linked page. Both screenshots were inspected after import; date/quantity content and actions fit. Their pixels come from the actual component render, not reconstructed mockup HTML.

## Production verification

Released source `a4630030b789f6f9d4592d2ec0fd449f3db6c266` as production deployment `dpl_Hj6rCBbPieAx1r6SwduoxwDsiJGQ`, verified READY and assigned to the admin/public aliases. Authenticated live Chrome reloaded the 37-item list and opened a fresh share preview; decoded WhatsApp message matched the visible preview exactly. See `live-share.png`, `live-assets.json`, and `deployment.md`. At initial frontend-release verification, all six tracked items had zero stock, so positive expiry rows were verified locally and the served implementation was verified by its production JavaScript asset; no production dated-lot UI proof is claimed.

## Subsequent live policy activation

The owner then configured Trufas, pies, Carrot Cake and mini tortas de palmeras. Standalone raw-counter backend support was approved, released as `e79f736` / Cloud Run `00065-h8z`, and the whole lemon pie was independently added to Pies5/6. Its live quantity1 and new `1 unid. · sin fecha de entrada` detail appear in both list and share; separate lemon-pie portions remain7. See `live-whole-pie-breakdown.png`, `live-whole-pie-share.png` and the root milestone `docs/agent_memory/2026-10-30-standalone-stock-lifespans.md`. Actual arrival dates remain unspecified, so dated countdowns are still local-fixture proof; live unknown-age breakdown is now directly verified.
