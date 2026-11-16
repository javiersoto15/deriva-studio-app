# Barra bean stock: integrated reference lock

Research completed 2026-11-16. This is evidence for the existing Barra workflow, not permission to replace its visual system. `component-board.html` is the readable side-by-side image board; `component-board.png` is its portable overview; `component-board.json` records all candidates, six qualitative scores, source URLs and winners. `sources.json` maps downloaded originals. Every candidate is an actual downloaded production screenshot, unedited and uncropped.

## Coverage and grounding

Eight Refero searches returned 80 results (the initial seven returned 70 results / 62 unique screens). Ten screens were investigated in detail and viewed as images, including the extra sharing screen. Mobbin supplied 29 production screenshots across inventory, adjustment, history, selection, recovery and sharing. Hex and Notion style details were retrieved. The evidence is integrated per component below; it is not two unrelated moodboards.

Existing Deriva typography, warm ledger surfaces, fine borders, dense rows and brown working actions remain the brand source of truth. From Hex borrow restrained rules and near-square utility controls; reject violet accents, decorative capsules, huge marketing headlines and grain. From Notion borrow practical hierarchy and aligned comparison rows; reject oversized headings, colorful word tokens and product illustrations. No hero, testimonials or conversion section is relevant to this internal operations task.

| Component | Refero evidence | Mobbin production evidence | Resulting structure |
|---|---|---|---|
| Header/navigation | Square item table and compact filters | Shopify inventory controls | Title, Productos / Granos work tabs, single compact search/filter bar; existing product filters nested in Productos |
| Bean rows | Mangomint dense inventory + detail panel | Square quantity separate from availability/status | Name, textual premium/status and right-aligned kg; null means Sin contar, distinct from zero; existing detail opening |
| Kg adjustment | Mangomint anchored detail form | Shopify current → new inventory adjustment | Explicit count/add/remove mode, exact input, live before/after, note and save in existing panel |
| Carta associations | Shopify searchable checkbox product picker | Teachable searchable product picker | Search + explicit selection list + selection summary/save; read-only staff connections |
| History | Fibery actor/time/change audit columns | Square day-grouped inventory event rows | Day-grouped action, before/after, actor, timestamp and note; stack on mobile |
| Empty | Fresha concise empty inventory state | Deel empty selected detail panel | Small title/helper/action inside working region; search no-results and no-history copy stay specific |
| Loading | Fal column-aligned skeleton log and Mercury task skeleton | Shopify/Square inventory rows establish actual layout slots | Retain headers, show skeleton slots and loading text; never imply zero stock |
| Recovery | Loom explicit unsaved draft choices | Typeform retry versus restart hierarchy; SuperHi auth failure checked | Preserve draft, clear recovery action; adapt semantics to actual API contract |
| Sharing | Runway focused copy dialog | Bonsai focused sharing dialog + copied confirmation | Existing StockShare preview, context Compartir granos, Copiar / WhatsApp, confirmation |

## Required domain adaptations

- All nine seeded beans appear even before their first count. Premium is secondary metadata for Cenicafé by Colibrí and 504 Tasty Roast, not a badge competing with stock state.
- Quantity is kilograms with up to three decimals. Unknown only permits first absolute count; add/subtract needs a known baseline. Preview cannot be negative. A quantity of zero remains an explicit known count.
- `Productos | Granos` switches working scope. Product-specific Todos/Carta/Insumos stays inside Productos. No bean creation UI initially.
- Carta links are manager-owned; staff sees current associations without editing. Search/checkbox flow is a proposal based on production selection references; exact API behavior governs persistence.
- A network interruption after sending is **Guardado por confirmar**, not a proven failure. Retry the same request UUID. A 409 requires current-server quantity and human review; a 401 requires reauthentication and same-account draft restoration. A backend 404 is **Granos todavía no está habilitado**, not an empty 200.
- Sharing uses the complete nine-bean snapshot regardless of active search/filter; show date/time, kg or Sin contar and premium metadata. Keep the full text inspectable before copying or opening WhatsApp.

## Limits and checks

Screenshots establish visual structure only. Their accessibility scores are qualitative visual suitability, not verified keyboard, contrast or screen-reader audits. The generic recovery references do not independently prove 409/401/404/idempotency behavior; those rules come from the backend/current app contract. The screenshot styles and labels must be translated into existing Deriva components, not copied as a new visual theme.

All 18 selected source images downloaded successfully with normal TLS verification via curl and were verified as decodable images. Manifest checks passed: nine components, two different products each, exactly one winner each, six criteria each, and all local images present. No application code, Paper or production state changed by this research task.
