# "Recomendados de la barra" — first-visitor photo grid on /menu

Status: founder picked **Paper alt B** on 2026-10-05 (`Menu · Carta` page, artboards "Alt B · Recomendados de la barra · Mobile 390 / Desktop 1440"): an all-photo grid. Supersedes the 2026-09-28 numbered-index version (A).
Frontend built and shipping dark; **needs one backend field** before it shows.

## Goal

Help a first-time visitor choose confidently without flattening the carta. Four
routes maximum, after the masthead and before the section chips. Each route links
to the real item in the carta below — never a cart action.

## Backend contract (to add to `GET /public/menu`)

```yaml
PublicMenuView:
  properties:
    start_here:
      type: array
      maxItems: 4
      description: >
        Ordered first-visitor routes for the resolved schedule + locale.
        Omit or send [] to hide the module.
      items:
        $ref: '#/components/schemas/PublicMenuStartHereRoute'

PublicMenuStartHereRoute:
  type: object
  required: [id, intent_label, reason, item_id, section_id]
  properties:
    id:           { type: string, description: Stable route key, e.g. "primer-cafe" }
    intent_label: { type: string, description: 'Localized. e.g. "Tu primer café de autor"' }
    reason:       { type: string, description: 'Localized one-liner. Must NOT repeat item.description.' }
    item_id:      { type: string, description: Canonical item; must exist in this payload's sections }
    section_id:   { type: string }
    status:       { type: string, enum: [available, later, unavailable] }
    status_label: { type: string, description: 'Localized, ONLY for exceptions, e.g. "Hasta las 12:00", "Desde las 17:00". Omit for plain availability (no "Disponible").' }
```

Rules the backend owns (the frontend does NOT re-derive them):

- **Membership + order** per schedule (weekday / weekend). A route whose item is
  excluded from the resolved schedule must be dropped server-side (the frontend
  also drops any route whose `item_id` isn't in the payload, as a safety net).
- **Time windows** → `status: later` + `status_label` (from the section's service window).
- **All copy localized** for `es-CL`, `en`, `pt-BR` via `?locale`.
- **Every featured item must have `image_url`** (founder rule: everything has images). The frontend drops a route whose item has no photo.
- **Prices are never on the route** — the frontend reads `price_clp` / `price_label` from the item.

## Frontend behaviour (built)

- `app/(landing)/menu/_components/start-here.ts` — `resolveStartHere()` joins routes
  to items, caps at 4, drops routes whose item has no `image_url`, and links to
  `#item-{id}`. No numerals in B. `item.available === false` overrides the route status → sold-out
  row (still a link, dimmed, localized "Agotado hoy"; the stale route label is dropped).
- The draft type `PublicMenuStartHereRoute` lives there until `npm run api:types`
  generates it — then delete the local type.
- Only the header/footer text is frontend-owned (`START_HERE_COPY`, es/en/pt-BR).
- Every item rendering (row, photo card, autor card) carries `id="item-{id}"`.
- Tests: `tests/menu/start-here.test.ts` against `tests/menu/fixtures/public-menu-start-here.es-CL.draft.json`.

## Approved route copy (weekend, es-CL)

| # | intent_label | item_id | reason | status_label |
|---|---|---|---|---|
| 1 | Tu primer café de autor | decaf-filter (Espresso Tropical) | Frío y frutal: la puerta más amable a la barra. | — |
| 2 | Para quedarte la mañana | brunch | Para una mesa larga y una mañana sin reloj. | Hasta las 12:00 |
| 3 | Algo dulce para la mesa | pie-frambuesa | El dulce que acompaña cualquier taza de la carta. | — |
| 4 | Al caer la tarde | once-deriva | La once chilena, a nuestra manera. | Desde las 17:00 |

Header (frontend chrome): "Recomendados de la barra" / "Cambian con cada servicio." —
en "Recommended by the bar" / "They change with every service." — pt-BR "Recomendados da barra" / "Mudam a cada serviço."

en: Your first signature coffee / To stay the whole morning / Something sweet for the table / As the afternoon falls —
"Cold and fruity: the gentlest way into the bar." / "For a long table and a morning without a clock." /
"The sweet that pairs with any cup on the menu." / "The Chilean once, our way." — status labels: Until 12:00 / From 17:00.

pt-BR: Seu primeiro café autoral / Para ficar a manhã toda / Algo doce para a mesa / Ao cair da tarde —
"Gelado e frutado: a porta mais gentil para a barra." / "Para uma mesa longa e uma manhã sem relógio." /
"O doce que acompanha qualquer xícara do cardápio." / "A once chilena, do nosso jeito." — status labels: Até 12:00 / A partir das 17:00.

## Open data issues

- **Photos needed before launch:** `brunch` and `once-deriva` have no `image_url`, so today only 2 of 4 cards would render. A brunch photo exists (`09_marketing/photography/brunch.JPG`); there is no product shot of the Once Deriva (only a room/people photo) — needs a shoot.

- `pie-frambuesa.image_url` points to `item-pie-limon.jpg` (lemon meringue photo). Fix before launch.
- No mate item exists in `/public/menu`, so no route covers mate yet.
- Weekday route set not yet chosen (could include a Menu Ejecutivo route).
