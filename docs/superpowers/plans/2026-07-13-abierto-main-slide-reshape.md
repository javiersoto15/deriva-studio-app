# /abierto Main Slide Reshape — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the `/abierto` main splash slide so Café de Autor is the featured star, reading live from the backend so it never drifts, while preserving the editorial theme.

**Architecture:** `AbiertoDisplay` (a React Server Component in `app/(landing)/abierto/page.tsx`) fetches the backend `PublicMenuView` and resolves the three Café de Autor signatures + the Cafetería list by **name-matching** (the pattern `/sala` already uses), with curated fallbacks for build-time prerender. New `.ab-autor` CSS block renders the signature list. No backend change; no new photography.

**Tech Stack:** Next.js 16 App Router (RSC + Cache Components), TypeScript, plain CSS (`abierto.css`), `getPublicMenuView` fetcher, `DerivaImage` CDN component.

## Global Constraints

- **Surface:** main splash slide only — `AbiertoDisplay` in `app/(landing)/abierto/page.tsx`. Do NOT touch `AbiertoPromo`, `AbiertoEjecutivo`, `AbiertoNoche`, `AbiertoInauguracion`, or the `AbiertoRotator` gating.
- **No test runner exists** in this repo. Verification per task = `npm run typecheck` (clean) + rendering `/abierto?view=abierto`. No vitest/jest.
- **Data source:** live `getPublicMenuView({ locale: "es-CL" })`; resolve items by name; curated fallbacks required (build-time backend is unreachable → must render).
- **No backend changes** — the payload has no "Café de Autor" grouping; name-matching is the accepted pattern.
- **Single green moment:** `--ab-green` (#00311F) stays used exactly once, on `.ab-quote__edition`. New elements use `--ab-ink` / `--ab-ochre` / `--ab-mute` — never a second green.
- **Type system:** Cormorant Garamond italic (`--font-display`) for display; Poppins tracked uppercase (`--font-tracked`) for labels; IBM Plex Mono (`--font-mono`) for numerals/prices. Match existing `.ab-*` class conventions.
- **Voice:** no "sin apuro" (founder-flagged). `Deriva` is a noun; "a la deriva" (drift idiom) is allowed. `ronda` not `tanda`.
- **Prices** are authoritative from the 2026-07-13 SumUp delta; live `price_label`/`price_clp` overrides fallback when present.
- **Paper-first deploy gate:** mock in Paper + explicit visual approval BEFORE any `vercel deploy`. This plan does not deploy.

---

### Task 1: Café de Autor + Cafetería data resolvers

Pure helpers added to `page.tsx`. They resolve live items by name with curated fallbacks, mirroring `/sala`'s proven pattern.

**Files:**
- Modify: `app/(landing)/abierto/page.tsx` (add helpers near existing `getCafeteriaData` / `resolveEjecutivoCourses`, ~line 131)

**Interfaces:**
- Consumes: `getPublicMenuView` (already imported), `PublicMenuView`/`PublicMenuItem` types (import from `../../../src/api/server`), existing `getCafeteriaData()`.
- Produces:
  - `type AutorItem = { roman: string; name: string; price: string; description: string }`
  - `resolveAutorItems(view: PublicMenuView | null): AutorItem[]` (always length 3, order Tropical/Tierra/Pre-Infusion)
  - `resolveCafeteriaNames(view: PublicMenuView | null): string[]` (≤7 names, Autor items excluded)

- [ ] **Step 1: Add the type import**

At the top of `page.tsx`, extend the existing `getPublicMenuView` import to also pull the payload types:

```ts
import { getPublicMenuView, type PublicMenuView, type PublicMenuItem } from "../../../src/api/server";
```

(Replace the current `import { getPublicMenuView } from "../../../src/api/server";` line.)

- [ ] **Step 2: Add resolver helpers**

Insert after `getCafeteriaData()` (i.e. after ~line 131):

```ts
// --- Café de autor (live, name-matched with curated fallbacks) --------------
// The public payload has no "Café de autor" grouping — resolve each signature
// by name across sections/subgroups, same as /sala. Curated fallbacks (from the
// 2026-07-13 SumUp delta) render at build time and until the backend lists them.
type AutorItem = { roman: string; name: string; price: string; description: string };

const AUTOR_RE = /espresso\s*tropical|tierra\s*&?\s*hierbas|pre.?infusi[oó]n/i;

const AUTOR_FALLBACK = {
  tropical: {
    name: "Espresso Tropical",
    price: "$4.990",
    description:
      "Syrup casero de maracuyá, tónica fría y doble espresso Etiopía. Fresco, cítrico y cafetero."
  },
  tierra: {
    name: "Tierra & Hierbas",
    price: "$5.090",
    description:
      "Café Etiopía molido con rooibos Earl Grey, terminado en pour over. Balanceado, floral y herbal."
  },
  preinfusion: {
    name: "Pre-Infusion",
    price: "$8.290",
    description:
      "Nuestra lectura del espresso martini: vodka infusionado en mate, syrup de mate y espresso de la casa."
  }
} as const;

function findItemByName(
  view: PublicMenuView | null,
  matcher: RegExp
): PublicMenuItem | undefined {
  if (!view) return undefined;
  for (const s of view.sections) {
    for (const grp of [s, ...(s.subgroups ?? [])]) {
      for (const i of grp.items ?? []) {
        if (i.available !== false && matcher.test(i.name)) return i;
      }
    }
  }
  return undefined;
}

function livePrice(item: PublicMenuItem | undefined, fallback: string): string {
  if (!item) return fallback;
  if (item.price_label) return item.price_label;
  if (typeof item.price_clp === "number") return `$${item.price_clp.toLocaleString("es-CL")}`;
  return fallback;
}

function resolveAutorItems(view: PublicMenuView | null): AutorItem[] {
  const specs = [
    { roman: "i.", key: "tropical" as const, re: /espresso\s*tropical/i },
    { roman: "ii.", key: "tierra" as const, re: /tierra\s*&?\s*hierbas/i },
    { roman: "iii.", key: "preinfusion" as const, re: /pre.?infusi[oó]n/i }
  ];
  return specs.map(({ roman, key, re }) => {
    const fb = AUTOR_FALLBACK[key];
    const live = findItemByName(view, re);
    return {
      roman,
      name: live?.name ?? fb.name,
      price: livePrice(live, fb.price),
      description: live?.description || fb.description
    };
  });
}

// Live Cafetería list for §01 — the coffee section's item names (Autor items
// excluded, they're featured above), capped at 7. Falls back to the static
// menu.ts espresso subgroup when the backend is unreachable (build-time).
function resolveCafeteriaNames(view: PublicMenuView | null): string[] {
  const fallback = getCafeteriaData().itemNames;
  if (!view) return fallback;
  const coffee = view.sections.find((s) =>
    /cafeter|espresso|barra/i.test(`${s.id} ${s.title}`)
  );
  if (!coffee) return fallback;
  const names: string[] = [];
  for (const grp of [coffee, ...(coffee.subgroups ?? [])]) {
    for (const i of grp.items ?? []) {
      if (i.available !== false && !AUTOR_RE.test(i.name)) names.push(i.name);
    }
  }
  return names.length ? names.slice(0, 7) : fallback;
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors). Helpers are unused so far — TS may warn only if `noUnusedLocals` is on; if it flags them, proceed to Task 2 which consumes them (or temporarily verify with Task 2 applied). Confirm no type errors on the helper bodies themselves.

- [ ] **Step 4: Commit**

```bash
git add "app/(landing)/abierto/page.tsx"
git commit -m "feat(abierto): add Café de autor + Cafetería live resolvers"
```

---

### Task 2: Restructure `AbiertoDisplay` JSX

Rewire the splash to fetch the view, feature Café de Autor, and drop stale hardcoded medallions.

**Files:**
- Modify: `app/(landing)/abierto/page.tsx` — `AbiertoDisplay` (~line 288–485)

**Interfaces:**
- Consumes: `resolveAutorItems`, `resolveCafeteriaNames`, `findItemByName`, `livePrice` (Task 1); `getPublicMenuView`, `DerivaImage`, existing `getCafeteriaData().addons`.
- Produces: reshaped `AbiertoDisplay` markup consuming `.ab-autor`, `.ab-trio--pair` (Task 3 CSS).

- [ ] **Step 1: Fetch the view + resolve featured data**

In `AbiertoDisplay`, after `const cafeteria = getCafeteriaData();` (line 294), add:

```ts
  const view = await getPublicMenuView({ locale: "es-CL" });
  const autor = resolveAutorItems(view);
  const cafeteriaNames = resolveCafeteriaNames(view);
  const bagel = findItemByName(view, /bagel\s*churrasco/i);
  const bagelName = bagel?.name ?? "Bagel Churrasco";
```

- [ ] **Step 2: Fix the hero manifesto line + hero medallion**

Replace the hero manifesto paragraph (lines 334–338) open-state string:

```tsx
          <p className="ab-hero__manifesto">
            {open
              ? "Café de especialidad, barra de autor, un rato a la deriva."
              : "Volvemos mañana. Te esperamos a la deriva."}
          </p>
```

Replace the hero feature medallion (lines 340–353) so it features Espresso Tropical:

```tsx
        <div className="ab-feature">
          <div className="ab-feature__med">
            <DerivaImage
              slug="espresso-tropical"
              alt="Espresso Tropical servido frío"
              sizes="340px"
              priority
            />
          </div>
          <div className="ab-feature__cap">
            <span className="ab-feature__num">№ 01 · CAFÉ DE AUTOR</span>
            <span className="ab-feature__name">{autor[0].name}</span>
          </div>
        </div>
```

- [ ] **Step 3: Add the § Café de autor block**

Insert immediately AFTER the Menu Ejecutivo strip block (after line 382, before `{/* Three medallions */}`):

```tsx
      {/* § Café de autor — the new signature line (live, name-matched) */}
      <section className="ab-autor" aria-label="Café de autor">
        <div className="ab-autor__head">
          <span className="ab-autor__section">§ 00</span>
          <span className="ab-autor__title">Café de autor</span>
          <span className="ab-autor__caption">lo nuevo de la barra</span>
        </div>
        <ul className="ab-autor__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {autor.map((a) => (
            <li key={a.roman} className="ab-autor__row">
              <span className="ab-autor__num">{a.roman}</span>
              <div className="ab-autor__body">
                <div className="ab-autor__line">
                  <span className="ab-autor__name">{a.name}</span>
                  <span className="ab-autor__price">{a.price}</span>
                </div>
                <span className="ab-autor__desc">{a.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
```

- [ ] **Step 4: Replace the three medallions with a two-medallion Destacados row**

Replace the entire `{/* Three medallions */}` `<section className="ab-trio">…</section>` block (lines 384–416) with:

```tsx
      {/* Destacados — Tierra & Hierbas (autor) + the new Bagel */}
      <section className="ab-trio ab-trio--pair" aria-label="Destacados">
        <article className="ab-med">
          <div className="ab-med__circle">
            <DerivaImage slug="filtrado" alt="Tierra & Hierbas, café e infusión" sizes="280px" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 02 · FILTRADO DE AUTOR</span>
            <span className="ab-med__name">{autor[1].name}</span>
            <span className="ab-med__note">café Etiopía · rooibos · pour over</span>
          </div>
        </article>
        <article className="ab-med">
          <div className="ab-med__circle">
            <DerivaImage slug="bagel-churrasco" alt="Bagel Churrasco Italiano" sizes="280px" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 03 · A LA MESA</span>
            <span className="ab-med__name">{bagelName}</span>
            <span className="ab-med__note">churrasco, palta, tomate, mayo de la casa</span>
          </div>
        </article>
      </section>
```

- [ ] **Step 5: Switch §01 Cafetería list to live data**

In the `.ab-esp` section, replace the `cafeteria.itemNames.map(...)` list (lines 428–432) with the live-resolved names:

```tsx
          <ul className="ab-esp__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {cafeteriaNames.map((name) => (
              <li key={name} className="ab-esp__item">{name}</li>
            ))}
          </ul>
```

(The §02 Acompaña column keeps `cafeteria.addons` from `menu.ts` — unchanged.)

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Fixes any unused-var warning from Task 1 (helpers now consumed).

- [ ] **Step 7: Commit**

```bash
git add "app/(landing)/abierto/page.tsx"
git commit -m "feat(abierto): reshape splash — Café de autor hero + § block, live Cafetería"
```

---

### Task 3: `.ab-autor` CSS block + two-medallion variant

Style the new block to match the editorial system; adjust the medallion row for two items.

**Files:**
- Modify: `app/(landing)/abierto/abierto.css` (add after the `.ab-esp*` block, ~line 249)

**Interfaces:**
- Consumes: existing tokens `--ab-ink`, `--ab-sub`, `--ab-mute`, `--ab-hairline`, `--ab-ochre`, `--font-display/-mono/-tracked`.
- Produces: `.ab-autor*` classes + `.ab-trio--pair` used by Task 2 markup.

- [ ] **Step 1: Add the CSS**

Append after `.ab-esp__foot { … }` (line 249):

```css
/* === § Café de autor (live signature line) === */
.ab-autor {
  display: flex; flex-direction: column; gap: 18px;
  padding: 32px 0 28px;
  border-top: 2px solid var(--ab-ink);
}
.ab-autor__head {
  display: flex; align-items: baseline; gap: 16px;
  padding-bottom: 10px; border-bottom: 1px solid var(--ab-hairline);
}
.ab-autor__section {
  font-family: var(--font-mono), "IBM Plex Mono", monospace;
  font-weight: 600; font-size: 16px; letter-spacing: 0.24em;
  color: var(--ab-mute);
}
.ab-autor__title {
  font-family: var(--font-tracked), Poppins, sans-serif;
  font-weight: 600; font-size: 24px; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--ab-ink);
}
.ab-autor__caption {
  margin-left: auto;
  font-family: var(--font-display), "Cormorant Garamond", serif;
  font-style: italic; font-weight: 400; font-size: 20px; color: var(--ab-mute);
}
.ab-autor__list { display: flex; flex-direction: column; gap: 20px; padding-top: 6px; }
.ab-autor__row { display: flex; gap: 20px; align-items: baseline; }
.ab-autor__num {
  flex-shrink: 0; width: 44px;
  font-family: var(--font-mono), "IBM Plex Mono", monospace;
  font-weight: 400; font-size: 22px; color: var(--ab-ochre);
}
.ab-autor__body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.ab-autor__line {
  display: flex; justify-content: space-between; align-items: baseline; gap: 20px;
}
.ab-autor__name {
  font-family: var(--font-display), "Cormorant Garamond", serif;
  font-style: italic; font-weight: 500; font-size: 40px; line-height: 1.02;
  color: var(--ab-ink);
}
.ab-autor__price {
  flex-shrink: 0;
  font-family: var(--font-mono), "IBM Plex Mono", monospace;
  font-weight: 500; font-size: 24px; color: var(--ab-ink);
}
.ab-autor__desc {
  font-family: var(--font-display), "Cormorant Garamond", serif;
  font-weight: 400; font-size: 22px; line-height: 1.25; color: var(--ab-sub);
  max-width: 900px;
}

/* Two-medallion Destacados row (was three) — center the pair. */
.ab-trio--pair { justify-content: center; gap: 72px; }
.ab-trio--pair .ab-med { flex: 0 1 auto; max-width: 360px; }
```

- [ ] **Step 2: Typecheck (sanity — CSS won't break TS, but confirm build integrity)**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(landing)/abierto/abierto.css"
git commit -m "style(abierto): § Café de autor block + two-medallion Destacados row"
```

---

### Task 4: Visual verification, height-fit tuning, and Paper mock gate

Confirm the reshaped slide renders correctly, fits 1080×1920 without clipping, and degrades cleanly at build time; then produce the Paper mock for approval before any deploy.

**Files:**
- Possibly Modify: `app/(landing)/abierto/abierto.css` (tighten paddings / cap list only if content clips)

- [ ] **Step 1: Start dev and render the splash solid**

Run: `npm run dev` then open `http://localhost:3000/abierto?view=abierto` (the QA param renders the splash solid, no rotation, no time-gate).

- [ ] **Step 2: Screenshot and inspect at 1080×1920**

Capture the rendered slide (browser at 1080×1920, or the Chrome MCP). **Read the exported PNG** (per memory `feedback_paper_export_verification` — screenshots lie about crop). Verify:
  - Hero medallion shows the Espresso Tropical photo; caption "№ 01 · CAFÉ DE AUTOR" + live name.
  - § Café de autor block lists all three signatures (Espresso Tropical, Tierra & Hierbas, Pre-Infusion) with descriptions + prices; numerals in ochre; no second green.
  - Destacados row shows exactly two centered medallions (Tierra & Hierbas + Bagel).
  - §01 Cafetería shows the live coffee list (no Autor duplicates), §02 Acompaña unchanged.
  - Hero line reads "…barra de autor, un rato a la deriva." (no "sin apuro").
  - Nothing clips past the 1920px stage bottom (colophon fully visible).

- [ ] **Step 3: Height-fit tuning (only if clipping)**

If content overflows 1920px, tighten in this order (smallest visual cost first): reduce `resolveCafeteriaNames` cap from 7 → 6 (Task 1) OR reduce `.ab-autor` / `.ab-esp` vertical `padding` by ~8px, OR drop `.ab-autor__desc` font-size 22 → 20. Re-render and re-check. Commit any change:

```bash
git add "app/(landing)/abierto/abierto.css" "app/(landing)/abierto/page.tsx"
git commit -m "fix(abierto): fit reshaped splash within 1080×1920"
```

- [ ] **Step 4: Verify build-time fallback**

Run: `npm run build` (backend unreachable during prerender → `getPublicMenuView` returns null). Expected: build succeeds; the slide renders with curated Autor fallbacks and the `menu.ts` Cafetería fallback (no crash, no empty block). If the build errors on the `/abierto` route, fix before proceeding.

- [ ] **Step 5: Paper mock for approval (deploy gate)**

Per `feedback_paper_first_workflow.md`: open the Paper file → Web page, duplicate the existing Abierto splash artboard (mirrors 7TJ-0), and reproduce the reshaped composition (Café de autor hero + § block + two medallions) at 1080×1920. Export and present to the founder for explicit visual approval. **Do not run `vercel deploy` until approved.**

- [ ] **Step 6: Update memory**

Update `reference_abierto_signage_rotation.md` (and `MEMORY.md` if the hook changes): note the splash now features Café de autor live from the backend (name-matched Tropical/Tierra/Pre-Infusion + Bagel), §01 Cafetería is live, and the hardcoded Pour Over/Kasler/Italiana medallions were retired.

---

## Self-Review

**Spec coverage:**
- Live data / name-match + fallback → Task 1 ✓
- Café de Autor as star (hero + § block, Pre-Infusion type-only) → Task 2 Steps 2–3 ✓
- Two medallions (Tierra & Hierbas + Bagel) → Task 2 Step 4 ✓
- Live §01 Cafetería, §02 Acompaña from menu.ts → Task 2 Step 5 ✓
- "sin apuro" fix → Task 2 Step 2 ✓
- No new photography (espresso-tropical/filtrado/bagel-churrasco exist) → verified in Task 2 markup ✓
- CSS single-green preserved → Task 3 (ochre/ink only) + Global Constraints ✓
- Build-time fallback → Task 4 Step 4 ✓
- Paper-first deploy gate → Task 4 Step 5 ✓
- Out of scope (other views, dead Inauguración) → Global Constraints ✓

**Placeholder scan:** none — all code, class names, prices, and copy are concrete.

**Type consistency:** `AutorItem`, `resolveAutorItems`, `resolveCafeteriaNames`, `findItemByName`, `livePrice` names match between Task 1 (definition) and Task 2 (use). `PublicMenuItem` fields used (`name`, `available`, `price_label`, `price_clp`, `description`) all verified present in `schema.ts:4533`. `.ab-autor*` / `.ab-trio--pair` classes match between Task 2 markup and Task 3 CSS.
