# Menú Ejecutivo Carta Alignment Design

## Objective

Make the permanent `/menu-ejecutivo` SEO landing page feel like a focused chapter of the existing `/menu` Carta rather than a separate visual product.

## Approved direction

Reuse the Carta's existing visual classes and design tokens directly where practical. Keep `/menu-ejecutivo` Spanish-only and fixed in the Carta's dark “Noche” register; do not add the Carta language selector or Día/Noche toggle.

## Visual contract

- Use the Carta's dark ground, panels, copper accent, hairlines and ink colors.
- Use the Carta display, mono and tracked font stacks.
- Present the landing introduction with the Carta masthead hierarchy: editorial italic display title, restrained mono metadata and seasonal/service note.
- Render the live edition with the Carta's existing Menú Ejecutivo insert vocabulary: numbered course rows, section rules, fixed-price treatment and API-provided values.
- Keep a focused landing-page composition around those reused primitives; do not reproduce the complete Carta navigation or every Carta control.
- Preserve accessible touch targets, visible keyboard focus and responsive wrapping at 320–430px widths.

## Content and navigation contract

- Keep the permanent route `/menu-ejecutivo`, canonical metadata and linked structured data.
- Keep the stable service statement `Lunes a viernes · 13:00–16:00`.
- Continue rendering the current date, price and four courses only from the public Menú Ejecutivo API.
- Preserve the safe no-edition fallback without inventing price, date or dishes.
- Rename the primary action from `Ver la carta completa` to `Ver el menú`; it continues to link to `/menu`.
- Keep `Cómo llegar` as the secondary Maps action.

## Non-goals

- No change to `/menu`, its language controls, theme toggle, menu data or navigation.
- No new menu route and no duplicated full Carta.
- No backend, Google Business Profile or deployment mutation.
- No change to SEO targeting or dynamic menu contracts beyond the CTA wording.

## Verification

- Add a regression contract that proves the page consumes Carta styling and uses the approved CTA label/route.
- Run the full SEO test suite, typecheck and production build.
- Render `/menu-ejecutivo` beside `/menu` at 1440×900 and 390×844, plus compact-width checks, to verify typography, palette, course treatment and clipping.
- Refresh the two Menú Ejecutivo Paper approval artboards to match the implemented Carta styling, then run specification and quality reviews.
