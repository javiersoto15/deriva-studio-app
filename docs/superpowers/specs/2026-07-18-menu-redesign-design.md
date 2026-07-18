# /menu Redesign — Design Spec

**Date:** 2026-07-18
**Surface:** Public web menu — `derivastudio.cl/menu` (landing group, SSR)
**Status:** Exploration approved; Paper mocks in progress

## Goal

Refactor and redesign the public `/menu` page to (a) surface the full richness of
the backend `PublicMenuView` payload (currently ~40% rendered), and (b) explore
three distinct visual directions — with imagery treated as the variable — so the
founder can pick a direction before we build the winner as the real `/menu`.

## Non-negotiable constraints (preserved in every direction)

- **Backend `GET /public/menu` is the only data source.** No `src/data/menu.ts` for
  the public page. Render verbatim; never translate backend copy.
- **Price-reveal gate** and **JSON-LD / SEO** behavior preserved.
- **All schedule states**: weekday / weekend / Sunday-closed / Menu Ejecutivo
  (weekday only). Backend resolves schedule; frontend renders.
- **Brand system**: plaster × ink palette, single green moment (`#00311F` once),
  Cormorant Garamond italic display, Poppins tracked-uppercase labels, IBM Plex
  Mono numerals/prices, § section marks, edition mast. No gradients — flat grounds.
  Deriva-as-noun in menu context (not /inicio's Deriva-as-state).

## The refactor (shared render layer)

All three directions are **skins** over one backend-driven render layer:
`fetcher → typed PublicMenuView → primitives (Chapter, Subgroup, ItemRow,
AddonChips, EjecutivoInsert)`. Picking a winner = swapping a skin, not a rewrite.

Backend fields to render (mapped from live payload, not the aspirational contract):
`numeral`, `title`, `full_italic`, `emphasis (hero|primary|utility)`, `lede`,
`lede_italic`, `subgroups[].label`, `subgroups[].addons`, `items[].name`,
`item.meta`, `item.price_clp`, `item.tasting_note`, `item.available`, `item.tags`,
section `addons` + `addons_before`, `executive_menu` (price_label, hours, hero,
subline, date_label, courses[].numeral/tag/name).

## Three directions (mobile-first, 390px; winner gets desktop after)

- **A · "El Cuadernillo"** — chapbook evolved, no photos. Oversized cocoa §
  numerals, Cormorant-italic titles, ruled item rows, Plex-Mono prices, tasting
  notes as quiet italic sub-line, ghost-pill addons, Menu Ejecutivo as bordered
  insert. Refs: Leonid Kostetskyi, Alison Roman, Monocle. Lowest risk, most collectible.
- **B · "La Edición Ilustrada"** — atmospheric editorial. Chapter openers carry one
  large atmospheric photo; between openers, type-only rows; one signature dish per
  chapter may get a small framed still-life. Refs: Savor.it, Monte Café, Little Amps.
- **C · "El Mercado" (dark-cinematic)** — image-forward magazine. Flat deep-ink
  ground (no gradient), italic-serif headings, framed dish still-lifes, sticky
  chapter nav. Rhymes with Dark Hours evening register. Refs: Limón, Assembly, Escape.

## Data content

Real weekday carta (Otoño 2026): 11 chapters §00–§10 — Cafetería (hero),
Café para [llevar], Desayunos, Croissants, Bagels, Focaccias, Cocina (hero),
Menu Ejecutivo, Onces, Pastelería, Cervezas/coctelería. Full payload cached for
typesetting. Photography library: ~62 assets in `09_marketing/photography/`.

## Findings to feed back to backend

- Section `title` values for §01/§09/§10 are **truncated** ("Café para",
  "Pastelería y", "Cervezas y"). Render verbatim in mocks; fix backend-side.

## Workflow

Research (done) → 3 Paper mobile mocks → founder picks → desktop mock of winner →
build winner as real `/menu` on the shared render layer → typecheck/build →
Paper-first approval → deploy. Paper file: `Web` page (per file-organization memory).
