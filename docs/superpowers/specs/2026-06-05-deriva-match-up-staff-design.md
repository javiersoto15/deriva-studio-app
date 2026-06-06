# Deriva Match Up — Staff-Operated Redemption (Design)

**Date:** 2026-06-05
**Status:** Design — pending user approval
**Surfaces:** landing (`derivastudio.cl`), staff (`staff.derivastudio.cl`)
**Campaign window:** through 2026-06-30

## Summary

Deriva Match Up is a limited campaign: a customer brings a receipt ("boleta")
from another café and Deriva matches their coffee price, floored at 1.600 CLP,
once per person. Redemption is **staff-operated**: a barista verifies the
customer's physical carnet + competitor boleta at the bar and enters the data
into a PIN-gated staff form. The backend stores only a **hashed RUT** and
enforces **once-per-RUT** via a `409` on duplicate submission — that `409` is
the redemption guard at the moment of service.

The customer-facing `/deriva-match-up` page becomes a form-less **informational
explainer** (the IG/QR destination); all data entry happens staff-side.

## Goals

- Staff can match a customer's coffee price at the counter in seconds.
- Each RUT redeems at most once (enforced by backend `409`).
- Raw RUT is never shown, stored, or logged client-side beyond the submit
  payload; backend persists only the hash.
- A shareable public page explains the campaign without exposing a form.

## Non-Goals (YAGNI)

- Per-staff accounts / roles (that's the unshipped staff-auth project).
- Customer-generated QR + scan-to-redeem (the "C" model, a future cross-repo
  phase requiring new backend lookup + verify-redeem endpoints).
- A hard one-time **redemption** lock beyond the `409` on submission.
- Any change to backend campaign logic; the existing single POST endpoint and
  its `200/400/409/410` contract are used as-is.

## Backend contract (unchanged, source of truth)

```
POST /public/campaigns/deriva-match-up/submissions   (public, no auth)
Request:  { rut, competitor_place, coffee_name, competitor_price_clp }
Response: { id, campaign_id, competitor_place, coffee_name,
            competitor_price_clp, matched_price_clp, submitted_at }
200/201 → accepted; matched_price_clp = max(competitor_price_clp, 1600)
400 → validation · 409 → duplicate RUT · 410 → campaign expired
```

## Architecture

Two pages split by host (host-routing in `middleware.ts` is the only gate
between surfaces):

### ① Public `/deriva-match-up` (landing host) — informational

- Reuses the `/resenas` editorial shell (rail + column, masthead, colophon,
  footer, `SiteNav active="match-up"`).
- Headline: **"Trae tu boleta, igualamos tu café."**
- Body explains: bring your boleta from another café to the bar at Magnere 1570
  Local 105; we match the price (mínimo Deriva $1.600); válido hasta el 30 de
  junio; una vez por RUT.
- CTA row: cómo llegar / Instagram / app. **No form, no backend interaction** →
  remains a static prerender, ideal IG/QR destination.

### ② Staff `/match-up` (staff host) — PIN-gated form

- URL: `staff.derivastudio.cl/match-up` (dev: `localhost:3000/staff/match-up`).
- File: `app/(staff)/match-up/page.tsx` — a **server component** that reads an
  HttpOnly cookie:
  - **no cookie** → render the **unlock screen** (single PIN field).
  - **cookie present** → render the **staff form**.

#### PIN gate

- Server action `unlockStaffMatchUp(prev, formData)`:
  - Compares the entered PIN to `process.env.MATCH_UP_STAFF_PIN` with a
    constant-time comparison.
  - On match: set HttpOnly, Secure, SameSite=Lax cookie
    `deriva_matchup_staff` (value = an opaque server-known token, not the PIN),
    `Max-Age` ~12h; return success.
  - On mismatch: return a generic "PIN incorrecto" error (no lockout v1; rate
    is naturally low behind a physical counter).
- The page validates the cookie value server-side before showing the form.

#### Staff form

Reuses the existing `submitMatchUpAction` (`src/server/match-up.ts`) verbatim —
its RUT módulo-11 validation, field checks, and `409/410` mapping are
surface-agnostic. The honeypot + timing gate inside the action only fire when
those fields are present; the staff form omits them and no-ops past.

Four fields, recopyed for the counter:

| # | Field | Staff copy |
|---|-------|-----------|
| 01 | `rut` | "RUT del cliente — tómalo del carnet. Se guarda cifrado." |
| 02 | `competitor_place` | "¿Dónde lo compra?" |
| 03 | `coffee_name` | "¿Qué café?" |
| 04 | `competitor_price_clp` | "¿Cuánto pagó?" (live CLP grouping) |

Result states (staff-facing):

- **success** → large **"Cóbrale $1.600"** + "Pagó $1.200 en La Vecina." so the
  barista knows exactly what to ring up. A **"Igualar otro"** button resets the
  form (PIN cookie persists) for the next customer.
- **409** → "Este RUT ya usó su igualación." → staff declines.
- **410** → "La campaña terminó."
- **400** → inline field errors.
- **network/server** → calm retry copy.

## Data flow

```
Customer at bar (physical carnet + boleta)
        │
   Barista types into PIN-gated staff form
        │  (browser → server action, never to Cloud Run directly)
   submitMatchUpAction  ── RUT módulo-11 validate, build payload
        │
   submitMatchUp (server-only client) ──► POST .../submissions
        │
   200 → matchedPriceClp ──► "Cóbrale $X"
   409 → "ya usó"  ·  410 → "terminó"  ·  400 → field errors
```

The raw RUT exists only in the FormData, the normalized string, and the
outbound body — all inside the server boundary. The success form state carries
`matchedPriceClp` + the customer's own inputs, never the RUT.

## File plan

**Reused as-is**
- `src/api/match-up.ts` — server-only client.
- `src/server/match-up.ts` — `submitMatchUpAction` + RUT logic.

**Changed**
- `app/(landing)/deriva-match-up/page.tsx` — strip `<MatchUpForm/>`, add
  informational body + CTA row.

**New**
- `app/(staff)/match-up/page.tsx` — server component, cookie gate.
- `src/server/staff-match-up.ts` — `unlockStaffMatchUp` action + cookie helpers
  (set/verify), `signOutStaffMatchUp` (optional).
- Staff unlock + form components (e.g. `app/(staff)/match-up/_components/`):
  `StaffUnlock.tsx`, `StaffMatchUpForm.tsx` (recopyed from the landing form).
- CSS: staff unlock + minor staff-form additions appended to `globals.css`
  (reuse `matchup-*` + `resenas-*` classes).
- `.env.example`: document `MATCH_UP_STAFF_PIN`. Real value set in Vercel.

**Removed**
- `src/components/landing/MatchUpForm.tsx` — superseded by the staff form
  (its logic moves; landing page no longer renders a form).

## Routing & infra

- `/deriva-match-up` stays in `LANDING_PREFIXES` (`src/middleware/host.ts`).
- Staff host already rewrites all paths to the staff surface (no allowlist
  gating yet), so `staff.derivastudio.cl/match-up` resolves
  `app/(staff)/match-up/page.tsx`. Dev path `/staff/match-up` slices the
  `/staff` prefix to `/match-up` → same file. No host.ts change needed for the
  staff route.
- Sitemap: keep the public `/deriva-match-up` entry; do **not** list the staff
  route.
- New env var `MATCH_UP_STAFF_PIN` (Vercel production + `.env.local`).

## Error handling

- Backend errors map to typed result kinds (`duplicate`/`expired`/
  `validation`/`rate_limited`/`server`/`network`) in the client; the action
  maps them to calm, staff-facing copy. Validation errors never echo
  RUT-shaped detail.
- PIN mismatch returns a generic error; no payload or PIN is logged.
- Action logs only the failure *kind*, never the payload (it carries the RUT).

## Testing / verification

- `npm run typecheck` clean.
- `npm run build` compiles; public `/deriva-match-up` prerenders static; staff
  `/match-up` builds.
- Manual: unlock with correct/incorrect PIN; submit a valid match (see
  "Cóbrale $X" with floor applied for sub-1600 prices); re-submit same RUT →
  409 copy; confirm public page has no form.
- Paper mockups (mobile + desktop) approved before any deploy
  (`feedback_paper_first_workflow`).

## Open questions

- Cookie TTL: 12h assumed (one shift). Adjustable.
- PIN rotation: manual via Vercel env for v1.
```
