# Restore "Desayuno campesino" promo to `/abierto`

**Date:** 2026-06-06
**Surface:** `app/(landing)/abierto/` — vertical bar-TV signage (1080×1920)
**Type:** Restoration of a previously-shipped view (added `481e9c2`, removed `f6d6e19`)

## Problem

The `/abierto` rotation lost its breakfast slot. The CSS header still documents a
four-view plan (`Abierto · Ejecutivo · Promo Desayuno campesino · La barra`), but the
"simplified time-gated rotation" (`f6d6e19`) dropped the `AbiertoPromo` component, its
`.ab-promo` CSS, and its gating. Today (Sat morning) the page shows only the Abierto
splash, with no breakfast promo.

## Decisions

- **Window:** mornings every day — `open → 13:00`. Reads as a true breakfast slot and
  fixes the weekend-morning gap; hands off to lunch (Ejecutivo) / evening (Noche) at midday.
- **Copy:** live edition mark eyebrow (`— Hoy · {Weekday} {day} · {Roman} —`, same as the
  splash) instead of the stale hand-typed `— Esta semana · Mayo —`. Price unchanged: `$ 14.500`.

## Implementation

### 1. `AbiertoPromo` component (`page.tsx`)
Restore from `f6d6e19^` with one change: eyebrow text = `getDayLabels(now).eyebrow`
instead of the literal May string. Hero img = `media.derivastudio.cl/promos/desayuno-campesino.jpg`
(CDN, confirmed HTTP 200). Reuses `.ab-stage` skeleton + masthead + colophon.

### 2. CSS (`abierto.css`)
Restore the `.ab-stage--promo` / `.ab-promo__*` block (~75 lines). **Skip** the
`.ab-stage--bar` variant rules — the bar view is not being restored. Single green moment
stays on `.ab-promo__price-amount`. Update the rotator header comment to the real current set.

### 3. Gating — refactor rotator to additive composition
Replace the early-`return` if/else with a views array so campesino can co-exist with
Ejecutivo in the morning:

```ts
const showCampesino = isOpenNow(now) && santiagoHour < 13;          // NEW
const showEjecutivo = isMenuEjecutivoDay(now) && santiagoHour < 16; // unchanged
const showNoche     = santiagoHour >= 16 && isOpenNow(now);         // unchanged

const views = [{ key: "abierto", node: <AbiertoDisplay/>, hold: 20 }];
if (showCampesino) views.push({ key: "promo",     node: <AbiertoPromo/>,     hold: 30 });
if (showEjecutivo) views.push({ key: "ejecutivo", node: <AbiertoEjecutivo/>, hold: 30 });
if (showNoche)     views.push({ key: "noche",     node: <AbiertoNoche/>,     hold: 45 });
```

Timeline:

| Slot | Wk 08–13 | Wk 13–16 | Wk 16–close | Sat 10–13 | Sat 13–16 | Sat 16–close | Sun |
|---|---|---|---|---|---|---|---|
| Views | Abierto + Campesino + Ejecutivo | Abierto + Ejecutivo | Abierto + Noche | Abierto + Campesino | Abierto solo | Abierto + Noche | Abierto solo |

`showCampesino` (<13) overlaps only the Ejecutivo morning; never collides with Noche (≥16).

### 4. QA hook
Add `?view=promo` → `<AbiertoPromo/>` to the preview switch.

## Out of scope
- No in-splash campesino strip.
- No bar/cervezas view restoration.
- No new Paper artboard (1:1 restoration of shipped artboard 9HL-0; only dynamic eyebrow delta).

## Verification
- `npm run typecheck` clean.
- `?view=promo` renders the panel solid.
- `?view=` unset on a weekday morning → 3 views; Sat morning → Abierto + Campesino; Sat 16:00+ → Abierto + Noche (no campesino).
- Deploy gated on explicit user approval (paper-first rule).
