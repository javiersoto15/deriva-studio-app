# Apertura Piloto — Lunes 18 de Mayo de 2026

The launch campaign for Deriva Coffee Studio's pilot opening.

## The basics

- **Date**: Monday, May 18, 2026
- **Time**: 08:00 AM (regular weekday hours: 08:00–21:00)
- **Location**: Magnere 1570, Local 105, Providencia, Santiago
- **Offer**: One free first cup (café or mate) for waitlist subscribers — **not** week-bound, **not** open to the public. Each subscriber gets exactly one free cup on their first visit.

## Why this nuance matters

Early drafts of the campaign copy said "primera taza por la casa toda la semana" (free first cup all week). That was wrong on two counts:

1. The promise wasn't a week-long promo — it's a one-time perk
2. The promise wasn't to the public — it's a thank-you for signing up to the waitlist

All deployed copy now reflects the corrected scope:

- **Homepage** (`app/page.tsx`): "Suscríbete · Primera taza por la casa" (no week qualifier, signup-conditional)
- **Welcome email** (`src/server/welcome-email.ts` + `src/config/waitlist.ts`): "Cuando vengas a vernos, tu primera taza, café o mate, va por nuestra cuenta"
- **Apertura announcement email** (`src/emails/AperturaAnnouncement.tsx`): "Cuando vengas a vernos, tu primera taza, café o mate, va por nuestra cuenta"

Do not reintroduce "toda la semana" or "hasta el 25 de mayo" anywhere. The `openingHoursSpecification` JSON-LD describes the regular operating hours (weekdays 08:00–21:00, Saturday 10:00–21:00) and is separate from the apertura launch event — do not conflate them.

## Surfaces touched by the campaign

| Surface | What changed | File(s) |
|---|---|---|
| Homepage headline | "Servimos el / primer café / el 18 de mayo." | `app/page.tsx`, `src/brand/index.ts` |
| Homepage promo line | "Suscríbete · Primera taza por la casa" | `app/page.tsx` |
| Homepage address CTA | "Lunes 18 · 08:00" | `app/page.tsx`, `src/brand/index.ts` |
| Top/bottom caption | "Apertura piloto" | `app/page.tsx` |
| Index meta line | "Apertura · Lun 18 · Mayo 2026" | `app/page.tsx` |
| Welcome email body | Mentions May 18 + free first cup | `src/config/waitlist.ts` (`both` variant `emailBody`) |
| Welcome email reward block | "Café o mate, va por nuestra cuenta." | `src/server/welcome-email.ts` |
| OG share card | Headline mirrors homepage; pure CSS (no font fetch) | `app/opengraph-image.tsx` |
| JSON-LD slogan + description | Mentions May 18 launch | `app/page.tsx` (`localBusinessJsonLd`) |
| Apertura announcement email | Date-forward layout for broadcast | `src/emails/AperturaAnnouncement.tsx` |

## Apertura announcement broadcast workflow

This is the email sent **once** to existing waitlist subscribers to tell them the opening date is set. It's separate from the welcome email (which is transactional, sent on signup).

1. Edit copy in `src/emails/AperturaAnnouncement.tsx`
2. Run `npm run email:build` — outputs HTML to `docs/email/apertura-announcement.html` (+ plain text)
3. Test with `npm run email:test-send -- you@email.com` — sends via Resend API to a single address. View in real client (Gmail/Apple Mail), not Resend's preview pane.
4. Once happy, **Resend dashboard → Broadcasts → New Broadcast**:
   - Audience: the one tied to `RESEND_AUDIENCE_ID`
   - From: `Deriva Coffee Studio <hola@derivastudio.cl>`
   - Subject: `Lunes 18 de mayo — Deriva`
   - Preheader: `Lunes 18 de mayo · 8:00 AM en Magnere 1570. Tu primera taza, por la casa.`
   - Paste HTML from `docs/email/apertura-announcement.html`
   - Send test to self → if good, send to audience

Resend Broadcasts is one-shot per contact; re-running won't double-send.

## Paper artboards

The visual mocks live on the Paper canvas (Deriva Studio file):
- `Apertura — Desktop` and `Apertura — Mobile` — homepage variants
- `Apertura Announcement v2 — Email (600px)` — light-mode email
- `Apertura Announcement — Dark Mode (600px)` — dark-mode email
- `OG Share Card — Apertura` — 1200×630 social card
- Updated `Welcome Email — Standard / Mobile (600px)` and Desktop variant

Standing rule: any visual change ships to Paper artboards (mobile + desktop) for review before any `vercel deploy/promote`. See `feedback_paper_first_workflow.md` in agent memory.
