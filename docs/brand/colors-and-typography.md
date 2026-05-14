# Brand — colors and typography

The Deriva visual system as currently deployed.

## Source of truth

Two files hold the brand tokens:

- `src/brand/index.ts` — TypeScript constants (`derivaColors`, `derivaType`, `derivaAssets`, `derivaCopy`)
- `app/globals.css` — CSS custom properties for the live site

These should agree. The `globals.css` values are slightly warmer/lighter than the raw brand values; this is intentional for screen rendering. When in doubt, the live site (`derivastudio.cl`) is canonical.

## Light-mode palette

Mood word: **bookish editorial** — limestone paper, oak/espresso ink, oxidized copper, deep-roast green.

| Token | Hex | Role |
|---|---|---|
| `--field-light` | `#f2ebdd` | Outer body gradient (lightest) |
| `--field` | `#e8e2d6` | Outer body (mid) |
| `--field-deep` | `#dcd3c2` | Outer body gradient (darkest) |
| `--paper` | `#f6f1e6` | Card surface |
| `--hairline` | `#dccdb2` | Frame border (subtle) |
| `--copper` | `#c9a57a` | Copper accent — diamonds, corner brackets, rules |
| `--ink` | `#2a2622` | Warm-charcoal text (body, headlines) |
| `--muted` | `#6b5f52` | Secondary text |
| `--label` | `#9a8b7a` | Tertiary label |
| `--green` | `#2e4034` | Forest green — italic accent words |

Email-specific roast brown for signoffs: `#7a3a1f`.

## Dark-mode palette (email)

When clients (Apple Mail, iOS Mail, Gmail) force dark mode, the email palette flips to a *designed* dark theme rather than letting clients auto-invert.

| Light → Dark token | Hex | Role |
|---|---|---|
| paper / field → outer + card | `#1c1814` | Warm-charcoal background (single surface in dark) |
| hairline → dark hairline | `#3a322a` | Subtle frame in dark |
| ink → cream | `#f5ede0` | Body text |
| muted → warm tan | `#b0a08a` | Secondary text |
| green → sage | `#b8d2af` | Hero italic accent + links |
| roast → warm copper | `#e0a37c` | Signoff |

Logo also swaps: `isotipo-verde@2x.png` (light) → `isotipo-sage@2x.png` (dark).

## Typography

| Family | Role | Weights used |
|---|---|---|
| **Cormorant Garamond** | Display headlines, italic accent words | 400 regular, 400 italic, occasionally 300 light |
| **IBM Plex Mono** | Labels, captions, eyebrows, body copy in emails | 400 regular, 500 medium |
| **Poppins** | Body copy in legal page and inline form copy | 400 regular |
| **Crown Avenue** | Brand mark only (not yet used in webapp) | OTF in `public/brand/CrownAvenue-Regular.otf` |

Loaded via `next/font` for the live site; emails reference these by name with sensible fallbacks (`Iowan Old Style`, `Palatino`, `Georgia` for Cormorant; `ui-monospace`, `SFMono-Regular`, `Menlo` for IBM Plex Mono).

### Type scale on the holding page

| Element | Size (desktop) | Style |
|---|---|---|
| Headline top/bottom | `clamp(40px, 4.8vw, 62px)` | Cormorant 400 |
| Headline italic accent | `clamp(46px, 5.6vw, 72px)` | Cormorant 400 italic, green |
| Body intro | 12.5px | Poppins 400 |
| Index meta | 11px | IBM Plex Mono 400, 0.32em letter-spacing |
| Address line | 12px | IBM Plex Mono 400, 0.18em letter-spacing |

### Type scale on the apertura email

| Element | Size | Style |
|---|---|---|
| Wordmark `ÐERIVA` | 28px | Cormorant 400, 0.06em letter-spacing |
| Eyebrow | 10px | IBM Plex Mono 500, 0.42em letter-spacing, caps |
| Hero `18` | 140px | Cormorant 400, -0.02em letter-spacing, green |
| `de mayo` italic | 32px | Cormorant 400 italic |
| Event card label `Cuándo` / `Dónde` | 9px | IBM Plex Mono 500, 0.4em letter-spacing, caps |
| Event card title `Lunes 18.05` | 22px | Cormorant 400 italic, green |
| Body copy | 13px | IBM Plex Mono 400, 1.6 line-height |

## Recurring motifs

- **Copper diamond** (`◆` rotated CSS square, 5–6px) — used as a separator between mono-caps labels
- **Copper corner brackets** — 1.5px L-shapes in the four corners of the holding shell, evoking magazine layout
- **Copper rule** — 1px horizontal line, 28–56px wide, marking transitions between content groups
- **Index meta line** — magazine-style `N° XXX / 2026` numbering tying surfaces together as editorial issues

## Assets in `public/brand/`

| File | Format | Use |
|---|---|---|
| `isotipo-verde.svg` | Vector | Source for all isotipo PNG variants |
| `isotipo-verde@1x.png` (56px) / `@2x` (112) / `@3x` (168) | Raster | Email logo (light mode), Google Search logo |
| `isotipo-sage@1x.png` / `@2x` / `@3x` | Raster | Email logo (dark mode) |
| `logo-con-isotipo.svg` + 1x/2x/3x PNGs | Vector + raster | Full lockup with wordmark below isotipo |
| `wordmark.svg` | Vector | Text-only wordmark |
| `CrownAvenue-Regular.otf` | Font | Brand mark display font |
