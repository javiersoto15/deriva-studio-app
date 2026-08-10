# Menú Ejecutivo Carta Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align `/menu-ejecutivo` with the existing `/menu` Carta typography and design while preserving its focused SEO route and API-driven daily edition.

**Architecture:** Import the Carta CSS module alongside the small executive-page module and compose the existing Carta shell, masthead, insert, course and action primitives in `ExecutiveMenuBody`. Keep executive-only CSS only for the focused landing layout and responsive placement. Do not modify the Carta route or duplicate its interactive language/theme controls.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Node test runner, Paper Desktop.

---

### Task 1: Lock the Carta-alignment contract with failing tests

**Files:**
- Modify: `tests/seo/executive-menu-page.test.ts`

**Step 1: Write the failing tests**

Add source-contract assertions that require:

- `ExecutiveMenuBody.tsx` imports `../../menu/carta.module.css`.
- The body composes Carta shell/masthead/insert/course styles rather than defining a visually independent shell.
- The primary action has the exact text `Ver el menú` and `href="/menu"`.
- The page does not introduce the Carta theme toggle or locale controls.

**Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test:seo -- tests/seo/executive-menu-page.test.ts
```

Expected: the new Carta-style import/composition and CTA assertions fail against the current independent implementation.

**Step 3: Commit only after the production implementation turns the test green**

Do not commit a permanently red test.

### Task 2: Recompose the landing page with Carta primitives

**Files:**
- Modify: `app/(landing)/menu-ejecutivo/_components/ExecutiveMenuBody.tsx`
- Modify: `app/(landing)/menu-ejecutivo/page.tsx`
- Modify: `app/(landing)/menu-ejecutivo/menu-ejecutivo.module.css`
- Test: `tests/seo/executive-menu-page.test.ts`

**Step 1: Compose Carta styles in the component**

Import both modules:

```tsx
import cartaStyles from "../../menu/carta.module.css";
import styles from "../menu-ejecutivo.module.css";
```

Use the Carta `shell`, `page`, `masthead`, metadata, masthead-title/lede/note, `insert`, `insertTop`, `insertHead`, `courses`, `course`, numbered-lane, price and action vocabulary. Keep semantic heading levels, ordered course list and live API values unchanged.

**Step 2: Simplify executive-only CSS**

Retain only layout glue that the Carta does not provide:

- fixed dark shell integration beneath `SiteNav`;
- focused page width and two-column desktop layout;
- responsive one-column layout;
- safe fallback, address/actions and focus-visible behavior.

Delete duplicated independent palette and typography rules that now come from the Carta module.

**Step 3: Update the CTA copy**

Use:

```tsx
<Link href="/menu">Ver el menú</Link>
```

Keep `Cómo llegar` unchanged.

**Step 4: Run focused test and verify GREEN**

Run:

```bash
npm run test:seo -- tests/seo/executive-menu-page.test.ts
```

Expected: all focused tests pass.

**Step 5: Run full verification**

Run:

```bash
npm run test:seo
npm run typecheck
npm run build
git diff --check
```

Expected: 0 failures and successful production build; existing unrelated Next/Sentry warnings may remain.

**Step 6: Commit**

```bash
git add 'app/(landing)/menu-ejecutivo' tests/seo/executive-menu-page.test.ts
git commit -m "feat(menu): align executive landing with carta"
```

### Task 3: Render, refresh Paper and review

**Files:**
- No repository source changes unless verification finds a real defect.
- Update the existing Paper page `Web · SEO GEO Approval · 10 Aug 2026`.

**Step 1: Render responsive proofs**

Run a local production server and capture `/menu` plus `/menu-ejecutivo` at 1440×900, 430×932, 390×844, 375×812 and 320×568. Confirm the executive landing uses the same Carta type/palette/row vocabulary and has no clipping.

**Step 2: Refresh Paper**

Using `paper-desktop:code-to-design`, update only the two Menú Ejecutivo artboards to match the implemented Carta alignment. Preserve exact dimensions, verified live edition data and the `VER EL MENÚ` CTA. Screenshot-review meaningful changes and call `finish_working_on_nodes`.

**Step 3: Run independent reviews**

Dispatch a specification reviewer, then a quality reviewer. Resolve every Critical or Important finding with the same implementer and re-review.

**Step 4: Final verification**

Re-run the full SEO suite, typecheck, build, `git diff --check` and worktree status before reporting completion. Do not deploy without explicit user approval.
