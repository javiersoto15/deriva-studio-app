# Apertura announcement — manual broadcast via Resend

One-off email to send to existing waitlist subscribers letting them know the opening date is set.

## Files

- `apertura-announcement.html` — full HTML body, ready to paste into Resend's Broadcast composer (HTML view)
- `apertura-announcement.txt` — plain-text fallback for clients that don't render HTML

## How to send (Resend dashboard, no code)

1. Sign in to **Resend** (`resend.com/login`)
2. Left sidebar → **Broadcasts** → **New Broadcast**
3. **Audience**: select the audience referenced by `RESEND_AUDIENCE_ID` (the one the waitlist form writes to)
4. **From**: same address used by the welcome email — `RESEND_FROM_NAME <RESEND_FROM_EMAIL>`. If those are not configured in your Resend project, set them to `Deriva Coffee Studio <onboarding@resend.dev>` or your verified domain sender.
5. **Subject**: `Lunes 18 de mayo — Deriva`
6. **Preheader / preview**: `Lunes 18 de mayo · 8:00 AM en Magnere 1570. Tu primera taza, por la casa.`
7. Switch the composer to **HTML** view and paste the contents of `apertura-announcement.html`
8. Plain-text version: paste `apertura-announcement.txt` into the text-only field if Resend requests one
9. Click **Send a test** → send to yourself first, eyeball it on desktop + mobile
10. When it looks right → **Schedule** for the desired send time, OR **Send now**

## De-duplication

Resend Broadcasts is one-shot per contact. Each broadcast send marks each contact as delivered. If you re-run the same broadcast, Resend will not re-send to contacts already marked delivered for that broadcast. So accidental duplicate sends from the same broadcast are not possible.

If you want to send a follow-up email later (e.g., a thank-you after opening week), create a **new** Broadcast — don't reuse this one.

## What the existing waitlist code does NOT do

- It does **not** mass-email the audience. The repo's only send path is the welcome email triggered by a brand-new contact creation in `src/server/waitlist.ts`.
- Returning users who resubmit the form do **not** receive a duplicate welcome email — the contact-already-exists check short-circuits.
- Deploys (Vercel) ship code, not emails. Updating `welcome-email.ts` and redeploying does **not** trigger any send to existing subscribers.

## Testing the HTML before broadcasting

Open the file directly in a browser:

```bash
open docs/email/apertura-announcement.html
```

Note: a few small things in the HTML are template placeholders that Resend fills in at send time:

- `{{{RESEND_UNSUBSCRIBE_URL}}}` — Resend replaces this with a per-recipient one-click unsubscribe link.

If you preview locally those will render as the literal string. That's expected.
