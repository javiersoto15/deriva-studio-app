# /abierto — Main Slide Reshape (Café de Autor)

**Date:** 2026-07-13
**Branch:** design/staff-apparel
**Surface:** `derivastudio.cl/abierto` — the 1080×1920 vertical bar-TV signage, **main splash slide only** (`AbiertoDisplay` in `app/(landing)/abierto/page.tsx`).
**Status:** Approved design — pending Paper mock + implementation plan.

## Problem

The Abierto splash is materially behind the real menu. Its featured coffee content is read
from **static `src/data/menu.ts`**, which has not been touched since June and knows only the
7 classic espresso drinks. Meanwhile the menu has moved:

- A new **Café de Autor** signature line was added to the Cafetería and is already live on the
  backend (`/public/menu`): **Espresso Tropical** ($4.990), **Tierra & Hierbas** ($5.090),
  **Pre-Infusion** ($8.290). Source: `12_menu/sumup_2026-07-13_cafe_de_autor_three_items_delta_only.csv`.
- New food (**Bagel Churrasco Italiano**, **Bagel Luco**) and drinks (**Mate**, **Chai Latte**,
  **Macchiato**) also landed (Jul 3 delta).
- `/sala` and the Ejecutivo view already read these live; `/abierto` was never updated.

The slide's three hero medallions (Pour Over / Kasler House / Italiana) are **hardcoded literal
JSX** decoupled from any data source — the primary drift point.

## Goal

Restructure the *featured content* of the main slide so **Café de Autor is the star**, read
**live from the backend** so it never drifts again, while preserving the editorial theme
(masthead, "Abierto." hero word, hours band, Ejecutivo strip, pull quote, colophon, plaster×ink
palette). No other view changes.

## Decisions (locked with founder)

| Decision | Choice |
|---|---|
| Scope | Restructure featured content (keep editorial skeleton) |
| Data source | Live from backend (`getPublicMenuView`) |
| Hero focus | Café de Autor is the star |
| Pre-Infusion (alcoholic) | Type-only, all day (no photo hero, no time gate) |

## Data layer

Reuse `/sala`'s established pattern verbatim — no new backend fields, no invented grouping
(there is **no "Café de Autor" subgroup/tag** in the payload; items resolve by name).

- Fetch once: `getPublicMenuView({ locale: "es-CL" })` (cached, `cacheLife("hours")`,
  `cacheTag("menu","public-menu")`).
- Port `findItemByName(view, regex)` from `app/(landing)/sala/page.tsx` (searches every section +
  subgroup, skips `available === false`). Consider extracting the shared helper if trivial;
  otherwise duplicate (both files are signage).
- **Café de Autor trio** resolved by name:
  - `/espresso\s*tropical/i`
  - `/tierra\s*&?\s*hierbas/i`
  - `/pre.?infusion/i`
- **Price**: live `price_label` → `price_clp` (formatted `es-CL`) → curated fallback.
- **Curated fallbacks** (authoritative, from today's SumUp delta) used at build-time prerender
  and until the backend surfaces each item:

  | Item | Price | Description |
  |---|---|---|
  | Espresso Tropical | $4.990 | Syrup casero de maracuyá con semillas, tónica fría y doble espresso Etiopía. Fresco, cítrico y cafetero. |
  | Tierra & Hierbas | $5.090 | Infusión temprana de café Etiopía molido con rooibos Earl Grey, terminada con pour over. Balanceada, floral y herbal. |
  | Pre-Infusion | $8.290 | Nuestra lectura del espresso martini: vodka infusionado con mate, syrup de mate y espresso de la casa. |

- **Cafetería list (§01)**: resolve the live coffee section (reuse `/sala`'s `COFFEE_RE` +
  emphasis/count ranking), take item names, cap ~7. Fallback to `menu.ts` espresso subgroup when
  the backend is unreachable.
- **Acompaña (§02)**: keep from `menu.ts` (Syrups / Extras / Leches — stable). Noted as the
  fallback path if addons are later exposed live.

## Layout (zone by zone)

Theme anchors unchanged: masthead, hours band, Ejecutivo strip (weekday <16:00), pull quote,
colophon.

| Zone | Before | After |
|---|---|---|
| Hero medallion | Latte · № 01 · DE LA BARRA (`latte`) | **Espresso Tropical · № 01 · CAFÉ DE AUTOR** (`espresso-tropical`, portrait 0.5625, `object-fit: cover`) |
| Hero manifesto | "Café de especialidad, una pausa **sin apuro**, un rato a la deriva." | Rewritten — drops founder-flagged "sin apuro" (see memory `feedback_overused_copy_phrases`) |
| **§ CAFÉ DE AUTOR** (new) | — | Numbered editorial type block (i./ii./iii.) listing all three signatures with description + live price. The star moment. Pre-Infusion appears here as type. |
| Destacados row | 3 medallions: Pour Over / Kasler / Italiana | **2 medallions**: № 02 · FILTRADO **Tierra & Hierbas** (`filtrado`) + № 03 · A LA MESA **Bagel Churrasco Italiano** (`bagel-churrasco`, new item, synced with `/sala`) |
| §01 Cafetería / §02 Acompaña | static | §01 **live** coffee list; §02 Acompaña from `menu.ts` |

Rationale: the slide now surfaces four previously-ignored new items (Tropical, Tierra & Hierbas,
Pre-Infusion, Bagel), and Tierra & Hierbas doubles as both a medallion and a Café de Autor
signature — reinforcing the line.

## Copy

- New hero manifesto line (open state), no "sin apuro"; keep the closed-state line or lightly revise.
- § Café de Autor eyebrow/intro (e.g. "§ Café de autor · lo nuevo de la barra").
- Medallion captions from live data name where possible; kicker labels curated.

## Images

All required photos already on the CDN — **no new photography or uploads**:
`espresso-tropical`, `filtrado`, `bagel-churrasco` (verified in `src/data/photos.ts`).
Pre-Infusion is type-only (no photo). Single green moment reserved for one price/claim per the
brand rule.

## Non-goals / out of scope

- Other views: Promo (Desayuno campesino), Ejecutivo dark view, Noche — untouched.
- The **dead Inauguración takeover** (gate hardcoded to `2026-07-03`, now permanently false) —
  flagged separately for cleanup; not addressed here.
- No backend changes.

## Technical notes

- `?view=abierto|…` QA param and the Suspense/PPR boundary in `AbiertoRotator` are unaffected
  (still resolved inside Suspense).
- New CSS for the § Café de Autor block added to `abierto.css` following existing `.ab-*` naming
  and the plaster×ink token set; portrait `object-fit: cover` for the Tropical medallion.
- `npm run typecheck` clean before and after.

## Workflow gate

Per `feedback_paper_first_workflow.md`: mock the reshaped slide in **Paper** (1080×1920 artboard
on the Web page; a mobile companion if useful) and obtain explicit visual approval **before** any
`vercel deploy`. No deploy without approval.

## Verification

- Typecheck clean.
- Render `/abierto?view=abierto` locally and confirm: Café de Autor block populated (live +
  fallback), Tropical hero photo, two medallions, live Cafetería list, no stale hardcoded items.
- Confirm build-time prerender (backend unreachable) falls back cleanly to curated content.
