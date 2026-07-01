# Deriva · Edición Inauguración — 100g Gift Bag Sticker

**Date:** 2026-07-01
**Status:** Approved (brainstorming), pending Paper build + founder export approval
**Related:** [[project_coffee_bag_label_system]] (retail 9×13 set), [[project_official_inauguration_july3]] (event), [[reference_paper_print_pdf_trazado]] (print pipeline), [[feedback_editorial_design_language]], [[feedback_no_own_roast_claim]], [[feedback_paper_first_workflow]]

## Purpose

A **giveaway coffee bag** handed to first visitors at the **official inauguration (Fri 3 Jul 2026)**. It is the inauguration-edition sibling of the retail café-en-grano bag stickers, adapted for a small **100g** kraft pouch. Unlike the retail set (one sticker per origin), this is a **single universal sticker**: the barista marks which bean and which grind at handoff.

## Locked decisions

| Decision | Choice |
|---|---|
| Structure | **One universal gift sticker** (not 3 per-origin). Barista checkboxes select grano + molienda. |
| Hero focus | **Deriva / inauguration** is the hero; the three beans are a descriptive checkbox row. |
| Size | **7×10cm portrait** (0.70 ratio, scaled from the retail 9×13). Trim `746×1067px` @ 106.67px/cm. |
| Legal | **Minimal / no legal ledger.** Keep only net weight `100 g ℮` + roast/best-by stamp zone. No Res. Sanitaria block. |
| Edition line | `Inauguración oficial · 3 Jul 2026` (founder rejected "La primera noche de Deriva" as a headline). |
| Shop note | Factual: `Café de especialidad / Magnere 1570, Providencia / derivastudio.cl`. |

## Design direction

Same editorial type-poster language as the retail bags — plaster ground `#F2ECE0`, ink `#281E14`, **single green moment = the isotipo `#00311F`** (hero word stays ink). Must read as the same publication as the shelf set (the gift/keepsake issue of it). Type system: Cormorant Garamond italic for display hero, Poppins SemiBold tracked-uppercase for labels/§ marks, IBM Plex Mono for technical fields (weight, dates, QR caption). No gradients ([[feedback_no_gradient_backgrounds]]). No "tueste propio" claim ([[feedback_no_own_roast_claim]]) — "café de especialidad".

## Layout (top → bottom)

1. **Masthead** — green isotipo (canonical `public/brand/isotipo-verde.svg` paths, not the infographic mark) + `ĐERIVA` / `Coffee Studio` lockup. Edition rule beneath: `EDICIÓN INAUGURACIÓN · № ___` (№ optional/blank).
2. **Hero** — `Edición` / *Inauguración.* (Cormorant Garamond italic, ink, large) + subline `Inauguración oficial · 3 Jul 2026`.
3. **§ La casa** — factual shop note: `Café de especialidad · Magnere 1570, Providencia · derivastudio.cl`.
4. **§ Grano** — 3 open checkboxes, each with a one-line descriptor (describes the beans):
   - `☐ Etiopía — floral, té negro`
   - `☐ House Blend — chocolate, pan tostado`
   - `☐ Chiapas — decaf, canela`
   Barista checks the bean this bag holds.
5. **§ Molienda** — open checkboxes + brew labels: `Grano (sin marca)` · `Espresso` · `Moka · AeroPress` · `V60 · Chemex · Goteo` · `Prensa francesa`. Caption: *"marca una · sin marca = en grano"*.
6. **Stamp zone** — dashed pen blanks `Tostado ____` / `Consumir antes de ____` + `100 g ℮`.
7. **Footer** — verified `derivastudio.cl` QR (reused from retail set, ≤~7KB base64, composited from source so it scans) + `@deriva.coffee.studio` + one-line address.

## Print production

- Build in Paper file "Deriva Studio", **Print & Collateral page** (open the page before `create_artboard`). Clone from the retail Etiopía label / House Blend keepsake as the nearest base, then restructure to universal + 7×10.
- Trim artboard `746×1067px`. Press artboard = trim duplicated onto plaster-bleed at **7.6×10.6cm** (`+3mm` each side ≈ `+32px` padding), radius/shadow stripped, magenta (100% M) rounded-rect die-line overlay.
- **Do NOT use Paper's native PDF export.** Follow [[reference_paper_print_pdf_trazado]]: export SVG → puppeteer render (await `document.fonts.ready`) → isotipo squash fix → `gs -dNoOutputFonts -dPDFFitPage` to **215.433 × 300.472 pt** (7.6×10.6cm bleed) → composite verified QR (`09_marketing/qr/deriva-landing-qr-brown-isotipo.png`) → verify `pdffonts`=0, page size, QR scannable (zbar/cv2).
- Trim reference: 7×10cm = `198.425 × 283.465 pt`.
- Output: `09_marketing/stickers/coffee-bag/deriva-bag-inauguracion-7x10-bleed-TRAZADO.pdf` (+ trim PNG). Output stays RGB — confirm CMYK profile with printer before press.

## Out of scope

- No per-origin variants (this is the single universal edition).
- No legal/RSA ledger.
- No changes to the retail 9×13 set or the keepsake cards.

## Open items for founder

- Roast date / best-by stay as pen/stamp blanks by design.
- № edition number left blank unless founder wants one assigned.
- Physical 100g bag/pouch spec (kraft, dimensions) — confirm the sticker fits the actual bag before press.
