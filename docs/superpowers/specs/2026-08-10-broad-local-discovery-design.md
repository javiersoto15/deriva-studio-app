# Broad Local Discovery Design

**Date:** 2026-08-10  
**Status:** Approved  
**Market and language:** Providencia and Santiago, Chile; customer-facing copy in Chilean Spanish

## Objective

Expand Deriva Coffee Studio's local discovery beyond specialty coffee without weakening its identity. Specialty coffee remains the core positioning; breakfast, brunch, lunch, Menú Ejecutivo, bakery and onces become additional, accurate reasons to find and visit Deriva.

The target outcome is stronger relevance for searches such as:

- café de especialidad en Providencia
- cafetería en Providencia
- brunch en Providencia
- desayuno en Providencia
- almuerzo en Providencia
- Menú Ejecutivo en Providencia
- Menú Ejecutivo de lunes a viernes
- dónde almorzar en Providencia
- café, brunch y almuerzo en Santiago

## Chosen approach

Use a hub-and-spoke content model.

- The homepage communicates the complete offer in one concise hierarchy.
- `/menu` remains the canonical complete public menu.
- A permanent `/menu-ejecutivo` page explains the weekday offer and displays the currently published daily edition when available.
- Brunch receives a substantial, indexable homepage section or dedicated page only when there is enough distinct content to avoid a thin doorway page.
- Google Business Profile mirrors the same positioning through its description, categories, menu sections, photos and recurring posts.

This is preferred over putting every keyword into one page or relying only on Google Business Profile. It gives each major intent a useful destination while preserving one coherent brand.

## Positioning hierarchy

1. **Core:** cafetería de especialidad en Providencia.
2. **Morning:** desayunos y brunch.
3. **Weekday midday:** Menú Ejecutivo and almuerzo.
4. **All-day support:** bagels, focaccias, pastelería and onces.
5. **Place:** Magnere 1570 Local 105, Providencia, Santiago.

Recommended umbrella sentence:

> Deriva Coffee Studio es una cafetería de especialidad en Providencia con desayunos, brunch, almuerzos y Menú Ejecutivo de lunes a viernes.

## Keyword architecture

Keywords guide useful copy; they are not repeated mechanically and must never be added to the registered business name.

### Specialty coffee

- café de especialidad en Providencia
- cafetería en Santiago
- espresso, V60, Chemex, café filtrado
- café de autor and Coffee Flight

### Breakfast and brunch

- desayuno en Providencia
- brunch en Providencia
- brunch en Santiago
- Brunch Deriva Studio

### Lunch and Menú Ejecutivo

- almuerzo en Providencia
- dónde almorzar en Providencia
- Menú Ejecutivo en Providencia
- Menú Ejecutivo de lunes a viernes
- menú de almuerzo

### Supporting offer

- bagels and focaccias
- pastelería and onces
- café para trabajar or reunirse only where the page accurately describes the space

## Website design

### Homepage

- Retain the existing specialty-coffee hero and add brunch, lunch and Menú Ejecutivo to the supporting copy.
- Add a clear weekday-lunch entry point without making the hero read like a keyword list.
- Add navigation or contextual links to `/menu`, `/menu-ejecutivo`, location and brunch content.
- Continue sourcing all product names, descriptions, prices and availability from the public API.

### Complete menu

- Keep `/menu` as the canonical menu URL.
- Preserve the actual weekday/weekend presentation and public visibility rules.
- Extend metadata and structured data to describe breakfast, brunch, lunch, Menú Ejecutivo, bakery and onces where those sections are public.
- Hidden catalog items must never appear in visible content or structured data.

### Permanent Menú Ejecutivo page

Create `/menu-ejecutivo` as an always-indexable local landing page.

Stable content:

- H1: `Menú Ejecutivo en Providencia`
- Product name: `Menú Ejecutivo`
- Service: Monday to Friday, 13:00–16:00
- Address and directions
- Explanation of the four moments: beverage, starter, main course and dessert
- Link to the complete menu

Dynamic content:

- Today's published date label, price and courses from `/public/menu-ejecutivo?locale=es-CL`
- A calm unavailable state when no daily edition is published
- No invented dishes, prices or availability

SEO and GEO:

- Canonical URL and Spanish metadata
- WebPage, Menu and Offer structured data grounded in the current response
- Link to the local CafeOrCoffeeShop entity
- Stable explanatory copy remains present outside the lunch window so crawlers and AI systems can understand the offer

### Brunch coverage

Begin with a substantial homepage/menu content block around the real `Brunch Deriva Studio` and breakfast selection. Create a dedicated `/brunch-providencia` page only if the available public content supports a genuinely useful page with several dishes, service details, imagery and location context.

## Google Business Profile design

Google Business Profile has no conventional keyword field. Local relevance should come from complete information, accurate categories, menu content, photos, posts, reviews and consistency with the website.

### Description

Update the permanent description to include:

- cafetería de especialidad
- Providencia and Santiago
- desayunos and brunch
- almuerzos and Menú Ejecutivo de lunes a viernes
- coffee methods and author drinks
- bakery and onces

The description must remain under 750 characters and contain no links, promotions or keyword stuffing.

### Categories

- Keep the most accurate café/coffee-shop category as primary.
- Inspect available secondary categories in the authenticated profile before adding a restaurant or brunch-related category.
- Add only categories that describe the business itself, not individual products.

### Menu

Keep `https://derivastudio.cl/menu` as the preferred menu URL. Organize the Google menu into accurate sections where the editor is available:

- Café de especialidad
- Desayunos y brunch
- Menú Ejecutivo
- Bagels, focaccias y almuerzo
- Onces y pastelería

The Menú Ejecutivo section may contain a stable product description and the current price only while that price is confirmed. Daily courses should be promoted through posts or a current menu source rather than left stale in permanent fields.

### Recurring activity

- Publish weekday Menú Ejecutivo posts using the currently published edition.
- Add current photos for brunch, lunch, coffee and the venue.
- Respond to reviews naturally; do not script customers or ask them to insert exact keywords.
- Track discovery queries, menu clicks, website clicks, direction requests, calls and review growth.

## Data and failure behavior

- Public API data is authoritative for menu items, prices, courses and availability.
- Missing daily Menú Ejecutivo data renders the stable service explanation and an unavailable-today message.
- API failures must not expose stale or invented courses.
- Hidden catalog items remain excluded everywhere.
- Google Business Profile edits require the authenticated owner/manager session and read-after-write verification.

## Verification

- Automated tests for metadata, keyword coverage, API-backed content, structured data and hidden-item exclusion.
- Typecheck and production build.
- Rendered verification at 1440×900, 430, 390, 375 and 320 px.
- Paper Desktop artboards at 1440×900 and 390×844, followed by explicit user approval before Vercel deployment.
- After deployment, verify canonical pages, structured data, sitemap, Spanish rendered output and Google menu/profile links.

## Authoritative references

- Google local ranking guidance: https://support.google.com/business/answer/7091?hl=es
- Google Business Profile menu editor: https://support.google.com/business/answer/9455840?hl=es-419
