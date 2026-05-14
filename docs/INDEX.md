# Deriva Studio — Documentation Index

Living index of all design, engineering, brand, and campaign documentation for the Deriva Coffee Studio web app.

Add a new entry here every time you create a new doc — one line, with a short hook describing what it covers.

---

## Campaigns

- [Apertura Piloto — Lunes 18 de Mayo 2026](./campaign/2026-05-18-apertura-piloto.md) — Launch campaign overview: dates, free-cup offer mechanics, all surfaces touched, broadcast workflow, Paper artboard references.

## Engineering

- [Email system — react-email + Resend](./engineering/email-system.md) — How emails are authored in JSX, built to HTML, and sent. Why we left raw HTML for react-email. Dark-mode strategy, dedup logic, asset hosting.
- [Deployment + SEO/Discovery](./engineering/deployment-and-seo.md) — Vercel deploys, standing rules (Paper-first, explicit approval), favicon/JSON-LD setup, Google Search vs Google Maps signals, GBP claim checklist.
- [SumUp MCP + skill](./engineering/sumup-mcp.md) — `.mcp.json` config, API key storage in `~/.zshrc`, activation steps, scope (terminal + online payments).

## Design

- [Holding page — Redesign D (Warm Gallery Maintenance)](./design/2026-04-30-holding-page-redesign-d.md) — Final warm-gallery direction now live in production. Brief, palette, typography, structure, and Paper artboard references.

## Brand

- [Colors and typography](./brand/colors-and-typography.md) — Light + dark palettes, type scale on holding page and apertura email, brand asset inventory, recurring motifs (copper diamonds, corner brackets, copper rules).

## Email

- [Email broadcast README](./email/README.md) — Manual broadcast send via Resend dashboard. Step-by-step for the apertura announcement and dedup behavior.

---

## Conventions

- File names: `YYYY-MM-DD-kebab-case-title.md` for time-bound docs (campaigns, design reviews); plain `kebab-case-title.md` for evergreen reference docs
- One entry per doc in this index, grouped by section
- Keep each index line under ~150 characters
- Prefer updating an existing doc over creating near-duplicates
- Generated files (e.g. `docs/email/apertura-announcement.html`) are not indexed — they're build artifacts
