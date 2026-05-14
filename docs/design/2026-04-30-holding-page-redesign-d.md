# Holding Page — Redesign D (Warm Gallery Maintenance)

**Status:** Live in production at https://derivastudio.cl
**Date:** 2026-04-30
**Paper file:** `Deriva Studio` → artboards `Redesign D — Warm Gallery Maintenance Desktop` and `Redesign D — Warm Gallery Maintenance Mobile`

---

## Brief

A refined maintenance / coming-soon screen, **not a landing page**. Preserves the central composition of the original 1:1 baseline — centered logo, short status copy, large typographic headline, address/opening meta — while swapping the heavy dark espresso surround for a calm, gallery-quiet surface with more typographic personality.

Iterations explored before D:
- **Redesign A** — Spatial Minimal (with renders)
- **Redesign B** — Central Maintenance (cream-on-cream)
- **Redesign C** — Espresso Gallery (rejected: too much contrast)
- **Redesign D** — Warm Gallery Maintenance ✓ shipped

## Mood

**Gallery** — quiet wall + one warm material accent. Avoids the museum-vault weight of the espresso version while keeping more visual presence than the original baseline.

## Palette

| Role            | Hex       | Notes                                |
|-----------------|-----------|--------------------------------------|
| Outer field (light) | `#F2EBDD` | Top of the radial — limestone wall   |
| Outer field         | `#E8E2D6` | Mid-tone bone, primary surrounding   |
| Outer field (deep)  | `#DCD3C2` | Bottom of radial                     |
| Paper shell         | `#F6F1E6` | Warm cream, the framed page          |
| Hairline            | `#DCCDB2` | Inner shell border                   |
| Copper              | `#C9A57A` | Corner brackets, rules, diamonds     |
| Display ink         | `#2A2622` | Warm charcoal — never pure black     |
| Body / meta         | `#6B5F52` | Oak shadow                           |
| Label muted         | `#9A8B7A` |                                      |
| Accent green        | `#2E4034` | Used **once**, on the italic *calibrando* |

Pairing principle: only ~7% luminance gap between field and shell, so the page reads as "paper on a wall" rather than "page in a vault." The single accent moment is the green-italic word.

## Typography

- **Display:** Cormorant Garamond — 300/400 + Italic
- **Mono:** IBM Plex Mono — 400/500
- Loaded via `next/font/google` in `app/layout.tsx` and exposed as `--font-display` / `--font-mono` CSS variables.

### Headline

Three-line vertical block, all centered:

| Line          | Weight        | Size (desktop / mobile) | Color       |
|---------------|---------------|-------------------------|-------------|
| `Estamos`     | 400 Regular   | 78px / 38–44px          | `--ink`     |
| `calibrando`  | 400 **Italic** | 94px / 46–54px          | `--green`   |
| `los molinos.`| 300 Light     | 78px / 38–44px          | `--ink`     |

The accent line is intentionally larger than its neighbors — three accent moves (italic + weight shift + color shift) on one word.

### Small caps

All small-caps elements share IBM Plex Mono with letter-spacing scaled by role:

- Index meta: `0.32em`
- Object lane (Café · Mate · Cocina): `0.42em`
- Address line: `0.18em`
- Outer captions: `0.22em`

## Structure

```
.holding-page                               (radial bone field)
├── .outer-caption                          (top: name | ◆ status | locality)
├── .holding-shell                          (cream paper, flex 1, fills viewport)
│   ├── .shell-hairline                     (inner 14px border, hairline tan)
│   ├── .shell-corner × 4                   (1.5px copper L-brackets)
│   └── .shell-inner
│       ├── .brand-lockup                   (Deriva isotipo + wordmark SVG)
│       ├── .index-meta                     (N° 001 / 2026 ◆ Mantenimiento de apertura)
│       ├── .copper-rule--headline          (64px copper hairline)
│       ├── .headline                       (three-line typographic block)
│       ├── .object-lane                    (Café ◆ Mate ◆ Cocina)
│       ├── .copper-rule--lane              (32px copper hairline)
│       └── .address-line                   (Magnere 1570 Local 105 — Providencia, Santiago — Abrimos pronto)
└── .outer-caption--bottom                  (Mantenimiento | ◆ 2026)
```

## Copy (canonical)

- Status: `En calibración`
- Index: `N° 001 / 2026 ◆ Mantenimiento de apertura`
- Headline: `Estamos calibrando los molinos.`
- Object lane: `Café · Mate · Cocina`
- Address: `Magnere 1570 Local 105 · Providencia, Santiago`
- CTA: `Abrimos pronto`

## Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Default (≥901px) | Shell `min(100%, 1280px)`, padding `clamp(48px, 6vh, 96px) clamp(28px, 6vw, 96px)`, address renders as a single horizontal line with copper hairline separators. |
| ≤900px (tablet) | Tightened paddings; object lane / address gaps reduced. |
| ≤600px (mobile) | Shell becomes `flex: 1` and fills viewport between top and bottom captions. The middle "En calibración" outer caption is hidden to keep the row clean. Address stacks into three centered lines, with copper rules flanking *Abrimos pronto* via `::before`/`::after`. |
| ≤380px (small mobile) | Headline scales to 34/42/34, paddings reduced again. |

## Source files

- `app/page.tsx` — DOM
- `app/globals.css` — full visual system (palette, type, layout, breakpoints)
- `app/layout.tsx` — Google Fonts (`Cormorant_Garamond`, `IBM_Plex_Mono`) wired into `--font-display` / `--font-mono`
- `src/brand/index.ts` — palette tokens, type tokens, copy, asset paths
- `public/brand/logo-con-isotipo.svg` — the lockup rendered in the shell

## Decisions worth remembering

1. **Contrast was a luminance-gap problem, not a color problem.** Going from a near-black brown surround to a soft bone (`#E8E2D6`) cut the field/shell gap from ~85% to ~7% — that single move is what made the page calm.
2. **Restraint everywhere makes one accent loud.** The green-italic *calibrando* lands because nothing else in the page competes for attention.
3. **Bordered strips read as architecture; floated images read as marketing.** The earlier "render strip" idea was dropped in favor of a typographic-only object lane bordered by copper hairlines.
4. **The shell stretches; the content centers.** On both desktop and mobile, `.holding-shell` uses `flex: 1` with `justify-content: center` so the cream card is the dominant visual mass while the typographic block stays optically centered.
