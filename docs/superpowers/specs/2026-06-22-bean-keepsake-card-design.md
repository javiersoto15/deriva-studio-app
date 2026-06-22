# Bean Keepsake Card — Design Spec

**Date:** 2026-06-22
**Surface:** Print collateral (Paper) — physical take-home card
**Prototype origin:** House Blend (pattern clones to Etiopía Yirgacheffe + México Chiapas decaf)

## Purpose

A loose **keepsake card handed out with each bag of beans** the customer buys. It is
*not* a second bag label — the existing 9×13 cm bag sticker already carries the legal
and technical load (molienda checkboxes, peso, Res. Sanitaria N° 10978, QR). This card's
job is the human companion to the beans: origin pride on the front, and on the back the
thing no spec sheet captures — **how the barra actually experiences the coffee** (the
"§ Nuestro sentir" note).

It must read as the same publication as every other Deriva surface (placemat, bag, app,
email): editorial chapbook system, plaster ground, single green moment, Cormorant italic
display, mono numerals, § section marks.

## Format

- **9 × 5 cm horizontal**, two faces (front + back).
- Built in Paper at **960 × 533 px** (matches the existing 106.7 px/cm of the bag
  system → clean scale to print PDF later).
- Two artboards on the **Print & Collateral** page of the "Deriva Studio" Paper file:
  - `Bean Card · House Blend — Front`
  - `Bean Card · House Blend — Back`

## Front — origin pride

Vertical rhythm, centered content rail:
1. **Masthead** — isotipo (canonical cup-in-arch from `LogoLockup`/`isotipo-verde.svg`)
   + `ĐERIVA · Coffee Studio` + `Vol. 001 · № WW` edition mark. Mono, tracked.
2. Generous void.
3. **Eyebrow** — `— Nicaragua · Colombia · Kenia —`, Poppins/mono tracked uppercase.
4. **Hero** — `House Blend`, Cormorant Garamond Italic, large. The brand-claim word is
   the **single green moment** (`#00311F`); the rest is ink.
5. **Tasting note** — Cormorant Italic, sensory: e.g. "Panela, almendra tostada y final
   corto de cacao." (verify/pull from the live origin data).

## Back — specs + the feel

Two columns split by a vertical hairline:

**Left — `§ Especificaciones`** (objective; reused verbatim from the "Conoce tu Café"
House Blend artboard `5UC-0`, read out of Paper at build time, not invented):
- Variedades — Atuai, Castillo, Caturra, Batian
- Proceso — Lavado & Natural
- Altitud — 1.850 msnm prom.
- Acidez ●●●●○ (4) · Cuerpo ●●●●● (5) — dot meters matching the infographic style

**Right — `§ Nuestro sentir`** (the new subjective voice):
- A short first-person-plural barista note, Cormorant Garamond Italic, warm and sensory —
  distinct in register from the objective tasting note (this is lived impression, a moment,
  not a flavor list).
- Signed **`— la barra`** to mark it as the team's voice, not marketing copy.
- Copy to be **drafted by Claude in Deriva voice, founder approves** before ship.
- Honors voice rules: `ronda` not `tanda`; "Deriva" never a verb; no "tueste propio" claim.

**No QR** — keepsake stays text-pure; the bag sticker already carries the QR.

## Out of scope (v1)

- Print-ready bleed/crop PDF (do after the on-screen design is founder-approved).
- Etiopía + Chiapas variants (clone after House Blend prototype is approved).
- Any webapp/digital rendering — this is print only.

## Workflow / gates

1. Build both artboards in Paper (paper-first gate — `feedback_paper_first_workflow`).
2. Founder reviews + approves the on-screen design.
3. Only then: draft final "Nuestro sentir" copy for approval, clone to other origins,
   and produce print-ready files in `09_marketing/` if requested.

## Honors

- Editorial design language (`feedback_editorial_design_language`)
- Single green moment, Cormorant-italic display, § section marks
- No own-roast claim (`feedback_no_own_roast_claim`)
- Origin data sourced from existing "Conoce tu Café" artboards, not invented
  (`project_coffee_bag_label_system`)
- Paper-first, no deploy/print without explicit approval (`feedback_paper_first_workflow`)
