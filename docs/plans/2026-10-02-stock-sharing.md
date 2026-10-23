# Stock sharing implementation plan

**Released 2026-10-03:** Vercel deployment `dpl_5EY9dxfJzdNfrgDPygmcRgHSeVa8` is promoted to production. Real authenticated sharing/copy checks passed on `admin.derivastudio.cl/stock`. The user additionally authorized menu stock visibility; the release includes the existing `app/sw.ts` NetworkOnly menu freshness change as a seventh overlay. Backend revision `deriva-companion-api-00061-h9c` serves 100% with visibility enabled. Project CDN/data caches were purged. See the workspace milestone `docs/agent_memory/2026-10-03-stock-sharing-menu-visibility.md` for activation and verification evidence. Earlier access-blocker notes below are resolved history.

**Goal:** Let authenticated stock staff and managers share the saved stock as a Spanish WhatsApp message or copy it.

**Approval:** Javier approved the Paper proposal on 2026-10-02. Implementation is authorized; production release follows the repository's rendered mobile/desktop Paper confirmation workflow.

**Architecture:** A pure formatter builds a message from a fresh authenticated stock snapshot. A new share panel reuses the stock page's existing responsive panel, focus handling, and session protections. WhatsApp receives a prefilled message through `https://wa.me/?text=…`; the user selects a recipient/group and sends it. No group ID, backend write, or WhatsApp integration credentials are required.

**Tech stack:** Next.js, React, TypeScript, existing stock API client and node:test/tsx.

## Approved design and evidence

Use the existing Poppins/IBM Plex Mono ledger styling, warm paper and brown square buttons. Panel copy: `Compartir stock`, `Revisa el mensaje. Luego elige el grupo en WhatsApp.`, `Compartir por WhatsApp`, `Copiar mensaje`.

Refero VSCO screen `e82bdcd9-2c32-4cec-9056-d66f7b786a40` and Meta AI page `8cefc3ad-108b-4b7b-a3ae-488dea791ab8`, cross-checked with authenticated Mobbin Luma flow `dcc9b15d-e85a-4e8e-8fc4-e1abb031b1ef`, support preview-before-share, separate copy action, and confirmation only after clipboard success. The approved mobile proposal is artboard `RXP-0` in Paper file `01KPY2FP2KH33ASDC7SKRA10K7`, page `p-E-0`.

## One coherent implementation outcome

Luna 6 max owns implementation and defined checks; Astra medium reviews requirements, code, browser behavior and integration. Do not modify unrelated menu, service-worker or campaign changes. No production writes, message sends or deployment.

1. Inspect `src/stock/types.ts`, `client.ts`, `editor.ts`, and the stock app/editor components.
2. Add meaningful formatter tests in `tests/stock/share.test.ts`, demonstrate failure, then implement `src/stock/share.ts`. Include null versus zero, unit grammar, Spanish number formatting, Santiago AM/PM/date rollover, names and URL encoding. Preserve full item names, including whole/frozen qualifiers. Include all counted stock irrespective of list filters or menu availability; disclose omitted unknown counts.
3. Add the share panel and list-level action in `app/(admin)/stock/_components/StockApp.tsx` and a dedicated component. Reuse existing responsive CSS and focus semantics. Refresh before enabling actions. Guard requests against close, logout and account changes; clear obsolete previews and clipboard status. Block sharing while stock mutations are unresolved. Handle API and clipboard failures visibly without claiming a message was sent. Do not enable an empty inventory message.
4. Run `npm run test:stock`, `npm run typecheck`, `npm run build`, and scoped `git diff --check`, using the bundled Node runtime. Verify changed behavior with controlled local browser data rather than production stock mutations.
5. Astra reviews the diff, checks mobile widths 320/375/390/430 and desktop, and ports actual output to Paper at 390×844 and 1440×900. Record checks actually performed and limitations. Present rendered output for release approval.

## Timestamp and data rules (initial release; superseded for zero counts below)

The message heading uses the snapshot consultation time in `America/Santiago`, for example `Inventario PM 2/10 · 15:10`; it does not assert all quantities were counted then. The UI identifies this as consultation time. Quantities of zero are included; null counts are omitted and counted in a note. Menu pauses do not remove stock from the message. No item IDs, account details, prices or credentials are exported.

## AM to PM depletion update — 2026-10-03

Javier requested that ordinary zero-count items be omitted, while items that had stock and reached zero between the AM and PM shifts say `Se acabó X`. The reporting period is the current trading calendar date in `America/Santiago`, independent of the browser session. Current positive counts keep the existing quantity format. A current-zero item qualifies only with a saved positive-to-zero adjustment on that date, at or before the snapshot consultation time and within its revision. Initial null-to-zero counts and depletions from previous dates do not qualify. Restocked items show their current positive count. Omitted zeros never count as uncounted items.

Use the deployed paginated history endpoint for current-zero items only, with bounded concurrency and validated pagination. A history failure must prevent sharing an incomplete message. Preserve the approved combined Refero/Mobbin interaction pattern documented above: fresh preview, explicit copy, manual WhatsApp recipient choice, and truthful success feedback. Keep the existing panel layout and styling.

Implemented in the formatter, stock client and page normalizer, history proxy, and existing sharing panel. The scan follows up to ten pages of 100 entries per zero item with at most four concurrent scans, validates cursor progress and snapshot revisions, and rejects incomplete/malformed results. Request and account guards cover the full snapshot-plus-history read. Explicit year/month/day formatting avoids locale-dependent date comparisons.

Verification: 36 stock tests and TypeScript typecheck passed (including the final mixed-order regression). Main-agent browser checks passed for ordinary/old/initial zero omission, same-day depletion, restocks, exact preview/WhatsApp/clipboard content, reload persistence, history failure and retry, and closing the panel while history is pending. Rendered widths 320/375/390/430/1440 fit without horizontal overflow. Test data was intercepted locally; no stock mutations were made. Browser evidence is in `/tmp/deriva-stock-depletion-20261003/result.json`.

Actual mobile and desktop render captures are in `assets/2026-10-03-stock-depletion/` and mirrored on the existing Paper stock page (boards `RYM-0` and `RYN-0`). Reviewed spacing, typography, contrast, alignment, and artboard fit: the existing approved panel remains clear, and both actions fit. The prior integrated Refero/Mobbin reference lock is preserved; this update changes data selection and requested report wording within that layout.

Javier approved implementation and deployment after requesting that all depletion items appear last. The formatter preserves snapshot order within the positive-count group, then within the depletion group; the uncounted note remains a footer. Updated actual rendered mobile/desktop previews (`mobile-ordered.png` / `desktop-ordered.png`) replaced the Paper captures before release. Browser ordering and all other integration checks passed again.

Deployed and promoted `dpl_8xdexW4QpAy511qZtdwwaaKaaDNL` (`https://deriva-studio-45lgp92jj-javiersoto15s-projects.vercel.app`). Vercel production build passed (52 seconds). Clean source `/tmp/deriva-stock-depletion-release-20261003` derives from the prior reviewed release plus ten scoped source/test overlays; SHA256 checks confirm it matches the reviewed changes and excludes unrelated dirty menu/campaign files. Previous production: `dpl_Nhp1zJUfx66ZP1nEhjqzfSzoiGne`.

Real authenticated read-only checks passed on both the new deployment and `https://admin.derivastudio.cl/stock`: 15 positive items, 17 zero items, 3 qualifying same-day depletion notices at the end, and the other 14 zero items omitted. Preview, WhatsApp URL, and copied text match exactly; logout verified. No stock writes or WhatsApp sends. Evidence: `/tmp/deriva-stock-depletion-20261003/{preview,production}.json` and screenshots. Production alias inspection confirms the new deployment.

## Implementation and verification — 2026-10-02

Implemented in `src/stock/share.ts`, `tests/stock/share.test.ts`, and the stock page's `StockApp.tsx`, `StockEditor.tsx`, `StockShare.tsx`, and `stock.css`. The share panel has its own request generation counter in addition to the existing session guard. Close/logout invalidate pending reads; failed refreshes replace the preview with a retry state. Stock mutation controls are disabled while sharing. Clipboard errors offer manual text selection.

- `npm run test:stock`: 24 tests passed.
- `npm run typecheck`: passed. Stale ignored duplicate `.next/types/* 2.ts` files were removed before the successful check.
- `npm run build`: passed with existing Sentry, middleware, and Browserslist warnings.
- Scoped `git diff --check`: passed.
- Main-agent Chromium browser verification used the real local screen, Firebase Auth emulator, and intercepted stock GET responses from a controlled 31-item fixture. All stock mutation requests were forbidden by the harness. Verified fresh read on opening; all stock despite an active search; paused and whole/frozen items; null omission and zero-only exports; exact WhatsApp URL text and clipboard text; clipboard failure feedback; refresh failure with no stale link; retry recovery; staff and manager access; focus restoration; and expired-session purge.
- Browser renders checked at 320, 375, 390, 430, and 1440 px with no horizontal overflow. Manager toolbar additionally checked at 320, 390, and 1440 px. Clean review captures omit only the Next.js development badge.
- Local emulator testing uses `http://localhost:3000/stock`, because the existing development CSP permits `localhost:9099` but blocks the helper's rewritten `127.0.0.1:9099` endpoint. No app CSP change was made.
- Final rendered mobile and desktop captures are in `assets/2026-10-02-stock-sharing/mobile.png` and `desktop.png`, and are mirrored as rendered-image boards in the existing Paper stock page. Reviewed for spacing, typography, contrast, alignment, and viewport fit.

No production deployment, WhatsApp send, or production stock write was performed.

## Release authorization and access blocker — 2026-10-02

Javier explicitly authorized deployment after the final rendered-output review. Clean release source is prepared at `/tmp/deriva-stock-share-release-20261002` from HEAD `d9e08520c26078b3d68c1c46288f7469390a9a9f` plus exactly the six feature files listed above. The external manifest `/tmp/deriva-stock-share-release-20261002.manifest.txt` records their SHA256 hashes. Staged stock tests (24) and typecheck pass. Unrelated dirty menu, campaign, service-worker and generated Next files were excluded; the currently served production service worker still contains the baseline `menu-data` cache.

Deployment is blocked by CLI authentication: it exposes `javiersoto-3191's projects`, whereas the authorized Vercel connector confirms `deriva-studio` belongs to `javiersoto15's projects` (`team_xkCzA4cr1GCRtFWkqn39uHFI`). The CLI returns scope-not-existent and Not authorized. Requested a CLI login to the correct account; do not retry unchanged credentials.

Current production rollback reference confirmed through the connector: `dpl_HeqJNDCctPCVBpivmd38KccrZKeq`, READY, `deriva-studio-l620gg5ns-javiersoto15s-projects.vercel.app`, aliased to `derivastudio.cl`, `app.derivastudio.cl`, `admin.derivastudio.cl`, and `www.derivastudio.cl`. No new Vercel deployment was created. Once access is restored, verify the clean source, build a staged deployment with production settings and domain assignment disabled, verify it, then promote the same artifact under the existing authorization.
