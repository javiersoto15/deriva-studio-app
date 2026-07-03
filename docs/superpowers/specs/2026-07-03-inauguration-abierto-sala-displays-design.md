# Inauguration takeover — `/abierto` + `/sala` displays

**Date:** 2026-07-03
**Scope:** Add a one-night inauguration plate to each of the two in-café TV displays. Live only **today (Fri 3 Jul 2026), 16:00–21:00 America/Santiago**, then automatic revert to normal. Existing plate designs are **not modified**.

## Context

Deriva's **official inauguration** ("La primera noche de Deriva") is Fri 3 Jul 2026 from 16:00 — an evening event with café, cocina, selected discounts, and a **sorteo** (prize draw). See `project_official_inauguration_july3` in auto-memory.

Two in-café displays should engage the event, each composed for its own viewport but reading as the same campaign:

- **`/abierto`** — vertical **1080×1920** bar-TV. Fluid, `CrossfadeRotator`, additive time-gated views, 10-min `<meta refresh>`, `?view=` QA hook. (`app/(landing)/abierto/page.tsx` + `abierto.css`)
- **`/sala`** — horizontal **1920×1080** lounge-TV. Fully-fluid `vw` sizing (Fire TV), `CrossfadeRotator`, 4 fixed plates, 10-min soft refresh, `?view=` QA hook. (`app/(landing)/sala/page.tsx` + `sala.css`)

### Founder decisions (2026-07-03)

- **Giveaways showcased:** Café en grano 100 g · Taza Deriva · Termo Deriva · Libreta Deriva.
- **No product photos exist** — the four items are **text "mentions"** (a numbered ledger), not photographed products. Atmospheric photos from the existing CDN slug set (`interior`, `storefront`, `bar`, `pour-over`…) dress the plate.
- **Mechanic:** all four items are **sorteo prizes** (header reads *§ El sorteo*, "entre los presentes de la noche"). Not free-to-first-visitor.
- **Price-free**, matching the inauguration IG post rule. Mention "descuentos seleccionados · sorteo" as text; no figures.

## Approach

**Exclusive takeover during the window. Zero edits to existing views.**

For these 5 hours each display shows **only the inauguration plate** — the entire normal rotation is suppressed. All times are computed in **America/Santiago** (server clock irrelevant):

```ts
// America/Santiago, this single night only
function isInauguracion(now: Date): boolean {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(now); // YYYY-MM-DD
  const hour = santiagoHour(now); // existing helper in both files
  return date === "2026-07-03" && hour >= 16 && hour < 21;
}
```

Each rotator **early-returns a single-view rotator** carrying only the inauguration plate when the gate is true; otherwise it builds its normal set exactly as today. At 21:00 today (or when the date rolls over) the gate is false and both displays revert automatically — no manual step, no redeploy. A single view in `CrossfadeRotator` simply holds (no crossfade), the same path the `?view=` QA hook already uses.

```ts
// e.g. in AbiertoRotator, before the normal additive build:
if (isInauguracion(now)) {
  return <CrossfadeRotator className="ab-rotator"
    views={[{ key: "inauguracion", node: <AbiertoInauguracion /> }]} />;
}
```

**Non-modification guarantee:** existing plate components and CSS classes are left byte-identical — they are simply not rendered during the window. New work is isolated to:
- New components `AbiertoInauguracion` / `SalaInauguracion`.
- New namespaced CSS blocks (`.ab-inaug*` / `.sala-inaug*`).
- One added gate + one early return in each rotator.
- `inauguracion` added to each `?view=` QA switch.

**Rejected alternatives:** (a) *additive* — mixing the plate into the normal rotation; the founder wants nothing but inauguration during the window. (b) A *single shared component* — impossible, the viewports are orthogonal (1080×1920 vs 1920×1080) and need distinct compositions.

## Shared campaign DNA

Both plates carry:
- Cream `LogoLockup` masthead + live edition mark (`getEditionMarkUppercase(now)`).
- Section mark: `§ INAUGURACIÓN OFICIAL · 3 JUL 2026`.
- Headline family: *Salimos de la marcha blanca.* (small Cormorant italic) / **Llega la inauguración.** (display).
- `§ EL SORTEO` — "Entre los presentes de la noche" — 4-row numbered ledger:
  - i. **Café en grano · 100 g** — "Bolsa de origen, molida a tu método."
  - ii. **Taza Deriva** — "Cerámica esmaltada, emblema grabado."
  - iii. **Termo Deriva** — "Para el café de camino."
  - iv. **Libreta Deriva** — "Tapa dura, para tus notas."
- Footer: `DESDE LAS 16:00 · HOY` · `DESCUENTOS SELECCIONADOS · SORTEO` · `@DERIVA.COFFEE.STUDIO` · `MAGNERE 1570 · LOCAL 105`.

**Register:** evening/candlelit — dark plaster×ink (ground `#1A1410`, type `#FAF5EC`). Exactly **one green moment** (`#00311F` family / the plate's `.green`) per plate. Any photo uses a **flat scrim + text-shadow**, never a gradient scrim (`feedback_no_gradient_backgrounds` + inauguration-post rule).

**Voice guards:** Deriva stays a noun; `a la Deriva` wordplay is allowed. `ronda` not `tanda`. Do **not** use "La primera noche de Deriva" as a headline (founder rejected it for the post) — the headline is the marcha-blanca/inauguración pair; "La primera noche" may appear only as a light photo caption.

## Composition — `/abierto` (vertical broadside)

Reuses the `.ab-stage` skeleton register. Top→bottom:

1. Masthead: cream `LogoLockup` + edition mark + mast rule.
2. Eyebrow: `§ Inauguración oficial · Hoy`.
3. Hero type: *Salimos de la marcha blanca.* / **Llega la inauguración.** — **green moment on "inauguración."**
4. Atmospheric photo band — `interior` (fallback `storefront`) via `DerivaImage`, flat scrim, deckle caption "La primera noche · Magnere 1570".
5. `§ El sorteo` — 4-row numbered ledger (roman i–iv, name, one-line descriptor). Cream type.
6. Footer band: `DESDE LAS 16:00 · HOY` + `DESCUENTOS SELECCIONADOS · SORTEO` + socials/address.

**Rotation 16:00–21:00 today:** `[Inauguración]` only — held solid, no crossfade. The Abierto splash, Menu Ejecutivo, promo, and Noche are all suppressed for the window. Outside the window: unchanged normal rotation.

## Composition — `/sala` (horizontal split)

Left type panel / right full-bleed photo, dark register (sits naturally alongside the existing dark `oficio` plate):

- **Left panel:** masthead (cream lockup + edition mark) → eyebrow `§ INAUGURACIÓN OFICIAL · 3 JUL 2026` → hero headline *Salimos de la marcha blanca.* / **Llega la inauguración.** (cream) → `§ El sorteo` numbered ledger (4 items, roman numerals + descriptors) → footer line `DESDE LAS 16:00 · SORTEO · DESCUENTOS SELECCIONADOS`.
- **Right panel:** full-bleed `interior` (fallback `storefront`) at ~1114px via `DerivaImage fill`, flat scrim + text-shadow, green claim caption **"a la Deriva."** (the plate's single **green moment**) + deckle "La primera noche".

**Rotation 16:00–21:00 today:** `[Inauguración]` only — held solid, no crossfade. The portada / oficio / destacado / barra plates are all suppressed for the window. Outside the window: unchanged 4-plate rotation.

> Green-moment split (intentional differentiation): `/abierto` greens the word "inauguración"; `/sala` greens the "a la Deriva." claim. Each plate keeps exactly one green.

## QA / verification

- `/abierto?view=inauguracion` and `/sala?view=inauguracion` render the plate solid at any time of day (add `inauguracion` to each preview switch).
- Time-gate unit reasoning: gate true only for `2026-07-03` hours 16–20 in America/Santiago; false at 15:59, at 21:00, and on 2026-07-04.
- Visual: verify fill/letterbox at the target resolutions (`/abierto` 1080×1920; `/sala` 1280×720 / 1920×1080 / 3840×2160 per `project_sala_display`).
- `npm run typecheck` clean.
- **Refresh latency:** both displays reload every 10 min, so a screen already on at 15:55 flips into the takeover by ≤16:10 and reverts to normal by ≤21:10. Acceptable for an evening event; if an exact 16:00 flip matters, reload the TV manually at 16:00.

## Constraints & workflow

- **Paper-first deploy gate** (`feedback_paper_first_workflow`): mock both plates in Paper (Web page or a signage page) and get explicit founder approval **before** any `vercel deploy --prod`.
- **Graphics via CDN** (`feedback_graphics_via_bucket`): reuse existing registered slugs only; no new committed assets. If a night-specific photo is wanted later, host on the CDN and register a slug — out of scope for v1.
- Clean build before prod deploy (`rm -rf .next && npm run build`).

## Open copy detail (non-blocking)

Sorteo entry mechanic (how attendees enter) is left implicit — "entre los presentes de la noche." If the founder wants an explicit entry step (e.g. "sigue @deriva.coffee.studio", "compra del día"), it's a one-line addition to the ledger footer, not a structural change.
