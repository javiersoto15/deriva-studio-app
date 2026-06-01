# Companion Teaser Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a coming-soon teaser campaign for the Deriva Companion app — a dedicated email-interest list, a landing CTA section, a synchronous welcome email, and an Instagram story — hooked on "Crea tu propia Deriva."

**Architecture:** Generalize the existing Apertura waitlist pipeline with a `campaign` discriminator (`"apertura" | "companion"`) rather than forking it. One server action, one form component, two campaigns each resolving its own Resend audience + copy + welcome email. Visual surfaces (landing section, IG story) are Paper-mocked and founder-approved before any deploy.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19 (`useActionState`), Resend SDK, Zod, raw-HTML email string builder (transactional), Paper (mock/IG).

**No test runner exists in this repo.** Verification gates are `npm run typecheck`, a rendered email HTML artifact opened in a browser, a live dev form submit, and Paper/founder approval — matching project conventions (deriva-webapp orchestrator).

**Spec deviation (noted):** spec §3 named a react-email `CompanionInterest.tsx`. The actual signup-confirmation path is the raw-HTML transactional builder `src/server/welcome-email.ts` (react-email is reserved for broadcast blasts). This plan extends `welcome-email.ts` instead.

---

## File Structure

- `src/config/waitlist.ts` — **modify.** Add `Campaign` type, `companion` copy variant, `campaignConfig` (audience env var per campaign), `getCampaignCopy()`.
- `src/server/welcome-email.ts` — **modify.** Add `buildCompanionWelcomeEmail()` + `buildWelcomeEmailFor(campaign, ...)` dispatcher.
- `src/server/waitlist.ts` — **modify.** Read `campaign` from form data; resolve audience/copy/email by campaign; per-campaign rate-limit key.
- `src/components/WaitlistForm.tsx` — **modify.** Accept `campaign` prop; render hidden field; select copy by campaign.
- `scripts/preview-companion-welcome.ts` — **create.** Renders the companion welcome to `docs/email/companion-welcome.html` for browser inspection.
- `.env.example` — **modify.** Document `RESEND_COMPANION_AUDIENCE_ID`.
- `app/(landing)/page.tsx` (+ landing CSS) — **modify.** New companion CTA section (Paper-gated).
- `09_marketing/` — IG story export (Paper-gated, via deriva-ig-posts skill).

---

## Task 1: Campaign config

**Files:**
- Modify: `src/config/waitlist.ts`

- [ ] **Step 1: Add the `Campaign` type and `campaignConfig` near the top, after `waitlistConfig`**

```ts
export type Campaign = "apertura" | "companion";

// Each campaign routes to its own Resend audience via this env var name.
export const campaignConfig: Record<Campaign, { audienceEnvVar: string }> = {
  apertura: { audienceEnvVar: "RESEND_AUDIENCE_ID" },
  companion: { audienceEnvVar: "RESEND_COMPANION_AUDIENCE_ID" },
};
```

- [ ] **Step 2: Add the `companion` copy variant**

Add this constant after `rewardCopy` (it reuses the existing `CopyVariant` shape):

```ts
const companionCopy: CopyVariant = {
  formIntro:
    "Crea tu propia Deriva. Tu carta, tu código y tus recompensas, todo en un lugar. Suma tu correo y te avisamos cuando esté lista.",
  formLabelEmail: "Correo",
  formLabelName: "Nombre (opcional)",
  placeholderEmail: "tu@correo.cl",
  placeholderName: "Cómo te llamas",
  consentLine: "Acepto recibir correos de Deriva sobre la app.",
  privacyLinkLabel: "Política de privacidad",
  submit: "Avísame",
  submitting: "Enviando…",
  successTitle: "Listo. Llegas tú primero.",
  successBody: "Cuando la app esté lista, te escribimos a tu correo antes que a nadie.",
  errorGeneric: "Algo falló. Inténtalo de nuevo en un momento.",
  errorInvalid: "Revisa el correo ingresado.",
  errorRateLimit: "Recibimos varios intentos. Espera un momento e intenta otra vez.",
  emailSubject: "Se viene tu propia Deriva",
  emailHeading: "Crea tu propia Deriva.",
  emailBody:
    "Estás en la lista. Muy pronto vas a tener tu propia Deriva: tu carta, tu código de miembro y tus recompensas, todo en un lugar.\n\nNo te llenamos el correo. Te escribimos cuando esté lista.",
  emailSignoff: "— Equipo Deriva",
};
```

- [ ] **Step 3: Add `getCampaignCopy()` after `getWaitlistCopy()`**

```ts
export function getCampaignCopy(campaign: Campaign): CopyVariant {
  return campaign === "companion" ? companionCopy : getWaitlistCopy();
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/config/waitlist.ts
git commit -m "feat(campaign): add companion campaign config + copy"
```

---

## Task 2: Companion welcome email builder

**Files:**
- Modify: `src/server/welcome-email.ts`

- [ ] **Step 1: Import the campaign helpers**

Change the top import to also pull the campaign helpers:

```ts
import { getWaitlistCopy, getCampaignCopy, waitlistConfig, type RewardMode, type Campaign } from "../config/waitlist";
```

- [ ] **Step 2: Add `buildCompanionWelcomeEmail()` at the end of the file (before the `escapeHtml` helper)**

It mirrors `buildWelcomeEmail`'s chrome but swaps the masthead/headline to the companion hook, drops the "both" reward block, and adds a toolkit row. Reuse the module-level `COLORS`, `FONT_DISPLAY`, `FONT_MONO`, `LOGO_URL`, `PRIVACY_URL`, `escapeHtml`.

```ts
export function buildCompanionWelcomeEmail(firstName?: string) {
  const copy = getCampaignCopy("companion");
  const greeting = firstName ? `Hola ${escapeHtml(firstName)},` : "Hola,";
  const paragraphs = copy.emailBody.split("\n\n");
  const bodyHtml = paragraphs
    .map(
      (paragraph, i) => `
        <p style="margin:10px 0 0; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${i === paragraphs.length - 1 ? COLORS.muted : COLORS.ink}; text-align:center;">
          ${escapeHtml(paragraph)}
        </p>`,
    )
    .join("");

  // Toolkit row — the three pieces of "tu propia Deriva".
  const toolkit = ["Tu carta", "Tu código", "Tus recompensas"]
    .map(
      (label) => `
        <td align="center" style="padding:0 6px;">
          <p style="margin:0; font-family:${FONT_DISPLAY}; font-size:18px; font-style:italic; line-height:1.1; color:${COLORS.green};">${label}</p>
        </td>`,
    )
    .join(`<td width="1" style="background:${COLORS.hairline};">&nbsp;</td>`);

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.emailSubject)}</title>
  </head>
  <body style="margin:0; padding:0; background:${COLORS.ground}; font-family:${FONT_MONO}; color:${COLORS.ink};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(copy.successBody)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.ground};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:${COLORS.paper}; border:1px solid ${COLORS.hairline};">
            <tr>
              <td align="center" style="padding:32px 28px 28px;">
                <img src="${LOGO_URL}" alt="Deriva Coffee Studio" width="112" height="112" style="display:block; border:0; outline:none; text-decoration:none; width:112px; height:112px;" />
                <p style="margin:12px 0 0; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.32em; text-transform:uppercase; color:${COLORS.muted};">
                  La app de Deriva
                  &nbsp;<span style="font-family:Arial, sans-serif; color:${COLORS.copper};">&#9670;</span>&nbsp;
                  <span style="color:${COLORS.ink};">Muy pronto</span>
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;">
                  <tr><td width="44" height="1" style="background:${COLORS.copper}; line-height:1px; font-size:0;">&nbsp;</td></tr>
                </table>
                <p style="margin:14px 0 0; font-family:${FONT_DISPLAY}; font-size:42px; font-weight:400; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.ink};">
                  Crea tu propia
                </p>
                <p style="margin:2px 0 0; font-family:${FONT_DISPLAY}; font-size:50px; font-weight:400; font-style:italic; line-height:0.98; letter-spacing:-0.01em; color:${COLORS.green};">
                  Deriva.
                </p>
                <table role="presentation" width="380" cellpadding="0" cellspacing="0" border="0" style="max-width:380px;">
                  <tr>
                    <td align="center" style="padding-top:18px;">
                      <p style="margin:0; font-family:${FONT_MONO}; font-size:13px; font-weight:400; line-height:1.6; color:${COLORS.ink}; text-align:center;">${greeting}</p>
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px auto 0;">
                  <tr>${toolkit}</tr>
                </table>
                <p style="margin:22px 0 0; font-family:${FONT_DISPLAY}; font-size:18px; font-style:italic; color:${COLORS.roast};">
                  ${escapeHtml(copy.emailSignoff)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 28px 28px; font-family:${FONT_MONO}; font-size:10px; font-weight:400; letter-spacing:0.18em; line-height:1.5; text-transform:uppercase; color:${COLORS.muted};">
                Magnere 1570 Local 105<br />
                Providencia, Santiago
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
            <tr>
              <td align="center" style="padding:14px 24px 0; font-family:${FONT_MONO}; font-size:9.5px; font-weight:400; line-height:1.55; color:${COLORS.muted};">
                Recibes este correo porque te sumaste a la lista de la app de Deriva en derivastudio.cl.
                <br />
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${COLORS.green}; text-decoration:underline;">Darse de baja</a>
                &nbsp;·&nbsp;
                <a href="${PRIVACY_URL}" style="color:${COLORS.green}; text-decoration:underline;">Política de privacidad</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "DERIVA COFFEE STUDIO — LA APP",
    "",
    "Crea tu propia Deriva.",
    "",
    greeting,
    "",
    copy.emailBody,
    "",
    "Tu carta · Tu código · Tus recompensas",
    "",
    copy.emailSignoff,
    "",
    "Magnere 1570 Local 105",
    "Providencia, Santiago",
    "",
    "Recibes este correo porque te sumaste a la lista de la app de Deriva en derivastudio.cl.",
    `Política de privacidad: ${PRIVACY_URL}`,
  ].join("\n");

  return { subject: copy.emailSubject, html, text };
}
```

- [ ] **Step 3: Add a `buildWelcomeEmailFor()` dispatcher right after `buildCompanionWelcomeEmail`**

```ts
export function buildWelcomeEmailFor(
  campaign: Campaign,
  firstName?: string,
  mode: RewardMode = waitlistConfig.rewardMode,
) {
  return campaign === "companion"
    ? buildCompanionWelcomeEmail(firstName)
    : buildWelcomeEmail(mode, firstName);
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/server/welcome-email.ts
git commit -m "feat(campaign): companion welcome email builder + dispatcher"
```

---

## Task 3: Preview the companion welcome HTML

**Files:**
- Create: `scripts/preview-companion-welcome.ts`

- [ ] **Step 1: Write the preview script**

```ts
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { buildCompanionWelcomeEmail } from "../src/server/welcome-email";

const { subject, html, text } = buildCompanionWelcomeEmail("Javier");
mkdirSync(resolve("docs/email"), { recursive: true });
writeFileSync(resolve("docs/email/companion-welcome.html"), html, "utf8");
writeFileSync(resolve("docs/email/companion-welcome.txt"), text, "utf8");
console.log(`✓ Companion welcome\n  Subject: ${subject}\n  HTML: docs/email/companion-welcome.html`);
```

- [ ] **Step 2: Run it**

Run: `npx tsx scripts/preview-companion-welcome.ts`
Expected: prints `✓ Companion welcome` and writes the two files.

- [ ] **Step 3: Inspect the rendered HTML**

Open `docs/email/companion-welcome.html` in a browser. Verify: logo renders, headline reads "Crea tu propia / Deriva." with *Deriva* in green (single green moment), toolkit row shows "Tu carta · Tu código · Tus recompensas", footer copy mentions the app list, unsubscribe + privacy links present.

- [ ] **Step 4: Commit**

```bash
git add scripts/preview-companion-welcome.ts docs/email/companion-welcome.html docs/email/companion-welcome.txt
git commit -m "chore(campaign): companion welcome email preview artifact"
```

---

## Task 4: Campaign-aware WaitlistForm

**Files:**
- Modify: `src/components/WaitlistForm.tsx`

- [ ] **Step 1: Import the campaign helpers**

Replace the config import line with:

```ts
import { getCampaignCopy, waitlistConfig, type Campaign } from "../config/waitlist";
```

- [ ] **Step 2: Accept a `campaign` prop and resolve copy from it**

Change the component signature and copy resolution:

```ts
export function WaitlistForm({ campaign = "apertura" }: { campaign?: Campaign }) {
  const copy = getCampaignCopy(campaign);
```

- [ ] **Step 3: Render a hidden campaign field inside the `<form>`**

Add immediately after the opening `<form ...>` tag, before the intro `<p>`:

```tsx
      <input type="hidden" name="campaign" value={campaign} />
```

- [ ] **Step 4: Pass copy into `SubmitButton` so it stops calling `getWaitlistCopy()` directly**

Change the call site to `<SubmitButton copy={copy} />` and update the component:

```tsx
function SubmitButton({ copy }: { copy: ReturnType<typeof getCampaignCopy> }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="waitlist__submit" disabled={pending}>
      {pending ? copy.submitting : copy.submit}
    </button>
  );
}
```

Remove the now-unused `getWaitlistCopy` reference from `SubmitButton`.

- [ ] **Step 5: Verify types compile**

Run: `npm run typecheck`
Expected: no errors. (The existing apertura usage passes no prop → defaults to `"apertura"`, unchanged.)

- [ ] **Step 6: Commit**

```bash
git add src/components/WaitlistForm.tsx
git commit -m "feat(campaign): WaitlistForm accepts campaign prop"
```

---

## Task 5: Campaign-aware subscribe server action

**Files:**
- Modify: `src/server/waitlist.ts`

- [ ] **Step 1: Update imports**

```ts
import { getCampaignCopy, campaignConfig, type Campaign } from "../config/waitlist";
import { buildWelcomeEmailFor } from "./welcome-email";
```

Remove the old `getWaitlistCopy` / `buildWelcomeEmail` imports.

- [ ] **Step 2: Add `campaign` to the Zod schema**

Add to the `schema` object:

```ts
  campaign: z.enum(["apertura", "companion"]).default("apertura"),
```

- [ ] **Step 3: Parse `campaign` and resolve copy from it**

Replace the top of `subscribeToWaitlist` (the `const copy = ...` line and the `safeParse` call):

```ts
export async function subscribeToWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    consent: formData.get("consent"),
    company: formData.get("company") ?? "",
    campaign: formData.get("campaign") ?? "apertura",
  });

  if (!parsed.success) {
    return { status: "error", message: getCampaignCopy("apertura").errorInvalid };
  }

  const { email, name, campaign } = parsed.data;
  const copy = getCampaignCopy(campaign);
  const firstName = name && name.length > 0 ? name : undefined;
```

Delete the original `const copy = getWaitlistCopy();` at the top and the original destructuring of `parsed.data`.

- [ ] **Step 4: Make the rate-limit key per-campaign**

```ts
  if (!rateLimit(`${campaign}:${email}`)) {
    return { status: "error", message: copy.errorRateLimit };
  }
```

- [ ] **Step 5: Resolve the audience by campaign**

Replace `const audienceId = process.env.RESEND_AUDIENCE_ID;` with:

```ts
  const audienceId = process.env[campaignConfig[campaign].audienceEnvVar];
```

The `if (!apiKey || !audienceId)` guard below stays as-is (now also covers a missing companion audience → graceful generic error).

- [ ] **Step 6: Use the campaign-aware welcome builder**

Replace `const welcome = buildWelcomeEmail(waitlistConfig.rewardMode, firstName);` with:

```ts
  const welcome = buildWelcomeEmailFor(campaign, firstName);
```

Remove the now-unused `waitlistConfig` import if nothing else references it (the `from`/`fromName` fallbacks reference `waitlistConfig.brandName` — keep the import if so).

- [ ] **Step 7: Verify types compile**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Live dev verification**

Run: `npm run dev`. With `RESEND_COMPANION_AUDIENCE_ID` set in `.env.local`, temporarily render `<WaitlistForm campaign="companion" />` on a dev page (or wait for Task 7) and submit a test email. Confirm in the Resend dashboard the contact lands in audience `8810ed04-…` and the companion welcome arrives. (If env not yet set, this step is deferred to post-env-setup.)

- [ ] **Step 9: Commit**

```bash
git add src/server/waitlist.ts
git commit -m "feat(campaign): route subscribe by campaign to its audience + email"
```

---

## Task 6: Document the new env var

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the companion audience under the Resend block**

```
RESEND_COMPANION_AUDIENCE_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(env): document RESEND_COMPANION_AUDIENCE_ID"
```

**Founder action (out-of-band, not a code step):** set `RESEND_COMPANION_AUDIENCE_ID=8810ed04-0a27-4bbb-88cc-1268cb2420a5` in `.env.local` and on Vercel (production).

---

## Task 7: Landing CTA section (Paper-gated)

> **Gate:** Per the paper-first deploy workflow, mock this section in Paper (mobile + desktop) and get founder approval **before** writing the JSX, and do not deploy until the founder approves. Paper MCP must be reconnected for this task.

**Files:**
- Modify: `app/(landing)/page.tsx` and its landing CSS.

- [ ] **Step 1: Mock in Paper**

Create mobile + desktop artboards for the companion teaser section: § mast `LA APP DE DERIVA`, hero "Crea tu propia Deriva." (*Deriva* = single green moment), subline "Tu carta, tu código, tus recompensas. Todo en un lugar.", tease "Muy pronto.", the form, "No te llenamos el correo." Use editorial tokens (Cormorant italic display, Plex Mono labels, plaster × ink palette). Export a screenshot for approval.

- [ ] **Step 2: Founder approval**

Present the Paper mock. Wait for explicit approval before proceeding. Do not deploy.

- [ ] **Step 3: Read the current landing page to find the insertion point**

Run: `Read app/(landing)/page.tsx`. Identify the section ordering (likely insert after the hours/menu block, before the footer). Match existing section markup + CSS conventions.

- [ ] **Step 4: Add the section markup**

Add a `<section>` mirroring the approved mock, rendering `<WaitlistForm campaign="companion" />`. Reuse existing `.waitlist*` CSS; add only section-level styles needed for the editorial layout. (Exact JSX is authored against the approved mock — keep one green moment, no new card component.)

- [ ] **Step 5: Verify**

Run: `npm run typecheck` then `npm run dev`. Confirm the section matches the approved mock at mobile + desktop widths, and the form submits to the companion campaign.

- [ ] **Step 6: Commit**

```bash
git add app/(landing)/page.tsx
git commit -m "feat(landing): companion app teaser CTA section"
```

---

## Task 8: Instagram story (Paper-gated)

> **Gate:** Use the `deriva-ig-posts` skill (standards checklist, safe zones, file naming, locked typography scale). Founder approves the Paper artboard before export. Paper MCP must be reconnected.

**Files:**
- Export into: `09_marketing/` (per the final-renders-in-folders rule — never leave finals in Downloads).

- [ ] **Step 1: Invoke deriva-ig-posts and build the 1080×1920 story**

Hero "Crea tu propia Deriva." (single green moment), toolkit line, "Muy pronto.", CTA "Súmate — link en bio." Honor safe zones + locked IG typography scale + edition device.

- [ ] **Step 2: Verify the export by reading the PNG**

Read the exported PNG (screenshots lie about rotation/crop). Confirm symmetry, safe zones, single green moment, legible type.

- [ ] **Step 3: Founder approval, then move the final into `09_marketing/`**

---

## Self-Review

- **Spec coverage:** §1 pipeline → Tasks 1,4,5,6. §2 landing → Task 7. §3 email → Tasks 2,3. §4 IG story → Task 8. Build order preserved. ✓
- **Placeholders:** Code tasks (1–6) contain complete code. Tasks 7–8 are intentionally design-gated (Paper mock → approval → author against mock); their "author the JSX against the approved mock" step is a genuine dependency on an unviewable artifact, not a placeholder. ✓
- **Type consistency:** `Campaign` defined in Task 1, consumed identically in Tasks 2/4/5. `getCampaignCopy`, `campaignConfig`, `buildWelcomeEmailFor`, `buildCompanionWelcomeEmail` names match across tasks. `WaitlistForm` prop `{ campaign?: Campaign }` matches its usage in Task 7. ✓
- **No-test-runner deviation:** documented in header; verification via typecheck/render-artifact/dev-submit/Paper approval. ✓
