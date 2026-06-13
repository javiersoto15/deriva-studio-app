# La Polla del Mundial — Frontend Design

**Date:** 2026-06-12
**Surface(s):** `derivastudio.cl/mundial` (public, landing) · `admin.derivastudio.cl/redemptions` (staff, admin)
**Backend contract:** `13_companion_backend/docs/openapi.yaml` (World Cup + Campaign Reward schemas)
**Upstream docs:** `docs/plans/2026-06-12-world-cup-predictor-frontend-handoff.md`, `docs/plans/2026-06-12-world-cup-predictor-design.md`

---

## 1. Goal

Build the frontend for a same-day World Cup **exact-score prediction** campaign for Deriva Coffee Studio:

- A public, shareable page (`/mundial`) where a fan predicts the exact score of **every** match the backend lists for today, identified by **email**.
- Winners (exact score on every match) are evaluated by the backend after staff enter final scores; winners receive a **one-time QR/short-code reward** by email for one free coffee on their **next-day** visit.
- A PIN-gated **staff tool** (`/redemptions`) to validate and redeem that QR/code.

**Backend owns all match data, campaign state, evaluation, and reward issuance.** The frontend renders and submits; it never invents teams, dates, match IDs, windows, or scoring rules.

This reward system is a **generic campaign-reward primitive**, intentionally separate from Deriva Points. No point balances, point costs, or member-wallet semantics appear anywhere in this feature.

## 2. Confirmed product decisions

| Decision | Choice |
|---|---|
| Public route | `derivastudio.cl/mundial` (apex / landing surface) |
| Voice / framing | Playful Chilean football-pools register — **"La Polla del Mundial"** (`polla` = betting pool, normal in Chilean Spanish; cf. Polla Chilena de Beneficencia) |
| Prediction interaction | **Wizard** — one match at a time, then a review + email step |
| Score entry control | **−/＋ steppers** with large mono numerals (range 0–~9), one-handed, no keyboard |
| Staff tool route | **`admin.derivastudio.cl/redemptions`** (generic, reusable for future campaign rewards) |
| Stepper default | **0–0** — a valid prediction; the wizard guarantees the user passes through every match before submitting |
| Staff card email | Show the winner's **full email** (staff need it to verify identity at the barra) |
| Staff tool host | **admin. subdomain**, in the `(admin)` route group, reusing the Match Up PIN cookie |
| Staff backend auth | **Env-held server service token** behind a `staffBearerToken()` seam (the PIN gates the human; the proxy carries the real credential) |
| Build scope | Both surfaces in one spec; **implement public `/mundial` first** (no backend-auth dependency), then the staff tool |

## 3. Research grounding (Refero + web)

Synthesized from ~70 screens across 8 Refero searches + web sources. Steal list:

- **Turf** (sports app): symmetric `home · center · away` fixture row, hairline dividers → the skeleton of each prediction step; teams flank the score controls.
- **adiClub Pass**: "Show this code at the cash desk… increase the brightness" + large QR + alphanumeric short code → the winner's emailed reward artifact.
- **Manus / Spotify / Headspace redeem**: one field, one full-width CTA, a dedicated invalid-code error box, explicit success → the staff redeem canon (single card, one action, hard status states).
- **1Password / LEGO / Revolut scanners**: corner-bracket frame + **manual-entry fallback** → **decision: no custom camera scanner**; the QR encodes the staff URL, so the phone's native camera opens it; a manual short-code field is the fallback (mirrors Match Up).
- **DoorDash**: quantity stepper for small integers → confirms steppers for scores.
- **Duolingo / Deezer quiz**: fixed bottom action bar + progress count → wizard progress + sticky primary action.

**Soul (the 20%):** the quiniela/pools coupon reimagined as a **Deriva chapbook broadside** — § section marks, `Vol./№` edition mast, Cormorant display for team names, IBM Plex Mono numerals in the steppers, a single green moment on the winning-claim word. No competitor predictor has this; it is the screenshot-worthy differentiator.

## 4. Architecture & data flow

The browser never talks to Cloud Run directly. **Server actions are the trust boundary** (mirrors `/resenas` and `/match-up`), so CORS is moot and the backend host stays server-side.

```
PUBLIC  derivastudio.cl/mundial                STAFF  admin.derivastudio.cl/redemptions[/{code}]
  app/(landing)/mundial/page.tsx                 app/(admin)/redemptions/page.tsx
   (server: fetch today's slate, no-store,        app/(admin)/redemptions/[code]/page.tsx
    inside <Suspense>)                             (PIN gate → validation card → redeem)
   _components/PollaWizard.tsx ("use client")      _components/RewardValidator.tsx ("use client")
            │ server action                                 │ server actions (gated by isStaffUnlocked)
   src/server/world-cup.ts                         src/server/campaign-rewards.ts
   src/api/world-cup.ts (server-only)              src/api/campaign-rewards.ts (server-only,
            │                                        attaches server-held staff bearer token)
   GET  /public/campaigns/world-cup-predictor/      GET  /staff/campaign-rewards/{code}
        matches/today                               POST /staff/campaign-rewards/{code}/redeem
   POST /public/campaigns/world-cup-predictor/
        submissions
            └──────────────► Go backend (Cloud Run) ◄────────────────┘
```

### Files

**New**
- `app/(landing)/mundial/page.tsx` — server component; fetches today's slate (`no-store`) inside `<Suspense>` per Cache Components rules; renders state shell.
- `app/(landing)/mundial/_components/PollaWizard.tsx` — client wizard (cover → match steps → review+email → submitted), holds stepper state, posts through the server action.
- `app/(admin)/redemptions/page.tsx` — manual-entry entry point, PIN-gated.
- `app/(admin)/redemptions/[code]/page.tsx` — token-from-URL entry point, PIN-gated, auto-validates.
- `app/(admin)/redemptions/_components/RewardValidator.tsx` — client validation/redeem card with status states.
- `src/api/world-cup.ts` — `server-only` typed fetchers: `getTodayMatches()`, `submitPredictions(payload)`. Public, no auth. Discriminated result types (network/server/validation/conflict/closed).
- `src/server/world-cup.ts` — `submitPredictionsAction` server action: honeypot + render-timestamp timing gate + per-process throttle keyed by normalized email, email validation, builds `WorldCupSubmissionRequest`, maps `400/409/410` to UI states.
- `src/api/campaign-rewards.ts` — `server-only` typed fetchers: `validateReward(code)`, `redeemReward(code, notes?)`. Attach `Authorization: Bearer <staffBearerToken()>`.
- `src/server/campaign-rewards.ts` — `validateRewardAction` / `redeemRewardAction` server actions, **gated by `isStaffUnlocked()`** (imported from `src/server/staff-match-up.ts`).
- `src/server/staff-token.ts` (or a helper in `campaign-rewards.ts`) — `staffBearerToken()` resolver reading `BACKEND_STAFF_TOKEN` (see §8 open item 1).

**Changed**
- `src/api/schema.ts` — regenerate with `npm run api:types` (World Cup + CampaignReward schemas already in `openapi.yaml`).
- `src/middleware/host.ts` — add `"/mundial"` to `LANDING_PREFIXES`. The admin host rewrites all paths already, so `/redemptions` needs **no** allowlist change. (Dev/preview reach it via the `/admin` prefix fallback.)
- `app/sitemap.ts` — add `/mundial` (public, shareable). `/redemptions` is `noindex`, not in sitemap.

**Reused as-is**
- `src/server/staff-match-up.ts` — `isStaffUnlocked()`, `unlockStaffMatchUp`, `signOutStaffMatchUp`, and the `StaffUnlock` component pattern for the gate.
- Editorial CSS / tokens, `LogoLockup`, `Eyebrow`, edition helpers (`src/lib/edition.ts`).

## 5. Public wizard — `/mundial`

Chapbook system throughout (edition mast, § marks, mono numerals, single green moment). Team names render **verbatim** from the backend (no invented crests/flags; typography carries the match).

### States

| State | Trigger | Screen |
|---|---|---|
| Loading | fetching slate | Edition-mast skeleton |
| Empty | `GET … → 404` | "Hoy no corre la polla" — no matches today; colophon + IG link |
| Closed | `submission_open=false` | "La polla de hoy ya cerró" (closes at first kickoff) + the day's fixtures read-only |
| Cover | open | Mast "La Polla del Mundial · `Vol./№`"; rules strip — *predice todos los partidos de hoy · marcador exacto · si le achuntas a todos, café gratis mañana*; `closes_at` time; "M partidos hoy"; **Empezar** |
| Match step 1…M | open | `home_team` (Cormorant display) · **stepper** ／ "vs" ／ **stepper** · `away_team`; progress "Partido 1 de M"; `kickoff_at` time (mono); Atrás / Siguiente; scores default 0–0 |
| Review + email | after last match | Compact list of all M marcadores (tap any → edit that match); **email field** (identity key) + consent microcopy linking `/privacidad`; honeypot + render-timestamp; **Enviar mi polla** |
| Submitted | `POST … → 201` | "Tu polla quedó marcada." — *Si le achuntas a todos los marcadores de hoy, te llega un café gratis al correo para mañana.* Echoes the submitted email; colophon |
| Error: already played | `409` | "Este correo ya jugó la polla de hoy." Keep entries; offer a different email |
| Error: closed mid-flow | `410` | "La polla de hoy se cerró mientras jugabas." Switch to Closed view |
| Error: invalid | `400` | Generic retry (steppers make negative/incomplete scores structurally impossible) |

### Submission payload

```json
{
  "email": "hincha@deriva.test",
  "predictions": [
    { "match_id": "<from backend>", "home_score": 2, "away_score": 1 }
  ]
}
```

Every `match_id` from the slate is included exactly once. The wizard guarantees the user passes through every match; default 0–0 is a valid prediction the backend accepts.

### Anti-abuse (client + action, backend authoritative)
- Honeypot field (hidden), render-timestamp minimum-fill gate, per-process throttle keyed by normalized email. Same shape as `src/server/reviews.ts` / `match-up.ts`.
- Email is normalized (trim + lowercase) before the network hop. Never logged.

## 6. Staff tool — `admin.derivastudio.cl/redemptions`

Deliberately boring: one card, one action, unmissable status. **No points / balance / wallet.** Reuses the Match Up PIN cookie so one shift session unlocks both tools.

**Redemption mechanics (no in-app scanner).** The QR is just an image encoding the staff URL `https://admin.derivastudio.cl/redemptions/{token}`. Our app builds **no camera component** — the OS does the scanning. Two paths:
- **Path A — QR via native camera (one tap):** staff open the built-in iOS/Android camera (both natively detect QR codes), point it at the customer's emailed QR → the OS surfaces "Open `…/redemptions/…`" → tap → the `[code]` page reads the token from the path and auto-validates. The shift's PIN cookie means no re-login → tap **Canjear**.
- **Path B — manual short code (no camera at all):** staff open the bookmarked `…/redemptions` and type the `short_code` the customer reads off their email → validate → **Canjear**. Fallback for a cracked/dim customer screen.

Rationale: avoids `getUserMedia` camera-permission prompts (flaky in iOS Safari/PWAs) and a QR-decode bundle dependency; the native camera is faster and more accurate; mirrors how Match Up sidesteps camera complexity. The round-trip to the native camera is one tap because **the QR *is* the link**.

- **Entry:** QR opens `…/redemptions/{token}` (native camera, Path A) → auto-validate. Or `/redemptions` with a manual short-code field (Path B).
- **Gate:** `isStaffUnlocked()` false → render the existing `StaffUnlock` PIN form. Once unlocked, the cookie (`path:/`, 12h) covers both `/match-up` and `/redemptions`.
- **Validation card** (`GET /staff/campaign-rewards/{code}`): `reward_label` + `reward_description`; the winner's `email` (identity check); a **status badge** (issued / redeemed / expired); the `valid_from`–`expires_at` window.
- **Redeem:** enabled only when `status=issued` **and** within the validity window → **Canjear** (optional `notes`) → `POST …/redeem` → "Canjeado · café gratis", showing the redeemed timestamp.
- **Status / error states:**
  - `status=redeemed` → "Ya canjeado" + `redeemed_at` (+ actor if present); redeem disabled.
  - `status=expired` or `410` → "Expiró".
  - `404` → "Código no encontrado."
  - `409` on redeem (race) → "Ya estaba canjeado" — refresh card.
  - `401/403` → "Sesión de barra no válida" → bounce to PIN gate.

States mirror the Match Up form's success / duplicate / expired / error shape.

## 7. Visual / Paper-first workflow

Per the repo's mandated Paper-first gate (AGENTS.md, `feedback_paper_first_workflow.md`): before **any** deploy, mock and get explicit approval for these artboards at **mobile 390×844** and **desktop 1440×900**:

- Public: Cover, Match step, Review+email, Submitted, Closed, Empty.
- Staff: Unlock (reuse), Validation card (issued), Redeemed, Expired, Not-found.

Use real brand tokens, fonts, copy, and the edition device — no placeholders.

## 8. Open items requiring backend / founder coordination

1. **Staff bearer token (provisioning).** The `/staff/*` endpoints require a Firebase staff/manager/owner bearer token; the PIN gate produces none. Frontend ships against a clean `staffBearerToken()` seam reading **`BACKEND_STAFF_TOKEN`** (server-only env, set in Vercel). **Action:** provision a long-lived staff-role service credential the proxy can hold in prod; document its refresh story. Until set, staff redeem returns a calm "config unavailable" state.
2. **QR URL target.** The emailed reward's `qr_payload_url` (backend-generated) must point at **`https://admin.derivastudio.cl/redemptions/{token}`** so the QR lands on this tool. **Action:** backend emits that base URL (configurable).
3. **`short_code` format.** The manual-entry field should match the backend's `short_code` shape (length/charset) for input hints + validation. **Action:** confirm format; until then accept a permissive alphanumeric code.

## 9. Verification

From `10_webapp/`:

```bash
npm run api:types      # regen schema from openapi.yaml
npm run typecheck
npm run build
```

Backend smoke for integration:

```bash
cd ../13_companion_backend && make api-up-memory
curl http://localhost:8080/public/campaigns/world-cup-predictor/matches/today
```

Manual matrix: public Loading/Empty/Closed/Cover/Steps/Review/Submitted/409/410; staff Locked/Issued/Redeemed/Expired/NotFound. Mobile widths 320/375/390/430 + desktop, no horizontal overflow (Responsive Contract).

## 10. Out of scope

- Admin result-entry UI (`PUT /admin/.../result`) — backend/manager flow, not this build.
- Leaderboards, standings, multi-day history, accounts.
- Identity reconciliation between campaign email and companion phone-auth (see `project_companion_identity_reconciliation.md`).
- Any in-app QR camera scanner (native camera opens the URL).
- Email template authoring for the reward (backend reuses the Resend/outbox pattern; copy/template is a separate task if owned by frontend).

---

## Revision — 2026-06-13 · Tiered rewards + full_name + duplicate UX

Backend changed the campaign from "all-exact-or-nothing" to **tiered rewards**, evaluated server-side after results:
- Any single correct **outcome** (win/draw) → **Café simple gratis**
- All same-day **outcomes** correct → **Campesino gratis**
- All same-day **exact scores** correct → **Combo para dos Campesinos**
Each participant receives only the **best applicable** reward.

Contract facts (from `openapi.yaml`, verified):
- `WorldCupSubmissionRequest` now **requires `full_name`** (3–120) alongside `email` + `predictions`. `WorldCupSubmission` echoes `full_name`. Regen types via `npm run api:types`.
- Email duplicate check canonicalizes (Gmail dots / `+tags`) before hashing; duplicate still surfaces as HTTP **409**.
- Submission `status` enum is still `pending | won | lost` — the response does NOT reveal the tier at submit time (evaluation is later). The page **explains** the ladder; the prize arrives by email.
- The verification states `submitted_pending_verification | verified_submission | duplicate_submission | reward_email_sent` are **not in the contract yet** — build a `mapSubmissionState()` abstraction ready to absorb them; do not fabricate fields.

Frontend changes:
- **Cover** (still first viewport, game-led): add a compact 3-tier **premios ladder** under the hero + footnote *"Recibes solo el mejor premio que te toque."* before `Empezar`.
- **Review step**: add **required** `TU NOMBRE` field above email; helper *"Usaremos tu email para validar una sola participación por día y enviarte el premio si ganas."* No RUT, no anti-fraud language.
- **Submitted**: tier-aware copy (*"…desde un café simple hasta un combo para dos."*).
- **Duplicate (409)**: *"Ya recibimos una predicción para este email hoy."*
- **Staff `/redemptions`**: no change — already renders `reward_label` verbatim (now tiered).
