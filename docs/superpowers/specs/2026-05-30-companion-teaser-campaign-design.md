# Companion Launch — Teaser Campaign

**Date:** 2026-05-30
**Surface:** `derivastudio.cl` (landing) · Resend · Instagram
**Status:** Design — awaiting implementation plan

## Goal

Build anticipation for the Deriva Companion app (already live at `app.derivastudio.cl`,
publicly un-announced) via a **coming-soon teaser**. Capture interested people into a
**dedicated companion-interest list**, confirm them with a welcome email, and drive
awareness with an Instagram story.

The campaign is framed as *coming soon* — we do **not** link people straight into the
working app. We build a warm list first.

## Voice

- **Hook:** **"Crea tu propia Deriva."** — *Deriva* used as a **noun you own** (brand-as-noun
  wordplay via capitalization), the single green moment (`#00311F`) on the page.
- **Subline / toolkit:** *"Tu carta, tu código, tus recompensas. Todo en un lugar."*
- **Tease:** *"Muy pronto."* / *"Se viene."* — no date.
- Editorial chapbook system throughout (§ marks, Cormorant italic display, Plex Mono labels,
  plaster × ink palette). Single green moment per surface.
- This is a teaser **interest list** (email). It makes **no** promise of account
  reconciliation with the phone-auth app — the email-vs-phone identity gap stays open by design.

## Deliverables (first pass)

1. Landing CTA section (derivastudio.cl)
2. Welcome/confirmation email (transactional, raw-HTML builder — sent on signup)
3. Instagram story (1080×1920, Paper)

Explicitly **out of scope** this pass: IG feed post, a "reveal" drip email, any change to the
companion app itself.

---

## 1. Subscription pipeline

**Approach:** Generalize the existing waitlist pipeline with a `campaign` discriminator rather
than forking it. One pipeline, two campaigns (`apertura`, `companion`), shared
validation/honeypot/rate-limit.

### Changes

- **`src/server/waitlist.ts`** — `subscribeToWaitlist(prev, formData)` reads a hidden
  `campaign` field (default `"apertura"` for back-compat). A `campaign` → config map resolves:
  - `audienceId` env var
  - copy variant
  - welcome-email builder
  Keep a single server action; branch only on these three resolved values. Rate-limit key
  becomes `${campaign}:${email}` so the two lists don't share a limiter bucket.
- **`src/config/waitlist.ts`** — add a `companion` copy variant (form intro, labels, submit,
  success, errors, email subject/heading/body/signoff) in the campaign voice above. Export a
  `getCampaignAudienceEnvName(campaign)` or equivalent so the server resolves
  `RESEND_COMPANION_AUDIENCE_ID` vs `RESEND_AUDIENCE_ID`.
- **`src/components/WaitlistForm.tsx`** — accept a `campaign` prop (default `"apertura"`),
  render a hidden `<input name="campaign">`, and select copy by campaign. No visual fork.
- **`src/server/welcome-email.ts`** (or a sibling) — add a companion welcome-email builder, or
  parameterize the existing one by campaign. The landing success path keeps sending the welcome
  email synchronously, as today.

### Env / prerequisites

- `RESEND_COMPANION_AUDIENCE_ID=8810ed04-0a27-4bbb-88cc-1268cb2420a5`
  - **Founder action:** add to `.env.local` and Vercel (production). The audience already
    exists in Resend.
- Document in `.env.example`.

### Acceptance

- Submitting the companion form creates a contact in audience
  `8810ed04-…` (not the apertura audience) and sends the companion welcome email.
- Apertura form behavior is unchanged (same audience, same copy, same email).
- Missing `RESEND_COMPANION_AUDIENCE_ID` fails gracefully with the generic error (no crash).

---

## 2. Landing CTA section

**Location:** new section in `app/(landing)/page.tsx` (placement TBD in plan — likely after the
hours/menu block, before footer).

**Content (editorial teaser):**
- § section mark + small mast label (e.g. `LA APP DE DERIVA`).
- Hero: **"Crea tu propia Deriva."** — *Deriva* is the single green word.
- Subline: *"Tu carta, tu código, tus recompensas. Todo en un lugar."*
- Tease line: *"Muy pronto."*
- `WaitlistForm campaign="companion"` (email + consent + honeypot, reuses existing markup/CSS).
- Reassurance: *"No te llenamos el correo."*

**Design gate:** mock in **Paper first** (mobile + desktop artboards) per the paper-first
deploy workflow. No deploy until founder approves the Paper mock. Styling extends existing
landing CSS / editorial tokens; no new card component.

### Acceptance

- Renders responsively, matches approved Paper mock, single green moment respected.
- Form posts to the companion campaign and shows the success state inline.

---

## 3. Welcome / confirmation email

**File:** extend `src/server/welcome-email.ts` with `buildCompanionWelcomeEmail()` +
a `buildWelcomeEmailFor(campaign, …)` dispatcher.

> **Architecture note:** the signup-confirmation email is the **synchronous transactional**
> path — `subscribeToWaitlist` calls the raw-HTML builder in `welcome-email.ts` and sends it
> inline via Resend on submit. This is deliberately *not* a react-email `.tsx`: the
> `src/emails/*.tsx` react-email templates are reserved for **broadcast blasts** built to
> `docs/email/*.html` and sent via scripts. The companion welcome mirrors the existing apertura
> welcome builder, swapping masthead/headline/toolkit.

**Design — chapbook signatures (per email design language):**
- Restrained logo, IBM Plex Mono masthead (`LA APP DE DERIVA · MUY PRONTO`), Cormorant
  Regular + italic-green hero "Crea tu propia / Deriva." (*Deriva* the single green moment),
  toolkit row (`Tu carta · Tu código · Tus recompensas`), exact palette.
- Body: confirms they're on the list, teases the toolkit, closes with
  *"Te escribimos cuando esté lista."* + signoff `— Equipo Deriva`.
- Preserve the `{{{RESEND_UNSUBSCRIBE_URL}}}` token + privacy link in the footer.

**Build / preview:** `npx tsx scripts/preview-companion-welcome.ts` renders the builder output
to `docs/email/companion-welcome.html` for browser inspection (mirrors the inspectable-artifact
pattern of `build-emails.ts`).

### Acceptance

- The preview script writes valid HTML+text; the HTML renders correctly when opened in a browser.
- Submitting the companion form fires this email via Resend (live dev check, env permitting).
- Subject/heading/body match the campaign voice; unsubscribe + privacy links present.

---

## 4. Instagram story

**Tool:** `deriva-ig-posts` skill, 1080×1920 Paper artboard.

**Content:**
- Hero **"Crea tu propia Deriva."** (single green moment), toolkit line, *"Muy pronto."*
- CTA: *"Súmate — link en bio."* (or link sticker).
- Locked IG typography scale, edition device, safe zones per the skill.

**Output:** final render moved into `09_marketing/` (not left in Downloads).

### Acceptance

- Passes the deriva-ig-posts standards checklist; verified by Read-ing the exported PNG
  (screenshots lie about rotation/crop).
- Founder approves the Paper artboard before it ships.

---

## Build order

1. Subscription pipeline (server + config + form prop) — testable headless.
2. Landing section Paper mock → approval → implementation.
3. Companion welcome builder in `welcome-email.ts` → preview HTML artifact → live dev send.
4. IG story Paper artboard → approval → export.

Each visual deliverable (2, 4) is gated on founder approval of its Paper mock before any
deploy/export.
