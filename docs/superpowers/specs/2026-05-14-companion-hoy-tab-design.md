# /hoy — Companion Daily Edition

**Status:** design (Paper mockups complete, not yet implemented)
**Owner:** Javier Soto
**Date:** 2026-05-14
**Paper artboards:** `Companion · /hoy (Daily Edition) — Mobile` (4P9-0), `Companion · /hoy (Daily Edition) — Desktop` (4RP-0)

---

## Why

The companion app currently opens onto `/carta` — a menu list. Useful, but it answers *"what can I order?"* rather than *"what's going on at Deriva right now?"* A second surface — `/hoy` — exists to answer the second question: who's behind the bar, what's brewing, what's the day's coffee, what's the room's current state, and what's the editorial line of the day.

`/hoy` is also the first chance to bring the chapbook/broadside editorial system — already established in print (Vol. 001 placemat) and email (Carta de Apertura) — into the live app surface. It deepens the *"single publication across surfaces"* property defined in [[feedback_editorial_design_language]].

This is a customer-facing companion tab, not a feed, not a dashboard, not gamified. It reads as **today's edition**.

## Concept

A scrollable broadside. Edition masthead at the top with Vol/№/date. Five `§` sections separated by hairline rules — no card boxes — each module typographically restrained. One green moment per surface, on a brand-claim word inside the §04 frase de la casa. The page changes daily: edition number = day-of-year, content driven by backend state.

## Information architecture

### Tab placement

Add `/hoy` as the **first** companion tab and make it the new authenticated default landing route. Order becomes:

```
HOY · CARTA · CÓDIGO · CARTERA · ESTUDIO
```

Five tabs fit the existing `PersistentTabBar` width with the current label scale (10px Poppins SemiBold tracked uppercase). No layout change to `PersistentTabBar` required.

**Routing:**
- `/inicio` (splash + RedirectIfAuthed) → authed users now redirect to `/hoy` instead of `/carta`
- `/carta` remains accessible directly via tab tap and from `/hoy` links
- `/codigo`, `/cartera`, `/estudio` unchanged

## Modules

Mobile vertical order, top-to-bottom. Desktop reorganizes the same content into a broadside two-column body — same data, no new modules.

### Edition Mast
- `VOL. NNN · № DDD` (mono, uppercase, tracked) — left
- `DDD MES` (mono, uppercase, tracked) — right
- Italic display title — `La edición / del día.` (mobile) or `Otoño · Apertura.` (desktop, with the season italic and Apertura roman, mirroring the placemat hierarchy)
- Hairline rule below
- **Data:** `season_label`, `edition_number` (computed: day of year), `date_label` (localized)

### §01 — Hoy en barra
The day's featured coffee — what we want a member to taste today. Lead is the method + origin in display italic; metadata below states farm/process and tasting notes; price in mono on the right.
- **Data:** `featured_drink: { method, origin, farm, process, tasting_notes_short, volume_ml, price_clp }`
- **Fallback:** if no featured drink set for the day, fall back to the daily filtrado method default; if no daily filtrado, show "Hoy: espresso de la casa" using house espresso defaults from the catalog.

### §02 — Detrás de la barra (Quien atiende)
Who's working the bar right now. Single line — initial in a brown-900 circle, "Hoy te atiende [Name]." with italic display on the name. Subline in italic small serif: "hasta las HH:MM · [role]".
- **Data:** `current_barista: { display_name, initial, role_label, until_time }`
- **Fallback:** if staff shift schedule not wired, omit the section entirely on mobile (do not show empty state); on desktop, replace right-column slot with `§05` brought up earlier.

### §03 — Ronda en curso
What is currently being brewed. Method/temp/grind on the lead; three mono columns below: `GRANO`, `TIEMPO`, `QUEDAN`. Small `act. HH:MM` timestamp in mono on the right of the label row.
- **Data:** `current_brew: { method, water_temp_c, grind_label, grano_short, time_label, batch_size_g, cups_remaining_estimate, last_updated_at }`
- **Fallback:** if no live brew telemetry (likely at launch — staff must update manually), show "Brewing batch info disponible cuando la barra está activa." in italic muted serif, no mono columns. Section can be hidden entirely if `current_brew` is null.

### §04 — La frase de la casa
The editorial line of the edition. Rotating display-italic phrase. **Single green moment** lives here, on the brand-claim word. Mobile shows 4 lines stacked; desktop shows it as the closing broadside line, full-width with a small "Carta viva — Escanea tu código de socio para sumar la ronda." caption on the right.
- **Data:** `house_phrase: { lead_lines: [string], closing_word, closing_word_color: 'green' | 'ink' }`
- **Fallback:** house phrase library has ≥10 phrases; deterministically pick by edition number so the same day always shows the same phrase.

### §05 — Estado del local
Open/closed pill, next state change in italic, hours range in mono, address.
- **Data:** `local_state: { is_open, next_change_label, hours_range_label, address }`
- **Fallback:** derive from a static hours table client-side if backend doesn't expose it.

### Colophon footer
Three-up mono row: address · hours · derivastudio.cl · @derivacoffeestudio. Mirrors the placemat colophon.

## Voice rules (this surface)

Per [[feedback_voice_surface_scoped]] and [[project_inicio_redesign]]:
- `Deriva` may appear as a **noun** in §04 (e.g., "a la Deriva"). `/hoy` is event-surface adjacent; it can use "Deriva" without the as-state restriction `/inicio` enforces.
- `ronda` not `tanda`.
- One green moment per surface — lands on `Deriva.` in §04. Do not introduce a second green word anywhere else on `/hoy`.
- Mono numerals everywhere: prices, weights, times, temperatures, batch sizes, edition number, timestamps.

## Backend contract

New endpoint required:

```
GET /me/today?locale=es-CL|en
```

Response shape:

```jsonc
{
  "edition": {
    "volume": "001",
    "number": 134,
    "date_label": "Miércoles 14 May",
    "season_label": "Otoño · Apertura"
  },
  "featured_drink": {
    "method": "Filtrado",
    "origin": "Huehuetenango",
    "farm": "La Esperanza",
    "process": "Lavado",
    "tasting_notes_short": "Caramelo, mandarina, final corto de cacao.",
    "volume_ml": 300,
    "price_clp": 3800
  },
  "current_barista": {
    "display_name": "Martina",
    "initial": "M",
    "role_label": "barista de la casa",
    "until_time": "14:00"
  },
  "current_brew": {
    "method": "V60",
    "water_temp_c": 92,
    "grind_label": "media-fina",
    "grano_short": "Huehue · Lavado",
    "time_label": "3:10",
    "batch_size_g": 250,
    "cups_remaining_estimate": 4,
    "last_updated_at": "2026-05-14T11:42:00-04:00"
  },
  "house_phrase": {
    "lead_lines": ["Una ronda a la vez,", "sin apuro — y la", "siguiente, cuando", "la pidas,"],
    "closing_word": "a la Deriva.",
    "closing_word_color": "green"
  },
  "local_state": {
    "is_open": true,
    "next_change_label": "cierra a las 21:00",
    "hours_range_label": "08–21",
    "address": "Magnere 1570 · Local 105 · Providencia"
  }
}
```

Locale rule: backend owns all human-facing strings (`date_label`, `season_label`, `method`, `process`, `tasting_notes_short`, `role_label`, `next_change_label`, `address`). Frontend renders verbatim. Mirrors the existing `/menu?locale=` pattern.

Cache: `s-maxage=60` so the day's content is near-real-time without hammering the backend. `current_brew` can be staler — staff updates it manually via an admin endpoint (out of scope for this spec).

## Component plan

New files under `app/(companion)/hoy/`:
- `page.tsx` — server component, prefetches `/me/today`
- `layout.tsx` — minimal metadata + main wrapper
- `_components/EditionMast.tsx` — masthead block
- `_components/HoyEnBarra.tsx` — §01
- `_components/QuienAtiende.tsx` — §02
- `_components/RondaEnCurso.tsx` — §03
- `_components/FraseDeLaCasa.tsx` — §04
- `_components/EstadoLocal.tsx` — §05
- `_components/Colophon.tsx` — footer (shared with future surfaces if useful)

Hairline rules render as a shared `<HairlineRule />` already implicit in the placemat; could promote to `src/ui/Hairline.tsx` (1px `#E3D9C3` div, full-width inside its padding).

Routing change in `src/auth/RedirectIfAuthed.tsx` (or wherever the post-auth target is set) — flip from `/carta` to `/hoy`.

Tab bar update: `src/ui/PersistentTabBar.tsx` — add `HOY` as the first item.

## Empty / error states

- **Network failure** on `/me/today`: fall through to a degraded surface — Edition Mast with date only, §05 derived from static hours table, §04 with a default phrase. No "error" UI.
- **First load on a day with no editorial content yet** (e.g., bug or staff hasn't updated): show the static fallback editorial line + the static hours; hide §01/§02/§03 entirely. Members should never see "empty" cards.
- **Loading**: skeleton uses italic plaster-shimmer on the masthead title only; everything else renders progressively as the JSON arrives. Avoid full-page spinners.

## Out of scope (explicit non-goals)

- No "What's on rotation" carousel — single featured drink per day, no multi-item swipe.
- No reward/streak module — that's `/cartera`'s job. Do not duplicate.
- No order/buy CTA — `/hoy` is editorial, not transactional. To order, you walk in.
- No notifications/badges — `/hoy` reflects state but doesn't push it.
- No staff/admin write surfaces — admin will set featured drink, current barista, and current brew via a separate admin endpoint, designed in a follow-up spec.
- No personalization beyond locale — every member sees the same edition.

## Risks / open questions

1. **Staff update overhead.** §02/§03 require staff to update barista + brew state. If they don't update, sections silently hide (fallback handles it), but the surface loses freshness. Mitigation: a one-tap staff update from a tablet at the bar (separate spec).
2. **Frase de la casa library.** Need ≥10 phrases at launch. Editorial owner: founder. Each phrase should be rule-checked: italic-friendly Cormorant, fits the four-line mobile layout, has a clear last word for the green moment.
3. **`current_brew` accuracy.** Saying "≈ 4 tazas" creates an expectation. Staff must update or hide. Worth treating `cups_remaining_estimate` as optional and hiding when null rather than guessing.
4. **Tab bar width on small phones.** Five labels fit on 390px but might be tight on 360px-class devices. Test on a 360px viewport before shipping; if cramped, abbreviate `CARTERA` → `CART.` or drop tab labels in favor of icons + label-on-active.

## Pre-implementation gate

Per [[feedback_paper_first_workflow]]: both mobile and desktop artboards are mocked and verified in Paper. No code may ship before user approval of these mocks.

## Next step

User review of this spec; on approval, `writing-plans` skill creates the implementation plan.
