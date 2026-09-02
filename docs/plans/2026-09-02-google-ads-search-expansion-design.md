# Google Ads Search Expansion Design

**Date:** 2026-09-02  
**Status:** Published; initial learning in progress
**Account:** 934-597-8419  
**Monthly cap:** CLP 300,000

## Objective

Add keyword-based Search coverage for the local queries that Performance Max cannot guarantee, while preserving the existing 5 km Providencia reach, the foot-traffic/directions objective, and the CLP 300,000 monthly ceiling.

Success means the account can enter auctions for the approved exact and phrase searches, users land on the most relevant Deriva page, calls remain excluded, and every live mutation is recorded in the campaign history.

## Campaign architecture and budget

Keep the existing Performance Max campaign as a discovery layer and add two Search campaigns:

| Campaign | Daily budget | Landing page | Schedule |
| --- | ---: | --- | --- |
| `Search | Menú Ejecutivo | Providencia` | CLP 3,091 | `/menu-ejecutivo` | Mon-Fri, 10:30-16:00 |
| `Search | Café, Filtrados y Desayuno | Providencia` | CLP 3,709 | `/menu` | Mon-Fri 08:00-21:00; Sat 10:00-21:00 |
| Existing `Deriva Coffee Studio` Performance Max | CLP 3,000 | Existing URL rules | Existing schedule |

Total: **CLP 9,800/day**, or **CLP 297,920 per 30.4-day Google billing month**. This preserves the current total and stays under the CLP 300,000 cap.

The founder's final allocation makes the Café campaign effectively 20% larger than Menú: CLP 3,709 / CLP 3,091 = 1.19994. Whole-peso budgets prevent an exact 1.20000 ratio while also summing to CLP 9,800 with the CLP 3,000 Performance Max allocation.

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

The Menú campaign has one tightly themed ad group. The Café campaign launched with one consolidated ad group covering café, filtrados, desayuno, mate and cowork-café intent. This avoids fragmenting limited exact/phrase traffic during initial learning; split it into theme-specific ad groups only when search-term and volume evidence supports the change.

Responsive Search Ads must use only claims visible in the live menu/site. Core messages include:

- Menú Ejecutivo in Providencia, Monday-Friday 13:00-16:00, current edition and directions.
- Specialty coffee, espresso drinks, V60, Chemex, rotating origins, decaf and coffee beans.
- Breakfast, brunch, pastries and the published menu.
- Mate service and a café-to-work search intent, without unsupported amenity promises.

Planned account/campaign sitelinks: `Carta`, `Menú Ejecutivo`, `Cómo llegar`, `Reseñas`. No call asset. Sitelinks were not part of the initial publication and remain a follow-up optimization.

## Negative keywords

Apply phrase negatives to both Search campaigns after launch, subject to Google impact preview:

`café con piernas`, `qué es`, `qué significa`, `cómo hacer`, `receta`, `curso`, `trabajo`, `empleo`, `máquina de café`, `cafetera`, `filtro para café`, `filtros de café`, `papel filtro`, `equipamiento`, `mayorista`, `corporativo`, `casino`, `delivery`, `sin gluten`.

The existing Performance Max exclusions remain. Search-campaign negatives were not part of the initial publication and remain pending; add only safe exclusions confirmed by impact preview and subsequent search-term evidence.

## Verification and change history

After publishing, verify campaign status, budgets, total daily budget, conversion goals, location option, schedules, keyword match types, negatives, sitelinks, and absence of call assets. Re-run Ad Preview and Diagnosis for the priority terms. A new campaign under review is not yet proof of serving; record the exact review state and verify impressions/search terms once data arrives.

Append live readback and timestamps to `docs/campaign/google-ads-optimization-history.md` so future optimizations can distinguish planned, staged, published and actually-serving states.
