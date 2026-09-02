# Google Ads Search Expansion Design

**Date:** 2026-09-02  
**Status:** Approved for live staging  
**Account:** 934-597-8419  
**Monthly cap:** CLP 300,000

## Objective

Add keyword-based Search coverage for the local queries that Performance Max cannot guarantee, while preserving the existing 5 km Providencia reach, the foot-traffic/directions objective, and the CLP 300,000 monthly ceiling.

Success means the account can enter auctions for the approved exact and phrase searches, users land on the most relevant Deriva page, calls remain excluded, and every live mutation is recorded in the campaign history.

## Campaign architecture and budget

Keep the existing Performance Max campaign as a discovery layer and add two Search campaigns:

| Campaign | Daily budget | Landing page | Schedule |
| --- | ---: | --- | --- |
| `Search | Menú Ejecutivo | Providencia` | CLP 3,400 | `/menu-ejecutivo` | Mon-Fri, 10:30-16:00 |
| `Search | Café, Filtrados y Desayuno | Providencia` | CLP 3,400 | `/menu` (brand/cowork may use `/`) | During opening hours |
| Existing `Deriva Coffee Studio` Performance Max | CLP 3,000 | Existing URL rules | Existing schedule |

Total: **CLP 9,800/day**, or **CLP 297,920 per 30.4-day Google billing month**. This preserves the current total and stays under the CLP 300,000 cap.

Both Search campaigns use campaign-specific `Get directions` and `Store visits` conversion goals. Phone-call goals and call assets remain excluded. Location stays a 5 km radius around Magnere 1570 with Presence-only targeting; language is Spanish.

Launch bidding is Maximize Clicks with a CLP 900 maximum CPC. This favors initial local-search coverage without granting unbounded click bids. Reassess after 14 days using search-term quality, impression share, directions and store-visit evidence; do not switch to conversion bidding until the account has enough reliable conversion volume.

## Keyword design

All launch keywords use exact or phrase match. Broad match is excluded until query quality and negative coverage are proven.

### Menú Ejecutivo

`[menú ejecutivo providencia]`, `"menú ejecutivo providencia"`, `[menú ejecutivo]`, `"menú ejecutivo"`, `[almuerzo providencia]`, `"almuerzo providencia"`, `[almorzar en providencia]`, `"almorzar en providencia"`, `[menú del día providencia]`, `"menú del día providencia"`, `"almuerzo cerca de mí"`, `"dónde almorzar en providencia"`, `"restaurante con menú ejecutivo"`.

Google close variants cover accent and spelling differences, so duplicate unaccented exact keywords are unnecessary.

### Café de especialidad

`[cafetería providencia]`, `"cafetería providencia"`, `[café providencia]`, `"café providencia"`, `[café de especialidad]`, `"café de especialidad"`, `[café de especialidad providencia]`, `"café de especialidad providencia"`, `[cafetería de especialidad]`, `"cafetería de especialidad"`, `"café cerca de mí"`, `"cafetería cerca de mí"`, `"café abierto ahora"`.

### Filtrados y productos

`[café filtrado]`, `"café filtrado"`, `[v60]`, `"café v60"`, `[chemex]`, `"café chemex"`, `[pour over]`, `"café pour over"`, `[coffee flight]`, `[café de autor]`, `[espresso tonic]`, `[café descafeinado]`, `"café descafeinado providencia"`, `[café en grano]`, `"café en grano providencia"`.

### Desayuno y brunch

`[brunch providencia]`, `"brunch providencia"`, `[desayuno providencia]`, `"desayuno providencia"`, `"desayuno cerca de mí"`, `[pastelería providencia]`, `"café y torta providencia"`, `[croissant providencia]`.

### Mate and cowork café

These user-approved additions stay deliberately narrow because Keyword Planner showed limited volume and the live site does not substantiate Wi-Fi, desks or terrace claims:

`[mate providencia]`, `"mate en providencia"`, `[servicio de mate]`, `"servicio de mate providencia"`, `"cafetería con mate"`, `"café y mate providencia"`, `[cowork café]`, `"cowork café providencia"`, `[café cowork providencia]`, `"cafetería para trabajar providencia"`, `"café para trabajar"`.

Ad copy may accurately mention café, mate, cocina and the Providencia location. It must not promise Wi-Fi, power outlets, reserved desks, unlimited stays or terrace access unless those claims are added to and verified on the website.

### Brand protection

`[deriva studio]`, `"deriva studio"`, `[deriva coffee studio]`.

The advertised business name remains the legacy-approved `Deriva Studio`; the domain remains `derivastudio.cl`.

## Ad groups and assets

The Menú campaign has one tightly themed ad group. The Café campaign uses four ad groups: `Café de especialidad`, `Filtrados y orígenes`, `Desayuno y brunch`, and `Mate y cowork`.

Responsive Search Ads must use only claims visible in the live menu/site. Core messages include:

- Menú Ejecutivo in Providencia, Monday-Friday 13:00-16:00, current edition and directions.
- Specialty coffee, espresso drinks, V60, Chemex, rotating origins, decaf and coffee beans.
- Breakfast, brunch, pastries and the published menu.
- Mate service and a café-to-work search intent, without unsupported amenity promises.

Account/campaign sitelinks: `Carta`, `Menú Ejecutivo`, `Cómo llegar`, `Reseñas`. No call asset.

## Negative keywords

Apply phrase negatives to both Search campaigns, subject to Google impact preview:

`café con piernas`, `qué es`, `qué significa`, `cómo hacer`, `receta`, `curso`, `trabajo`, `empleo`, `máquina de café`, `cafetera`, `filtro para café`, `filtros de café`, `papel filtro`, `equipamiento`, `mayorista`, `corporativo`, `casino`, `delivery`, `sin gluten`.

The existing Performance Max exclusions remain. Add only missing safe exclusions so duplicates do not obscure the change history.

## Verification and change history

After publishing, verify campaign status, budgets, total daily budget, conversion goals, location option, schedules, keyword match types, negatives, sitelinks, and absence of call assets. Re-run Ad Preview and Diagnosis for the priority terms. A new campaign under review is not yet proof of serving; record the exact review state and verify impressions/search terms once data arrives.

Append live readback and timestamps to `docs/campaign/google-ads-optimization-history.md` so future optimizations can distinguish planned, staged, published and actually-serving states.
