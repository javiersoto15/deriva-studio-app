# /hoy — Editorial Bento (v5)

**Status:** approved 2026-05-25 — supersedes the 2026-05-14 hoy-tab design doc.
**Paper artboard:** `Companion · /hoy v5 (Editorial Bento) — Mobile` (node `98H-0`).

## Intent

`/hoy` is the **first tab** authenticated users see in the companion. It reads as today's edition of Deriva — glanceable, ambient, one-pager. Not a launcher.

Surfaces, in order of fold:

1. **Slim mast** — `Vol. NNN · № WW` (left) / `Otoño MMXXVI · Apertura` (right). Plex Mono, ink-muted.
2. **Personal greeting** — `Buenos días, {firstName}.` (Cormorant italic) / `Lun 25 May` (Plex Mono, brown-700). Hour-aware greeting resolved client-side.
3. **HERO tile — Café del día.** Brown-900 espresso surface, cream type. Kicker (`● CAFÉ DEL DÍA` / `01 · destacado`), origin name as the type moment (`Huehuetenango.`), origin + proceso (`La Esperanza — Lavado.`), tasting notes (italic), thin cream rule, footer row (`Pour over · V60` / `ver carta →`).
4. **Two-up row:**
   - **Rotación tile** — `Rotación · 3 orígenes` header; rows `02 Chiapas` and `03 Nariño` (italic name, mono numeral). Optional `Sin cafeína` chip.
   - **La barra tile** — `La barra` header; circular avatar with initial, `Martina.` italic, `turno hasta 14:00`, short barista note in italic quotes.
5. **Nota tile** — `— Nota de la casa` (with green em-dash, the page's single green accent on the editorial moment) / `Firma · JS`. Pull quote in Cormorant italic.
6. **Metric strip** — three mini-tiles:
   - **Estado** — `● Abierto` (green dot) / `cierra` / `21:00`.
   - **Tu cartera** — inverted brown-900 mini-tile, `4 / 8` count, `cafés para tu próximo`.
   - **Última** — `Flat white.` / `sáb · 10:14`.

Closed-state replaces Estado with `● Cerrado · Abrimos lun 08:00`, hides Tu cartera's progress framing, and shifts hero kicker to a planning posture.

## Data sources (v1)

- **Backend** (`/public/menu`): drives `executive_menu` later — not used in /hoy v1 hero (the hero is destacado origin, not menu ejecutivo).
- **Typed config** in `src/data/today/`:
  - `cafe-del-dia.ts` — destacado origin (name, region, proceso, notes, brew method).
  - `rotacion.ts` — array of secondary origins (length 2 for the two-up).
  - `barra.ts` — daily/weekly barista schedule + optional note.
  - `nota.ts` — house quote + signature initials.
  - `de-la-casa.ts` (reserved) — house-wide promo, surfaced when present.
- **Hooks / client:**
  - `useMemberSelfProfile()` for `firstName` in greeting.
  - `useTodayPour()` — last order shortcut (`Flat white.`); hidden when empty.
  - `useDerivaHours()` — open/closed + cierre hora.

Backend extension is deferred — the typed shapes mirror the eventual `/public/today` response so a future swap is one fetcher change per module.

## Routing / nav

- New route: `app/(companion)/hoy/page.tsx` + `_components/`.
- `PersistentTabBar`:
  - Add `{ prefix: "/hoy", tab: "hoy" }`.
  - Tab key `"hoy"` added to `TabBar`.
  - `/inicio` stays in `HIDDEN_PREFIXES` (logged-out splash).
  - `PREFETCH_TARGETS += "/hoy"`.
- `RequireAuth` post-login redirect target switches from current default to `/hoy`.
- Tab labels (left→right): `Hoy · Carta · Cartera · Código · Estudio`.

## Component decomposition

```
app/(companion)/hoy/
├── page.tsx               # server component; resolves edition + fetches data
└── _components/
    ├── SlimMast.tsx       # Vol/№ + season+campaign
    ├── Greeting.tsx       # client — local hour + name + date suffix
    ├── HeroCafeDelDia.tsx # espresso tile
    ├── RotacionTile.tsx   # numbered origin chips
    ├── BarraTile.tsx      # avatar + barista byline
    ├── NotaTile.tsx       # green em-dash quote
    └── MetricStrip.tsx    # estado / cartera / última
```

## Tokens (reuse from `src/design/tokens.ts`)

- `beige100` — page canvas.
- `brown900` — hero + Tu Cartera mini-tile.
- `cream` — hero type, divider on espresso.
- `brown700` — numerals, accent dates, price.
- `ink900` / `inkMuted` — body / supporting.
- `green600` (`#00311F`) — `●` Abierto dot **and** Nota em-dash. v3 precedent endorses two greens for functionally distinct accents (status indicator + editorial accent); the rule against two greens applies to decorative use, not status semantics.

## Type rules

- Display moments (Huehuetenango., Una taza a la vez…): Cormorant Garamond SemiBold or Italic, 28–36px.
- Headers (Café del día, Rotación, La barra, Nota de la casa): Plex Mono, 11px, uppercase, +0.12em.
- Body: Cormorant Garamond Regular, 15–17px.
- Numerals + dates + chips: IBM Plex Mono, 10–14px.
- Wordmark: `LogoLockup` — not present on /hoy v5 (mast carries identity instead).

## Edge cases

- **No name in profile**: greeting reads `Buenos días.` (period stays).
- **Backend failure on `/public/menu`**: hero falls back to typed config destacado; never surfaces an error.
- **No última pour**: Última tile collapses; metric strip becomes two tiles.
- **Sunday / closed**: closed-state shape (above).
- **Offline**: `OfflineStrip` handles the persistent notice; /hoy renders last cached config.
- **Loading**: render static chrome (mast + greeting + tile frames) instantly; skeleton only inside Hero + Última while data resolves.

## Deploy gate

Paper artboard `98H-0` is the canonical mockup. Deploy approval per `feedback_paper_first_workflow.md` is granted on **mobile** only; desktop deferred (companion is phone-first PWA).

## What this supersedes

- `2026-05-14-companion-hoy-tab-design.md` (v1 long editorial stack).
- v1/v2/v3 Paper artboards (`4P9-0`, `4U1-0`, `4WY-0`) remain on canvas as design history; v5 is the build target.
