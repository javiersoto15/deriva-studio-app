# Deriva Web App Agent Guide

This folder is the standalone product web app for Deriva Coffee Studio. Keep web-app code, dependencies, generated output, public assets, and future API client code inside `10_webapp/` so the main repo can remain focused on brand, operations, finance, equipment, and design documentation.

## App Boundary

- Run all app commands from `10_webapp/`.
- Do not create root-level `package.json`, `package-lock.json`, `node_modules`, `apps/`, or `packages/`.
- Keep app source in `app/` and `src/`.
- Keep web-delivered static assets in `public/`.
- Keep generated output local to this folder: `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`.

## Commands

Use the bundled Node runtime when available because current Next requires Node `>=20.9.0`:

```bash
cd /Users/javiersoto/Documents/Project/DerivaStudio/10_webapp
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run dev -- --hostname 127.0.0.1 --port 3000
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run typecheck
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build
```

If dependencies are missing, run `npm install` from `10_webapp/` only. Do not run npm install from the repo root.

## Current Structure

- `app/layout.tsx` — root metadata and HTML shell.
- `app/page.tsx` — temporary branded holding page.
- `app/globals.css` — current global visual system for the holding page.
- `src/brand/index.ts` — local Deriva colors, type names, holding-page copy, and asset paths.
- `public/brand/` — app-local copies of logo and font assets.
- `package.json` — standalone app scripts and dependencies.

## Feature Workflow — Paper-First Design Confirmation

**Every visual feature must be ported to Paper Desktop and confirmed by the user BEFORE shipping to production.** Code-first or deploy-first is not allowed for anything that touches the visual system — landing surfaces, emails, marketing pages, modals, forms, internal screens, anything a user can see.

The workflow is:

1. **Build / refine in code locally** — typecheck, build, run dev server, check the work renders correctly.
2. **Port to Paper before any deploy.** Create or update Paper artboards that mirror the actual rendered output:
   - Use `paper-desktop:code-to-design` skill, or directly use the Paper MCP tools.
   - **Always at minimum two breakpoints**: a mobile artboard (390 × 844) and a desktop artboard (1440 × 900 for pages, 1024 × variable for emails). Add tablet (768 × 1024) when the layout changes meaningfully there.
   - For emails: include both the standard 600px email-body view AND a wider desktop-reading-pane view (~1024px wide with the card centered in extended ground).
   - Use the actual brand tokens, fonts, and copy — not placeholders.
   - Take screenshots of each artboard.
3. **Show the user the screenshots and wait for confirmation** before any `vercel`, `vercel --prod`, or `vercel promote` command runs. Do not deploy on assumption.
4. **Only after explicit user approval** ("ship it", "go", "promote", or equivalent), proceed to deploy: preview first, then promote.
5. **If the user requests a copy or visual change post-port, update the Paper artboards before deploying** so the artboards always reflect what's actually live.

This applies automatically to ALL feature work in this repo — even when the user says "deploy" or "ship" without explicitly asking for a Paper port. The default is: Paper port → confirmation → deploy. The only exceptions:
- Pure non-visual changes (env vars, dependencies, build config, server-only logic with no UI surface, type fixes).
- The user explicitly says "skip Paper" or "don't port to Paper this time".

## Design Research & Inspiration

Before any design exploration — landing redesigns, email layouts, page sections, component variants, marketing surfaces, or visual direction proposals — the **first** reference must be:

- **https://styles.refero.design/** — primary inspiration index for existing real-world designs. Browse this for direction and reference implementations before opening web search or reaching for generic stock layouts.

Workflow for design research:

1. Start at `styles.refero.design` and pull 3–5 references that align with the requested direction (mood, density, typography, layout pattern). Note the reference URLs in the design brief.
2. Supplement with targeted web research only when refero doesn't cover the specific pattern (industry-specific layouts, niche interactions, very recent trends).
3. Cross-check every reference against the Deriva brand voice (warm, architectural, place-led, Spanish-first) before adopting any pattern. Reject anything that pulls toward generic SaaS or "premium" cliché.
4. When proposing a direction, cite the refero references that informed it so the user can audit the inspiration trail.

This applies to all design work: holding-page iterations, future menu/operations UI, email templates, marketing pages, social card layouts, and Paper exploration sessions.

## Source Of Truth

Use these files before changing the visual language:

- `../00_brand/Deriva_Studio_Brand_Foundation.md` — brand mission, voice, pillars, product lines, and service philosophy.
- `../00_brand/logo_design/` — canonical logo source files.
- `../00_brand/logo_design_master/brandbook.png` and `../00_brand/logo_design_master/brandbook.pdf` — visual brandbook references.
- `../08_spatial_design_system/design_runbook.md` — current preferred web/marketing design direction.
- `../08_spatial_design_system/reference_research.md` — coffee-site benchmark rationale.
- `../08_spatial_design_system/landing_page.html` — latest static spatial landing-page mockup.
- `../07_design_system/design_system.md` — earlier editorial design system. Treat as useful context, not the current preferred web direction when it conflicts with `08_spatial_design_system`.
- `../INDEX.md` — repository map and domain ownership.

## Brand Characteristics

Deriva is a Providencia specialty coffee, mate, and food studio. The web app should feel like a physical destination: warm, intentional, architectural, plant-filled, and designed for lingering.

Core traits:

- Spanish-first, globally aware.
- Craft without pretension.
- Warmth before luxury.
- Place-led, not generic cafe-commerce.
- Coffee, mate, and kitchen as equal reasons to visit.
- The Go backend will become the source of truth for menu, waitlist/email, operations, and future mobile data.

Avoid:

- Generic latte-art hero imagery.
- SaaS-like gradients, decorative orbs, bokeh blobs, or marketing filler.
- Corporate words like `premium`, `luxury`, `gourmet`, `cheap`, or `fast`.
- Recreating the logo in live text.
- Moving app dependencies back to the repo root.

## Theme Tokens

Current app tokens live in `src/brand/index.ts` and are mirrored as CSS custom properties in `app/globals.css`.

Use these color roles consistently:

- `paper` / `#F8F4ED` — main warm-white canvas.
- `cream` / `#F4EDE6` — soft inset background.
- `beige` / `#D7C7AB` — warm architectural surface.
- `roast` / `#5E230F` — primary coffee-brown action color.
- `espresso` / `#281A12` — deep text, footer, and maximum contrast.
- `green` / `#00311F` — botanical accent, wayfinding, logo mark.
- `copper` / `#B87333` — light/accent/rule, not a dominant surface.
- `ink` / `#201812` — body text.
- `muted` / `#67594D` — secondary copy.

Typography rules:

- Logo files carry the Deriva wordmark. Do not recreate the wordmark in HTML text.
- Use expressive serif display type for atmospheric headlines.
- Use clean sans-serif for body and utility UI.
- Use monospace only for coordinates, status, opening details, API/menu facts, and operational labels.
- Letter spacing should stay `0` except small uppercase utility labels.

## UI Direction

## Responsive Contract

The web app must be completely responsive out of the box. Every public and internal screen should fit usable web and mobile viewport sizes without horizontal scrolling, clipped text, overlapping UI, or hidden primary actions.

Apply this contract before shipping any UI:

- Design mobile compositions deliberately, including compact iPhone widths such as 320 px, 375 px, 390 px, and 430 px. Do not rely on desktop layouts simply scaling down.
- It is acceptable to modify markup structure, line breaks, spacing, density, or content grouping so the experience fits mobile screens cleanly.
- Use fluid layout primitives by default: `minmax(0, 1fr)`, `min-width: 0`, `max-width: 100%`, responsive `clamp()`, stable aspect ratios, and safe-area padding.
- Text must wrap inside its container. Use shorter mobile copy, explicit line breaks, `overflow-wrap`, or mobile-specific widths when needed. Never allow utility labels, buttons, headings, or metadata to force horizontal overflow.
- Fixed-format elements such as logos, controls, cards, grids, and toolbars need stable responsive dimensions so hover/focus/dynamic content cannot shift layout.
- Avoid `100vw` for full-width containers unless scrollbar behavior is handled; prefer `width: 100%`.
- Before handoff after visual/layout changes, verify at desktop plus at least 430 px, 390 px, 375 px, and 320 px wide mobile screenshots.

For the temporary holding page:

- Keep the message short and operational.
- Preferred line: `Estamos calibrando los molinos.`
- Show the logo clearly.
- Include opening/location context: `Magnere 1570 Local 105, Providencia · Abrimos pronto`.
- Keep status labels small and functional.

For future app work:

- The public landing should evolve from the `08_spatial_design_system` direction.
- Menu pages should be concrete and useful: items, prices when known, preparation notes, availability, and source data from the Go API.
- Operations pages should be dense, calm, and task-oriented. Avoid oversized hero treatments in internal workflows.
- Email/waitlist screens must clearly distinguish public subscription flows from internal operational views.

## Go API Integration Guidance

Do not hard-code future dynamic data once the Go backend exists. Use a small API layer under `src/api/` or `src/services/`.

Expected future resources:

- Menu categories and items.
- Opening status and hours.
- Waitlist/email signup.
- Operational email/customer views.
- Store/location metadata.

Keep API contracts explicit with TypeScript types near the client functions. Do not introduce global client state until a real shared state need exists.

## SEO & Metadata Maintenance

The site has SEO infrastructure in `app/` that mostly self-updates. Know what is automatic vs. what needs human edits.

### Auto-updates on every deploy (zero work)

- `app/sitemap.ts` — `lastModified: new Date()` runs at build time; every deploy refreshes timestamps.
- `app/opengraph-image.tsx` — generated dynamically from `derivaColors` + JSX; rebuilds on every deploy. Lives at `/opengraph-image` (1200×630 PNG).
- `app/robots.ts`, `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.png` — static, no maintenance.

### Update only when content changes

- **`metadata` in `app/layout.tsx`** — title, description, keywords, OpenGraph copy. Touch when the value prop shifts (e.g. "abrimos pronto" → real launch).
- **JSON-LD in `app/page.tsx`** (`localBusinessJsonLd`) — update when business facts change:
  - `openingHoursSpecification`: currently Mon–Fri 08:00–21:00, Sat 10:00–21:00 (closed Sun). Update if hours shift; Google's local pack and Maps consume this directly.
  - `servesCuisine`: when menu categories expand (wine, brunch, pastry, etc.).
  - `telephone`, `email`: add when available.
  - `sameAs`: currently lists Instagram (`@deriva.coffee.studio`). Append TikTok / Facebook / etc. as they launch — this is the field Google's Knowledge Graph uses to link the business to its socials.
  - `priceRange`, `address`, `geo`: only on real-world changes.
- **`app/sitemap.ts`** — add an entry only when adding a *new route* (e.g. `/menu`, `/contacto`). Existing route timestamps refresh automatically.

### Do not touch unless rebrand

Brand name, logo, address, geo coordinates, favicon assets.

### Cadence

There is no scheduled refresh. Google re-crawls `derivastudio.cl` on its own. Outstanding follow-ups: add `telephone` once a café line exists, and append additional social profiles to `sameAs` as they're created.

## Verification Before Handoff

Before saying the web app is ready, run from `10_webapp/`:

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run typecheck
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build
```

For visual changes, also run the app locally and inspect the page in a browser:

```bash
PATH="/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run dev -- --hostname 127.0.0.1 --port 3000
```

Use screenshots for desktop and mobile widths when changing layout, typography, spacing, or images.
