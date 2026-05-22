# Apertura activation send — runbook

**Send window:** Sunday 17 May 2026, 09:00–11:00 CL time
**Opens:** Monday 18 May 2026, 08:00 CL at Magnere 1570 Local 105
**Campaign ID:** `apertura-2026-05`

Codes are NOT redeemed online. Bar staff verify the recipient's code against a printed CSV at checkout, then the owner records redemptions post-hoc via `POST /admin/campaign-codes/redeem`.

---

## Pre-Saturday — environment + dry rehearsal

### 1. Confirm env vars set in `.env.local`

```bash
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=...
RESEND_FROM_EMAIL=hola@derivastudio.cl
RESEND_FROM_NAME=Deriva Coffee Studio
BACKEND_API_BASE_URL=https://<cloud-run-host>           # script-only, full URL
BACKEND_ADMIN_TOKEN=<fresh Firebase ID token, see §2>
```

**Why `BACKEND_API_BASE_URL` and not `NEXT_PUBLIC_API_BASE_URL`:** the runtime webapp's `NEXT_PUBLIC_API_BASE_URL` is set to `/api` (the Next.js rewrite path used by the browser), which a Node.js script can't proxy through. The script needs the direct Cloud Run hostname. The script will refuse to run if `BACKEND_API_BASE_URL` is missing or not a full `https://` URL. Get the current Cloud Run hostname from `reference_deriva_companion_deploy.md` in auto-memory or from the Vercel production env (under `NEXT_PUBLIC_API_BASE_URL`).

### 2. Obtain a fresh `BACKEND_ADMIN_TOKEN`

Firebase ID tokens expire in ~1 hour. Get a fresh one right before running:

1. Sign in to the companion app at `https://app.derivastudio.cl` as an owner-role user (Firebase manager/owner roles authorize `/admin/campaign-codes`).
2. Open browser devtools → Application → Local Storage → find the Firebase key matching the project (looks like `firebase:authUser:...`).
3. Copy the `stsTokenManager.accessToken` value. That's your Firebase ID token.
4. Paste it into `.env.local` as `BACKEND_ADMIN_TOKEN=...`

If the token expires mid-run, the script will fail. Re-obtain and re-run with `--only=<failed emails>` (codes are idempotent, so retries are safe).

### 3. Dry run against production backend

```bash
npm run send:apertura:dry -- --campaign-id=apertura-2026-05
```

What this does:
- Pulls all contacts from the Resend audience
- **Actually issues real codes** via `POST /admin/campaign-codes` (idempotent, so this is safe — codes are dormant until the real send)
- Writes a sample HTML to `tmp/apertura-sample-<email>.html` for browser inspection
- Writes the full audit CSV at `tmp/apertura-send-apertura-2026-05-<ts>.csv`
- **Sends NOTHING** via Resend

### 4. Inspect the sample HTML

Open `tmp/apertura-sample-*.html` in a browser. Check:
- Logo renders at 112px
- Hero "Déjate llevar / a la Deriva." with brand-green italic on line 2
- Code reads cleanly (`XXXX-XXXX-XXXX`)
- Body, ticket, day-of details all present
- Corner brackets visible at all four corners of the email card
- "Lun–Vie 08:00 — 21:00 / Sábado 10:00 — 21:00" in footer

### 5. Send live to 2-3 test addresses

```bash
npm run send:apertura -- --campaign-id=apertura-2026-05 --only=javier@personal.cl,test2@personal.cl
```

Verify in:
- Gmail (web + mobile)
- Apple Mail (iOS + macOS)
- Outlook web (corner brackets may render imperfectly here — acceptable degradation)

Spot-check: does the code in the email match the code in the audit CSV? Does it match what's stored in the DB? Query:

```sql
SELECT email, display_code, code, issued_at, expires_at
FROM campaign_codes
WHERE campaign_id = 'apertura-2026-05'
  AND email IN ('javier@personal.cl', 'test2@personal.cl');
```

---

## Sunday morning — the real send

### Pre-flight checklist (do all before running)

- [ ] Backend healthcheck: `curl ${NEXT_PUBLIC_API_BASE_URL}/health` returns 200
- [ ] Resend dashboard: domain still verified, no recent bounce spike
- [ ] `git pull` confirms script + template haven't drifted from rehearsal
- [ ] `.env.local` populated; **`BACKEND_ADMIN_TOKEN` re-obtained within the last hour**
- [ ] `npm run typecheck` passes
- [ ] `npm run email:build` succeeds (sanity check, not strictly required since send script renders inline)

### The send

```bash
npm run send:apertura -- --campaign-id=apertura-2026-05
```

Script output will report batch progress and a final summary. Expected runtime: <30s for a few hundred contacts.

### Post-send (within 1 hour)

- [ ] Open Resend dashboard → Activity → check delivery rate (>95% expected)
- [ ] Check spam folders of 2-3 test recipients
- [ ] DB sanity check:

```sql
SELECT count(*) FROM campaign_codes WHERE campaign_id = 'apertura-2026-05';
-- Expected: matches audience size from the script output
```

- [ ] Save the final audit CSV from `tmp/apertura-send-apertura-2026-05-<ts>.csv` to a safe location (Drive folder, Notion page) — **this is the bar's lookup table for Monday morning**
- [ ] Print the CSV (or open on a tablet at the bar) — staff verify the customer's code matches their email by eye at checkout

---

## After opening week — bulk-redeem reconciliation

Once the bar has collected the codes that were actually used (paper list / Notion / SumUp notes), the owner records redemptions via the backend:

```bash
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/admin/campaign-codes/redeem \
  -H "Authorization: Bearer ${BACKEND_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "codes": [
      { "code": "K3M9-FQ7X-2VWP", "notes": "Lunes 18, ~10:30" },
      { "code": "X4P2-9MN7-VW3F", "notes": "Lunes 18, ~11:15" }
    ]
  }'
```

The backend normalizes hyphens/case/whitespace, so any format the staff jotted down should work. Response includes per-code status (`redeemed | not_found | expired | already_redeemed`).

For batches, the bulk endpoint handles up to ~500 in one call. If a recipient signs up in the companion app *before* their code is recorded as redeemed, the backend will auto-link `signup_member_id` at redemption time — and there's a signup-time hook that does the reverse (link member to any unredeemed code on their email). Attribution survives in both directions.

---

## Failure recovery

| Symptom | Fix |
|---|---|
| Backend 401 | `BACKEND_ADMIN_TOKEN` expired. Re-obtain (§2) and re-run with `--only=<remaining emails>`. |
| Backend 403 | Token is for a non-owner/manager user. Sign in as owner and re-obtain. |
| Resend rate limit (429) | Wait 60s, re-run with `--only=<failed emails from CSV>`. Codes are idempotent. |
| Partial batch failure | Audit CSV records `status=failed` per email. Re-run script with `--only=<comma-separated failed emails>`. |
| Sent to wrong audience | There is no recall. Send a correction immediately; don't try to silently fix. |

---

## Reusing this for future campaigns

`campaign-codes` is the platform's **general external-code reward primitive** — anniversary perks, partnership codes, press freebies, win-back campaigns, etc. all reuse the same pipeline. To run a new campaign:

1. **Pick a campaign_id** that's lowercase-kebab-cased, scoped, and unique (e.g. `aniversario-2027-05`, `partner-tostado-x-2026-q3`, `winback-q4-2026`).
2. **Decide the audience.** New Resend audience or filter from an existing one. Set `RESEND_AUDIENCE_ID` accordingly in `.env.local`.
3. **Author a new email template** at `src/emails/<NewCampaign>.tsx` following the chapbook signatures (corner brackets, IBM Plex Mono `CARTA DE X` masthead, Regular+Italic-green hero, restrained logo). See `feedback_email_design_language.md` in auto-memory.
4. **Duplicate the send script**: copy `scripts/send-apertura-codes.ts` → `scripts/send-<campaign-id>.ts`. Change the email-template import. Everything else stays.
5. **Mirror this runbook** at `docs/email/<campaign-id>-runbook.md`. Update the campaign-id, send window, copy details. The structure (pre-flight, dry-run, send, post-send, recovery) is reusable.
6. **Backend-side, nothing new is needed.** The campaign-codes endpoint accepts any `campaign_id` string. Issuance is idempotent on `(campaign_id, email)`, so re-running is safe.
7. **Add an npm script** to `package.json` pointing at the new send script (`send:<campaign>` + `send:<campaign>:dry`).

The architectural decision (set 2026-05-14): **all external-code reward distribution goes through `campaign-codes`.** No parallel systems. No real-time staff lookup/redeem endpoints. Verification is always offline-CSV at point of sale; recording is always post-hoc bulk redeem.

## Out of scope for this runbook

- The in-app deep-link reconciliation flow (`/admin/campaign-tokens` + `/me/redeem-campaign-token`) is a separate system used for a different purpose. Do not conflate.
- Welcome-reward wiring: redemption of a campaign code marks it used in `campaign_codes` but does NOT currently fire a reward in the ledger. If the founder wants the redeem step to ALSO grant a perk, that's a separate backend change.
