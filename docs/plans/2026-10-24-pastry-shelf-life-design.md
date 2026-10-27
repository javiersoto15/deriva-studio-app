# Pastelería · vida útil inside the count — design + backend handoff

**Status:** Frontend built 2026-10-26 on branch `feat/stock-shelf-life` against backend `88690ab` (deployed); not deployed, awaiting founder approval of the *Implementado 26 Oct* Paper boards. Original proposal v2, 2026-10-24. The founder answered the open questions the same day (see *Decisions*). Paper mocks are ready for founder review. Nothing is implemented yet. Backend tasks below belong to Javier; the frontend (`app/(admin)/stock/`) is owned on the webapp side.

**v2 change (founder):** shelf life must be part of the existing counting process, not a separate tab. v1 (separate "Vida útil" tab with explicit open/close of lots) is superseded; its Paper boards are marked `SUPERADO`.

**Scope:** admin only (`admin.derivastudio.cl/stock`). Lots and shelf-life rules never touch `/public/menu`, `/menu`, the companion, or the stock-visibility rule. Menu visibility keeps depending on counts only.

## Core idea: the count drives the lots

Staff keep doing exactly what they do today: open an item, then **Fijar total / Sumar / Restar**. For counters that have a shelf-life rule (the 9 pastry products), the backend keeps a FIFO list of lots *behind* the count. Every saved adjustment updates it.

| Count change | What happens to lots |
|---|---|
| Goes **up** (Fijar total higher, or Sumar) | **Always one new lot** containing all the added units (portions or units), clock starting now. There is no question and no per-unit dates. The editor shows **ENTRAN +N · LOTE NUEVO** with the *fresca hasta / retirar* preview. |
| Goes **down** (Fijar total lower, or Restar) | Units leave the **oldest lot first** (FIFO), automatically. No question is asked. The editor shows **SALE DE** with the lots affected. |
| Motivo **Merma · vencido** | Same FIFO consumption, recorded as waste (merma). When the item has expired units, the editor offers it pre-filled: *Retirar N vencidas*. |
| First count of an item / items with stock before launch | One lot with **edad desconocida** (unknown age). The row asks for its date once, without blocking. |

**Invariant:** the sum of open lot quantities always equals the counter quantity. The lots never disagree with the count, because they are derived from the same adjustment in the same transaction.

Lots are kept in the counter's own unit (unid., the same unit staff already count in). This removes the whole-vs-portion problem.

## Kitchen shelf life (source: kitchen, 2026-10-24)

| Product | Fresca hasta | Retirar |
|---|---|---|
| Torta cuatro leches | 3 d | 4 d |
| Torta chocolate manjar | 3 d | 4 d |
| Torta chocolate frambuesa | 2 d | 3 d |
| Torta lúcuma manjar | 2 d | 3 d |
| Brownie | 4 d | 5 d |
| Queque manzana canela crumble | 3 d | 4 d |
| Queque glaseado | 4 d | 5 d (founder) |
| New York Cookies | 5 d | 7 d |
| Trufas de chocolate | 5 d | 7 d |

**Clock:** shelf life counts from the moment the lot **enters the bar**, which is the server time of the saving adjustment. It does not count from elaboración.

Each lot's state is computed server-side at the request's `now` (America/Santiago):

- `fresh`: `now < fresh_until`.
- `sell_first`: `fresh_until ≤ now < discard_at`.
- `discard`: `now ≥ discard_at`.

**`last_sale_day`:** set when the venue is closed between now and `discard_at` (Sunday). Uses the canonical hours: Mon–Fri 08:00–21:00 · Sat 10:00–21:00 · Sun closed · Feriados 10:00–21:00.

## UX (Paper: "Admin · Vida útil pastelería · 24 Oct", boards `v2 ·`)

1. **List (unchanged layout):**
   - The *CARTA* notice box becomes a **VIDA ÚTIL** summary ("1 por retirar · 2 para vender hoy").
   - New filter **Solo por vencer** next to *Solo sin contar*.
   - On pastry rows, the second line shows the worst lot state ("Retirar 2 · elab. mié 08:40" / "Vender hoy 2 · 5 frescas" / "Fresca · vender antes lun"). The count box gets a solid 2px brown border only when something must be retired.
   - The dashed treatment stays reserved for *Sin contar*.
2. **Fijar total, count goes up:** the ENTRAN +N block appears under QUEDARÁN, with a live *fresca hasta / retirar* preview from now. The primary button is unchanged ("Fijar total en 12").
3. **Restar, retiring expired units:** the header says "Hay 2 unid. · 2 vencidas". The SALE DE block shows FIFO consumption. Motivo is pre-set to *Merma · vencido*. The button reads "Retirar 2 vencidas".
4. **Plazos de cocina** (manager/owner): kept from v1.
5. **Alerts are dashboard-only** (no email): the VIDA ÚTIL summary box, the *Solo por vencer* filter, and row status lines. v1's email board is marked `SUPERADO`.

Non-pastry items (insumos, untracked carta items) look and behave exactly as today.

Reference trail:
- Thrive Market ([Mobbin](https://mobbin.com/screens/98b589a3-d2ef-4ba2-96f6-5c796efb9d4b)): list sorted by "Expires in N days".
- Azar ([Mobbin](https://mobbin.com/screens/2b60265b-0ace-4e46-affc-1bab845a2cc0)): "N hours left".
- Shopify inventory ([Refero](https://refero.design/pages/dc0a9649-d270-4617-b686-6ebc5db4bf50)): desktop ledger table.
- Foodservice FIFO and day-dot labelling practice.

## Backend tasks (owner: Javier)

### B1 · Migration `038_stock_shelf_life.sql`

- `stock_shelf_life_rules`
  - `stock_id` PK, `fresh_days`, `discard_days`, with CHECK `0 < fresh ≤ discard`
  - `revision`, `updated_by`, `updated_at`
  - Seed the 9 rules on the counters staff already count for those products.
- `stock_lots`
  - `id`, `stock_id`
  - `entered_at` timestamptz NULL (= adjustment time; NULL = edad desconocida for backfilled stock)
  - `fresh_until` and `discard_at`, **snapshotted at creation**
  - `quantity_in`, `quantity_left` (≥ 0)
  - `created_by_adjustment_id`, `created_at`
- `stock_lot_movements`: `adjustment_id`, `lot_id`, `delta`, for audit and history.
- Backfill: for every ruled counter with quantity > 0, create one unknown-age lot.

### B2 · Extend `POST /admin/stock/items/{stock_id}/adjustments`

No new request fields.

- Positive change on a ruled counter: **always** create one lot of N units with `entered_at = now()` (server time). There is no correction path and no per-unit dates (founder).
- Negative change: consume FIFO by `entered_at`, with NULL last (unknown age = treated as newest). Fully consumed lots close.
- Same transaction as the quantity update. Existing 409 `revision_conflict` semantics are unchanged.
- The response `adjustment` adds `lots_affected: [{ lot_id, entered_at, before, after }]`.
- Optional dry run: `?preview=true` returns the computed `lots_affected` + the new lot's `fresh_until`/`discard_at` without writing. Otherwise the client computes the preview from B3 data. Tell me which you prefer.

### B3 · Extend `StockItem` in `GET /admin/stock`

On ruled counters only:

```json
"shelf_life": {
  "fresh_days": 2,
  "discard_days": 3,
  "worst_state": "discard",
  "last_sale_day": false,
  "lots": [{
    "id": "...", "entered_at": "...", "quantity_left": 2,
    "fresh_until": "...", "discard_at": "...", "state": "discard"
  }],
  "counts": { "discard": 2, "sell_first": 0, "fresh": 0, "unknown": 0 }
}
```

- Add a top-level `shelf_life_summary: { discard_items, sell_first_items }` for the VIDA ÚTIL box.
- Untracked items omit the field, so the response is backward compatible.

### B4 · `PATCH /admin/stock/lots/{lot_id}` (staff+)

Sets `entered_at` on an unknown-age lot only, so staff can date the backfilled stock.

### B5 · `GET` + `PUT /admin/stock/shelf-life/{stock_id}`

Manager/owner can edit the days. Changes apply to new lots only.

### B6 · ~~Alert digest job~~: dropped (founder: no emails, dashboard alerts only)

### B7 · OpenAPI

Update `13_companion_backend/docs/openapi.yaml` so the frontend can run `npm run api:types`.

### Optional · WhatsApp share

The existing *Compartir stock* message could append "Retirar: …". This is frontend-only once B3 exists.

## Frontend tasks (after approval + B1–B3 + B7)

- `src/stock/shelf-life.ts`: normalizers, row status line, lot preview (if no backend dry run), countdown formatting (es-CL `hourCycle: "h23"`), tests.
- `StockEditor.tsx`: informational ENTRAN +N · LOTE NUEVO block on positive deltas of ruled items, SALE DE block on negative deltas, *Retirar N vencidas* preset, Merma · vencido motivo.
- `StockApp.tsx`: VIDA ÚTIL summary box, *Solo por vencer* filter, row status line, unknown-age prompt.
- Plazos de cocina screen (manager). Verify at 320/375/390/430/1440, update Paper with real renders, ask for deploy approval.

## Decisions (founder, 2026-10-24)

1. The clock starts when the lot enters the bar. There is no elaboración date and no date picker.
2. Sunday closed → Saturday is the último día de venta (`last_sale_day`). Confirmed.
3. No alert emails. Alerts are dashboard-only.
4. Queque glaseado: fresca 4 d, retirar on day 5.

5. Pastry counters count portions/units. Every increase is one new lot for all the added units; dates are per lot, never per unit.

## Known trade-off

Because every increase is a new lot, fixing an undercount (+N) gives those units a fresh date. The UI preview makes this visible before saving.

## As built (2026-10-26)

Backend shipped with three deltas from this brief; the frontend follows the backend:

- **Groups, not per-product rules.** Managers create named lifespan groups (name, fresca días, retirar día, products). **Nothing is seeded** — until a manager creates groups in *Plazos*, no product is tracked and the count works exactly as before. Creating a group backfills an unknown-age lot for every already-counted product in it.
- **No `?preview`.** The ENTRAN / SALE DE block is computed client-side (`src/stock/shelf-life.ts#previewLots`) from the FIFO-ordered lots in `GET /admin/stock`.
- **Restar below zero is clamped server-side on tracked items.** The editor still blocks a count below 0, so staff never lose units silently.

UI deltas from the v2 boards: the *Plazos de cocina* heading button moved into the VIDA ÚTIL strip as a "Plazos" link (three stacked buttons were too heavy at 320 px); the VIDA ÚTIL strip sits under the CARTA strip instead of replacing it; the shelf line also shows on desktop rows.

Verification: isolated stack (Auth emulator + API at `88690ab` on a throwaway DB + scratch `next dev`); screenshots and `report.json` in `../docs/verification/2026-10-26-stock-vida-util/` (320/375/390/430/1440, no horizontal overflow). Staff flows verified against the DB: retire 4 vencidas consumed only the expired lot; dating an unknown lot produced the right deadlines; staff see Plazos read-only.
