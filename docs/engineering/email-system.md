# Email system — react-email + Resend

How transactional and broadcast emails are authored, built, and delivered.

## Stack

- **Authoring**: [react-email](https://react.email) JSX components in `src/emails/*.tsx`
- **Components**: `@react-email/components` (`Body`, `Container`, `Heading`, `Text`, `Hr`, `Link`, `Section`, `Preview`)
- **Rendering**: `@react-email/render` → static HTML + plain text
- **Delivery**: [Resend](https://resend.com) — transactional via `resend.emails.send()` (verified Server Action), bulk via Resend Broadcasts dashboard
- **Sender**: `Deriva Coffee Studio <hola@derivastudio.cl>` (verified domain, DKIM/SPF/DMARC aligned)

## Why react-email and not raw HTML

We tried hand-written HTML emails first. The migration to react-email happened after symptoms kept recurring across iterations: text mysteriously left-aligning in iOS Mail dark mode, "white boxes" appearing around content blocks (Apple Mail's auto-inversion seam), Outlook-specific line-height bugs, orphan logos floating at top-left, etc. Each manual fix surfaced another regression.

react-email solves these by construction:

- Emits XHTML 1.0 Transitional DOCTYPE (email-industry standard)
- Adds `mso-line-height-rule:exactly` and pixel line-heights for Outlook
- Generates Outlook MSO conditional scaffolding
- Cross-client safe table structure
- Auto-inlined styles (resilient when receiving clients strip `<style>`)

See `feedback_email_rendering_lessons.md` in agent memory for the full debug history.

## File layout

```
src/emails/
  AperturaAnnouncement.tsx          # broadcast email (May 18 announcement)

src/server/
  welcome-email.ts                  # transactional welcome (still raw HTML; could be migrated)
  waitlist.ts                       # Server Action that fires welcome-email.ts on new signup

scripts/
  build-emails.ts                   # renders JSX → docs/email/*.html + *.txt
  send-test-apertura.ts             # one-off API test send

docs/email/
  apertura-announcement.html        # GENERATED — do not edit by hand
  apertura-announcement.txt         # GENERATED — plain-text fallback
  README.md                         # broadcast workflow (this also references this doc)
```

## Authoring workflow

```bash
# 1. Edit JSX
$EDITOR src/emails/AperturaAnnouncement.tsx

# 2. Build static HTML + text
npm run email:build

# 3. Preview locally
open docs/email/apertura-announcement.html

# 4. Send yourself a real API test (bypasses Resend dashboard preview)
npm run email:test-send -- you@email.com

# 5. Once happy, copy docs/email/apertura-announcement.html into Resend Broadcasts dashboard
```

## Build pipeline details

`scripts/build-emails.ts`:

1. Calls `render()` on the AperturaAnnouncement component
2. Strips `<link rel="preload" as="image">` from the head — React 19 SSR auto-injects these, and some clients (and Resend's preview pane) render them as visible orphan images at the top of the document
3. Writes pretty-printed HTML to `docs/email/apertura-announcement.html`
4. Renders plain-text fallback to `docs/email/apertura-announcement.txt`

The preload-strip post-processing is **load-bearing** — do not remove it.

## Dark mode

Two CSS scopes in the `<style>` block:

- `@media (prefers-color-scheme: dark)` — honored by Apple Mail, iOS Mail, Outlook 2021+
- `[data-ogsc]` attribute selectors — Gmail's forced-dark mode prefixes attributes with `data-ogsc` / `data-ogsb`

Both scopes carry identical rules: dark warm-charcoal backgrounds, cream text, sage-green accents (from `derivaColors.sage`), and a swap from `isotipo-verde@2x.png` (deep green) to `isotipo-sage@2x.png` (sage) for the logo. Two `<img>` tags load (only one is visible at a time via CSS `display`) because Gmail strips `<picture>` elements.

## Dedup on resubmission

`src/server/waitlist.ts` checks Resend's `contacts.create()` error message for "already" / "exists" and short-circuits without sending a second welcome email. Returning users see the same friendly success UI but receive nothing in their inbox.

For the apertura announcement broadcast: Resend Broadcasts tracks delivery per contact, so re-running the same broadcast won't double-send. Don't reuse one Broadcast for follow-up sends — create a new Broadcast each time.

## Asset hosting

All email image references use absolute URLs at `derivastudio.cl/brand/`:

- `isotipo-verde@2x.png` (deep forest green, light mode)
- `isotipo-sage@2x.png` (sage green, dark mode)
- Both also available at @1x and @3x

These are served from `public/brand/` and deployed with the site. Email clients don't need to load anything from a localhost or third-party CDN.

## Known constraints

- Gmail strips inline SVG; never inline brand SVG in emails — use the raster PNGs at `derivastudio.cl/brand/`
- Gmail strips `<picture>` elements; use the two-`<img>` + CSS-display-swap pattern for light/dark logo
- Outlook for Windows is the weakest renderer; favor react-email components over raw markup so MSO conditionals are generated correctly
