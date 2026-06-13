# La Polla del Mundial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public World Cup exact-score prediction wizard (`derivastudio.cl/mundial`) and the PIN-gated staff campaign-reward validation/redemption tool (`admin.derivastudio.cl/redemptions`).

**Architecture:** Browser never calls Cloud Run directly — Next.js **server actions are the trust boundary** (mirrors `/resenas` and `/match-up`). Server-only typed fetchers (`src/api/*`) hit the Go backend; the public side is unauthenticated, the staff side attaches a server-held bearer token behind a `staffBearerToken()` seam and is gated by the existing Match Up PIN cookie. Full design: `docs/superpowers/specs/2026-06-12-mundial-polla-predictor-design.md`.

**Tech Stack:** Next.js 16 (App Router, Cache Components/PPR), React 19, TypeScript, server actions, `useActionState`, page-scoped CSS using the editorial design tokens in `app/globals.css`.

**Verification model:** This repo has **no JS test runner** (no `test` script in `package.json`). Per `AGENTS.md`, verification is `npm run typecheck`, `npm run build`, and dev-server inspection. Each task ends with typecheck + a concrete manual check + a commit. Do **not** add a test framework.

**Paper-first gate:** Per `AGENTS.md` + `feedback_paper_first_workflow.md`, after the code renders, port every state to Paper (mobile 390×844 + desktop 1440×900) and get explicit user approval **before any `vercel` deploy**. Task C1 covers this.

---

## File structure

| File | Responsibility |
|---|---|
| `src/api/world-cup.ts` | server-only fetchers: get today's slate, submit predictions. Hand-typed envelopes + discriminated results (pattern: `src/api/match-up.ts`). |
| `src/server/world-cup.ts` | `submitPollaAction` server action: honeypot + timing + throttle + email normalize, maps backend results to UI states. |
| `app/(landing)/mundial/page.tsx` | server component: fetch slate (`no-store`) inside `<Suspense>`, route to the right state shell. |
| `app/(landing)/mundial/_components/PollaWizard.tsx` | client wizard: cover → per-match steppers → review+email → submitted. |
| `app/(landing)/mundial/mundial.css` | page-scoped editorial styles. |
| `src/server/staff-token.ts` | `staffBearerToken()` — reads `BACKEND_STAFF_TOKEN`. |
| `src/api/campaign-rewards.ts` | server-only fetchers: validate + redeem reward, with bearer auth. |
| `src/server/campaign-rewards.ts` | `lookupRewardAction` / `redeemRewardAction`, gated by `isStaffUnlocked()`. |
| `app/(admin)/redemptions/page.tsx` | manual-entry entry point, PIN-gated. |
| `app/(admin)/redemptions/[code]/page.tsx` | token-from-URL entry point, PIN-gated, pre-validates. |
| `app/(admin)/redemptions/_components/RewardValidator.tsx` | client validate/redeem card with status states. |
| `app/(admin)/redemptions/redemptions.css` | page-scoped staff-tool styles. |
| `src/middleware/host.ts` | add `/mundial` to `LANDING_PREFIXES`. |
| `app/sitemap.ts` | add `/mundial`. |
| `.env.example` | document `BACKEND_STAFF_TOKEN`. |

---

# PHASE A — Public `/mundial`

## Task A1: Routing + types groundwork

**Files:**
- Modify: `src/middleware/host.ts` (LANDING_PREFIXES)
- Modify: `app/sitemap.ts`
- Modify: `src/api/schema.ts` (regenerated)

- [ ] **Step 1: Add `/mundial` to the landing allowlist**

In `src/middleware/host.ts`, add `"/mundial"` to the `LANDING_PREFIXES` array (place it after `"/deriva-match-up"`):

```ts
const LANDING_PREFIXES = [
  "/menu",
  "/menu-display",
  "/abierto",
  "/sala",
  "/privacidad",
  "/resenas",
  "/deriva-match-up",
  "/mundial",
  "/unsubscribe",
  "/companion"
] as const;
```

- [ ] **Step 2: Add `/mundial` to the sitemap**

Open `app/sitemap.ts`, find the array of route entries, and add an entry mirroring the existing `/resenas` entry's shape (use the same `changeFrequency`/`priority` fields that file already uses):

```ts
{
  url: `${siteUrl}/mundial`,
  lastModified: new Date(),
  changeFrequency: "daily",
  priority: 0.6
},
```

(Match the exact field names/spelling already present in `app/sitemap.ts`; if it uses a helper, follow that.)

- [ ] **Step 3: Regenerate API types**

Run: `npm run api:types`
Expected: `src/api/schema.ts` rewrites with no errors; `git diff` shows new `WorldCupDay`, `WorldCupMatch`, `CampaignReward` schema entries.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add src/middleware/host.ts app/sitemap.ts src/api/schema.ts
git commit -m "feat(mundial): route + sitemap + regen API types"
```

---

## Task A2: Server-only fetchers — `src/api/world-cup.ts`

**Files:**
- Create: `src/api/world-cup.ts`

- [ ] **Step 1: Write the fetcher module**

Create `src/api/world-cup.ts` with the full contents below. It mirrors `src/api/match-up.ts`: hand-typed envelopes, never throws on transport, returns discriminated results.

```ts
import "server-only";

// Typed client for the public World Cup predictor campaign endpoints.
//
// BACKEND CONTRACT (source of truth: 13_companion_backend/docs/openapi.yaml):
//   GET  /public/campaigns/world-cup-predictor/matches/today  (public, no auth)
//        200 → WorldCupDay ; 404 → no campaign today
//   POST /public/campaigns/world-cup-predictor/submissions    (public, no auth)
//        201 → WorldCupSubmission
//        400 → invalid (bad email / incomplete predictions / negative score)
//        409 → this email already submitted for today's campaign date
//        410 → submissions closed for the day
//
// Like src/api/match-up.ts, this never throws on transport/HTTP failure — it
// returns typed discriminated results the server action maps to calm UI copy.
// The email travels only inside the request body and is never logged here.

function resolveBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

// ----- Domain types (match the OpenAPI schemas) -----------------------------
export type WorldCupMatch = {
  match_id: string;
  campaign_id: string;
  match_date: string;
  kickoff_at: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  finalized_at?: string;
  submissions_open: boolean;
};

export type WorldCupDay = {
  campaign_id: string;
  campaign_date: string;
  submission_open: boolean;
  closes_at: string;
  matches: WorldCupMatch[];
};

export type WorldCupPrediction = {
  match_id: string;
  home_score: number;
  away_score: number;
};

export type WorldCupSubmissionRequest = {
  email: string;
  predictions: WorldCupPrediction[];
};

export type WorldCupSubmission = {
  id: string;
  campaign_id: string;
  campaign_date: string;
  email: string;
  status: "pending" | "won" | "lost";
  reward_id?: string;
  submitted_at: string;
  predictions: WorldCupPrediction[];
};

// ----- Results --------------------------------------------------------------
export type TodaySlateResult =
  | { ok: true; day: WorldCupDay }
  | { ok: false; kind: "empty"; status: number } // 404 — no campaign today
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

export type SubmitPollaResult =
  | { ok: true; submission: WorldCupSubmission }
  | { ok: false; kind: "duplicate"; status: number; message?: string } // 409
  | { ok: false; kind: "closed"; status: number; message?: string } // 410
  | { ok: false; kind: "validation"; status: number; message?: string } // 400
  | { ok: false; kind: "rate_limited"; status: number; message?: string } // 429
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

const REQUEST_TIMEOUT_MS = 8000;

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}

/** GET today's slate. 404 → typed `empty`, not an error. */
export async function getTodaySlate(init?: {
  signal?: AbortSignal;
}): Promise<TodaySlateResult> {
  const url = `${resolveBaseUrl()}/public/campaigns/world-cup-predictor/matches/today`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store"
    });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const day = (await res.json()) as WorldCupDay;
      return { ok: true, day };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  if (res.status === 404) {
    return { ok: false, kind: "empty", status: res.status };
  }
  return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
}

/** POST a full-slate submission. Never throws; maps 400/409/410 to typed kinds. */
export async function submitPredictions(
  body: WorldCupSubmissionRequest,
  init?: { signal?: AbortSignal }
): Promise<SubmitPollaResult> {
  const url = `${resolveBaseUrl()}/public/campaigns/world-cup-predictor/submissions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store"
    });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const submission = (await res.json()) as WorldCupSubmission;
      return { ok: true, submission };
    } catch {
      // 2xx with unreadable body — the submission was created; synthesize a minimal envelope.
      return { ok: true, submission: { id: "", campaign_id: "", campaign_date: "", email: body.email, status: "pending", submitted_at: "", predictions: body.predictions } };
    }
  }

  const message = await safeErrorMessage(res);
  switch (res.status) {
    case 409:
      return { ok: false, kind: "duplicate", status: res.status, message };
    case 410:
      return { ok: false, kind: "closed", status: res.status, message };
    case 400:
    case 422:
      return { ok: false, kind: "validation", status: res.status, message };
    case 429:
      return { ok: false, kind: "rate_limited", status: res.status, message };
    default:
      return { ok: false, kind: "server", status: res.status, message };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/world-cup.ts
git commit -m "feat(mundial): server-only world-cup fetchers"
```

---

## Task A3: Submission server action — `src/server/world-cup.ts`

**Files:**
- Create: `src/server/world-cup.ts`

- [ ] **Step 1: Write the server action**

Create `src/server/world-cup.ts`. Mirrors `src/server/match-up.ts`: honeypot + render-timestamp gate + per-process throttle, then a clean typed payload to the fetcher. Predictions arrive as a JSON string in a hidden field.

```ts
"use server";

import {
  submitPredictions,
  type WorldCupPrediction,
  type WorldCupSubmissionRequest
} from "../api/world-cup";

// Server action behind the Polla wizard. The browser posts here, never to
// Cloud Run directly, so the backend host stays server-side and CORS is moot.
// Email is normalized + validated here; it is NEVER logged or echoed back in a
// way that leaks beyond the success state's own `email`.

export type PollaFormState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "duplicate" }
  | { status: "closed" }
  | { status: "error"; message: string };

const MIN_FILL_MS = 2500; // bots submit instantly; a human reads + taps steppers.
const MAX_PREDICTIONS = 32; // sanity bound on a single day's slate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY = {
  generic: "No pudimos registrar tu polla. Inténtalo de nuevo en un momento.",
  rateLimited: "Recibimos varios intentos. Dale un respiro e inténtalo más tarde.",
  spam: "No pudimos validar tu envío. Vuelve a intentarlo.",
  email: "Revisa tu correo — lo necesitamos para avisarte si ganas.",
  predictions: "Faltan marcadores. Vuelve atrás y completa todos los partidos."
} as const;

// Light per-process throttle keyed by normalized email. Backend is authoritative.
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function throttle(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(key, hits);
    return false;
  }
  hits.push(now);
  recent.set(key, hits);
  return true;
}

function str(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function parsePredictions(raw: string): WorldCupPrediction[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_PREDICTIONS) {
    return null;
  }
  const out: WorldCupPrediction[] = [];
  for (const p of parsed) {
    if (typeof p !== "object" || p === null) return null;
    const o = p as Record<string, unknown>;
    if (typeof o.match_id !== "string" || o.match_id.length === 0) return null;
    const h = Number(o.home_score);
    const a = Number(o.away_score);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 99 || a > 99) {
      return null;
    }
    out.push({ match_id: o.match_id, home_score: h, away_score: a });
  }
  return out;
}

export async function submitPollaAction(
  _previous: PollaFormState,
  formData: FormData
): Promise<PollaFormState> {
  // 1) Honeypot — real users never see/fill `company`.
  if (str(formData, "company").length > 0) {
    return { status: "error", message: COPY.spam };
  }

  // 2) Timing gate.
  const renderStarted = Number(str(formData, "render_started"));
  if (Number.isFinite(renderStarted) && renderStarted > 0) {
    if (Date.now() - renderStarted < MIN_FILL_MS) {
      return { status: "error", message: COPY.spam };
    }
  }

  // 3) Email.
  const email = str(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { status: "error", message: COPY.email };
  }

  // 4) Predictions.
  const predictions = parsePredictions(str(formData, "predictions"));
  if (!predictions) {
    return { status: "error", message: COPY.predictions };
  }

  // 5) Throttle (best-effort; backend authoritative). Key never leaves process.
  if (!throttle(email)) {
    return { status: "error", message: COPY.rateLimited };
  }

  const payload: WorldCupSubmissionRequest = { email, predictions };
  const result = await submitPredictions(payload);

  if (result.ok) {
    return { status: "success", email };
  }
  switch (result.kind) {
    case "duplicate":
      return { status: "duplicate" };
    case "closed":
      return { status: "closed" };
    case "rate_limited":
      return { status: "error", message: COPY.rateLimited };
    case "validation":
      return { status: "error", message: result.message ?? COPY.generic };
    default:
      console.error("[mundial] submit failed:", result.kind);
      return { status: "error", message: COPY.generic };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/server/world-cup.ts
git commit -m "feat(mundial): submission server action with anti-abuse"
```

---

## Task A4: Page-scoped styles — `app/(landing)/mundial/mundial.css`

**Files:**
- Create: `app/(landing)/mundial/mundial.css`

- [ ] **Step 1: Write the stylesheet**

Create `app/(landing)/mundial/mundial.css`. Uses the editorial tokens already defined in `app/globals.css` (`--paper`, `--ink`, `--muted`, `--green`, `--copper`, `--display`, `--mono`). Single green moment = the winning-claim word and the active stepper numeral context; everything else ink/copper on paper.

```css
/* La Polla del Mundial — page-scoped editorial styles. */
.polla {
  min-height: 100svh;
  background: var(--paper);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px 48px;
}
.polla__rail {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
}

/* Edition mast */
.polla__mast {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}
.polla__mast-tick { flex: 1; height: 1px; background: var(--copper); opacity: 0.6; }

.polla__title {
  font-family: var(--display);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(34px, 9vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 18px 0 8px;
}
.polla__title em { font-style: normal; color: var(--green); }

.polla__rules {
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--muted);
  border-top: 1px solid var(--copper);
  border-bottom: 1px solid var(--copper);
  padding: 14px 0;
  margin: 12px 0 20px;
}
.polla__rules b { color: var(--ink); font-weight: 600; }

.polla__slug {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 14px;
}
.polla__slug-rule { width: 28px; height: 1px; background: var(--copper); }

/* Match step */
.polla__progress {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
}
.polla__kickoff {
  font-family: var(--mono); font-size: 12px; color: var(--muted); margin-bottom: 22px;
}
.polla__fixture {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 12px;
}
.polla__team {
  font-family: var(--display);
  font-size: clamp(20px, 6vw, 28px);
  line-height: 1.1;
  text-align: center;
  min-width: 0;
  overflow-wrap: anywhere;
}
.polla__vs {
  font-family: var(--mono); font-size: 12px; color: var(--muted);
  align-self: center; text-transform: uppercase; letter-spacing: 0.1em;
}

/* Stepper */
.polla__stepper {
  display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 14px;
}
.polla__score {
  font-family: var(--mono);
  font-size: clamp(40px, 12vw, 64px);
  line-height: 1; font-variant-numeric: tabular-nums; color: var(--ink);
}
.polla__stepper-btns { display: flex; gap: 12px; }
.polla__step-btn {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1.5px solid var(--copper); background: transparent; color: var(--ink);
  font-size: 22px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 120ms ease, transform 90ms ease;
}
.polla__step-btn:active { transform: scale(0.96); }
.polla__step-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.polla__step-btn:not(:disabled):hover { background: rgba(201,165,122,0.18); }

/* Nav + CTA */
.polla__nav { display: flex; gap: 12px; margin-top: 32px; }
.polla__btn {
  flex: 1; border: none; border-radius: 999px; padding: 15px 20px;
  font-family: var(--mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
  cursor: pointer; transition: opacity 120ms ease, transform 90ms ease;
}
.polla__btn:active { transform: scale(0.99); }
.polla__btn--primary { background: var(--green); color: var(--paper); }
.polla__btn--ghost { background: transparent; color: var(--ink); border: 1.5px solid var(--copper); }
.polla__btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Review list */
.polla__review-row {
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px;
  padding: 12px 0; border-bottom: 1px solid rgba(201,165,122,0.4);
}
.polla__review-teams { font-family: var(--display); font-size: 17px; }
.polla__review-score {
  font-family: var(--mono); font-size: 18px; font-variant-numeric: tabular-nums;
  background: none; border: none; color: var(--green); cursor: pointer; text-decoration: underline;
}
.polla__field { margin: 22px 0 8px; display: flex; flex-direction: column; gap: 8px; }
.polla__label {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
}
.polla__input {
  font-family: var(--mono); font-size: 16px; padding: 13px 14px;
  border: 1.5px solid var(--copper); border-radius: 10px; background: #fff; color: var(--ink);
}
.polla__input:focus { outline: none; border-color: var(--green); }
.polla__input[aria-invalid="true"] { border-color: #9a3412; }
.polla__consent { font-family: var(--mono); font-size: 11px; line-height: 1.6; color: var(--muted); }
.polla__consent a { color: var(--green); }
.polla__error { font-family: var(--mono); font-size: 12px; color: #9a3412; margin-top: 6px; }

/* Honeypot — visually hidden, off-screen, not display:none (some bots skip those). */
.polla__hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

/* Terminal states (submitted / empty / closed) */
.polla__terminal { text-align: center; padding-top: 8vh; }
.polla__terminal-eyebrow {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
}
.polla__terminal-title {
  font-family: var(--display); font-style: italic; font-size: clamp(28px, 8vw, 44px);
  line-height: 1.05; margin: 14px 0; letter-spacing: -0.02em;
}
.polla__terminal-title em { font-style: normal; color: var(--green); }
.polla__terminal-body { font-family: var(--mono); font-size: 14px; line-height: 1.7; color: var(--muted); }
.polla__colophon {
  margin-top: 32px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--muted);
}
.polla__skeleton {
  height: 220px; border-radius: 14px; margin-top: 24px;
  background: linear-gradient(90deg, rgba(201,165,122,0.12), rgba(201,165,122,0.22), rgba(201,165,122,0.12));
  background-size: 200% 100%; animation: polla-shimmer 1.4s ease-in-out infinite;
}
@keyframes polla-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .polla__skeleton { animation: none; } }
```

- [ ] **Step 2: Commit** (CSS-only; typecheck not affected)

```bash
git add "app/(landing)/mundial/mundial.css"
git commit -m "feat(mundial): page-scoped editorial styles"
```

---

## Task A5: Server page shell — `app/(landing)/mundial/page.tsx`

**Files:**
- Create: `app/(landing)/mundial/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/(landing)/mundial/page.tsx`. Server component: fetches the slate inside `<Suspense>` (Cache Components requires uncached dynamic reads to live in a boundary), then routes to the wizard or a terminal state. Includes the standalone metadata + `SiteNav`.

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { getTodaySlate } from "../../../src/api/world-cup";
import { PollaWizard } from "./_components/PollaWizard";
import { getEditionMark } from "../../../src/lib/edition";
import "./mundial.css";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/mundial`;
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";

export const metadata: Metadata = {
  title: "La Polla del Mundial",
  description:
    "Cacha el marcador exacto de los partidos de hoy. Si le achuntas a todos, te ganas un café gratis en Deriva Coffee Studio para mañana.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "La Polla del Mundial · Deriva Coffee Studio",
    description: "Predice los marcadores de hoy. Exacto gana café.",
    url: pageUrl,
    type: "website"
  }
};

export default function MundialPage() {
  return (
    <div className="polla-shell">
      <SiteNav active="mundial" variant="solid" />
      <main className="polla" aria-labelledby="polla-title">
        <Suspense fallback={<PollaSkeleton />}>
          <PollaSlate />
        </Suspense>
      </main>
    </div>
  );
}

function PollaSkeleton() {
  return (
    <div className="polla__rail">
      <div className="polla__mast">
        <span>{getEditionMark()}</span>
        <span className="polla__mast-tick" />
        <span>La Polla</span>
      </div>
      <div className="polla__skeleton" />
    </div>
  );
}

async function PollaSlate() {
  const result = await getTodaySlate();
  const edition = getEditionMark();

  // No campaign today (404) or transport failure → calm empty state.
  if (!result.ok) {
    if (result.kind === "empty") {
      return (
        <Terminal
          edition={edition}
          eyebrow="La Polla del Mundial"
          title={<>Hoy no <em>corre</em> la polla.</>}
          body="No hay partidos para predecir hoy. Vuelve el próximo día de Mundial — lo anunciamos en Instagram."
          ig
        />
      );
    }
    return (
      <Terminal
        edition={edition}
        eyebrow="La Polla del Mundial"
        title={<>Volvemos <em>al toque</em>.</>}
        body="No pudimos cargar los partidos de hoy. Refresca en un momento."
      />
    );
  }

  const { day } = result;

  if (!day.submission_open) {
    return (
      <Terminal
        edition={edition}
        eyebrow="La Polla del Mundial"
        title={<>La polla de hoy ya <em>cerró</em>.</>}
        body="Las predicciones se cierran con el primer pitazo del día. Te esperamos en la próxima jornada."
      />
    );
  }

  return <PollaWizard day={day} edition={edition} />;
}

function Terminal({
  edition,
  eyebrow,
  title,
  body,
  ig
}: {
  edition: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  ig?: boolean;
}) {
  return (
    <div className="polla__rail">
      <div className="polla__mast">
        <span>{edition}</span>
        <span className="polla__mast-tick" />
        <span>La Polla</span>
      </div>
      <div className="polla__terminal">
        <p className="polla__terminal-eyebrow">{eyebrow}</p>
        <h1 id="polla-title" className="polla__terminal-title">{title}</h1>
        <p className="polla__terminal-body">{body}</p>
        {ig && (
          <p className="polla__colophon">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@deriva.coffee.studio</a>
          </p>
        )}
        <p className="polla__colophon">Magnere 1570 · Providencia</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `SiteNav` accepts the `active="mundial"` prop**

Open `src/components/landing/SiteNav.tsx`. If its `active` prop is a constrained union (e.g. `"resenas" | "menu" | ...`), add `"mundial"` to that union. If it's a free `string`, no change needed.

Run: `npm run typecheck`
Expected: PASS. If it fails on the `active` prop type, widen the union as above and re-run.

- [ ] **Step 3: Commit**

```bash
git add "app/(landing)/mundial/page.tsx" src/components/landing/SiteNav.tsx
git commit -m "feat(mundial): server page shell with slate states"
```

---

## Task A6: The wizard — `app/(landing)/mundial/_components/PollaWizard.tsx`

**Files:**
- Create: `app/(landing)/mundial/_components/PollaWizard.tsx`

- [ ] **Step 1: Write the client wizard**

Create `app/(landing)/mundial/_components/PollaWizard.tsx`. Holds per-match score state, walks cover → steps → review+email → submitted, and posts via `useActionState(submitPollaAction)`. Scores default 0–0; the wizard makes the user pass through every match.

```tsx
"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitPollaAction, type PollaFormState } from "../../../../src/server/world-cup";
import type { WorldCupDay } from "../../../../src/api/world-cup";

const initialState: PollaFormState = { status: "idle" };
const MAX_SCORE = 19;

type Scores = Record<string, { home: number; away: number }>;

function kickoffLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function PollaWizard({ day, edition }: { day: WorldCupDay; edition: string }) {
  const [state, formAction] = useActionState(submitPollaAction, initialState);
  const renderStarted = useRef(Date.now());

  const matches = day.matches;
  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(matches.map((m) => [m.match_id, { home: 0, away: 0 }]))
  );
  // step: -1 = cover, 0..M-1 = match steps, M = review
  const [step, setStep] = useState(-1);

  const predictionsJson = useMemo(
    () =>
      JSON.stringify(
        matches.map((m) => ({
          match_id: m.match_id,
          home_score: scores[m.match_id].home,
          away_score: scores[m.match_id].away
        }))
      ),
    [matches, scores]
  );

  if (state.status === "success") {
    return <Submitted email={state.email} edition={edition} />;
  }
  if (state.status === "duplicate") {
    return (
      <Terminal
        edition={edition}
        title={<>Este correo ya <em>jugó</em> hoy.</>}
        body="Solo una polla por correo al día. Si quieres corregir, vuelve mañana con la próxima jornada."
      />
    );
  }
  if (state.status === "closed") {
    return (
      <Terminal
        edition={edition}
        title={<>La polla se <em>cerró</em>.</>}
        body="Las predicciones se cerraron con el primer pitazo. Nos vemos en la próxima jornada."
      />
    );
  }

  const setScore = (id: string, side: "home" | "away", delta: number) =>
    setScores((s) => {
      const next = Math.min(MAX_SCORE, Math.max(0, s[id][side] + delta));
      return { ...s, [id]: { ...s[id], [side]: next } };
    });

  const closes = kickoffLabel(day.closes_at);

  // ----- Cover -----
  if (step === -1) {
    return (
      <div className="polla__rail">
        <Mast edition={edition} />
        <h1 id="polla-title" className="polla__title">
          La Polla <em>del Mundial.</em>
        </h1>
        <div className="polla__rules">
          Predice el <b>marcador exacto</b> de los <b>{matches.length} partidos</b> de hoy.
          Si le achuntas a <b>todos</b>, te llega un <b>café gratis</b> al correo para mañana.
          {closes && <> Cierra a las <b>{closes}</b>.</>}
        </div>
        <button type="button" className="polla__btn polla__btn--primary" onClick={() => setStep(0)}>
          Empezar
        </button>
      </div>
    );
  }

  // ----- Review + email -----
  if (step >= matches.length) {
    const error = state.status === "error" ? state.message : undefined;
    return (
      <div className="polla__rail">
        <Mast edition={edition} />
        <div className="polla__slug">
          <span className="polla__slug-rule" />
          <span>§ Revisa tu polla</span>
        </div>
        {matches.map((m, i) => (
          <div className="polla__review-row" key={m.match_id}>
            <span className="polla__review-teams">{m.home_team} vs {m.away_team}</span>
            <button type="button" className="polla__review-score" onClick={() => setStep(i)}>
              {scores[m.match_id].home}–{scores[m.match_id].away}
            </button>
          </div>
        ))}

        <form action={formAction} noValidate>
          <input type="hidden" name="predictions" value={predictionsJson} />
          <input type="hidden" name="render_started" value={renderStarted.current} />
          <div className="polla__hp" aria-hidden="true">
            <label htmlFor="polla-company">No llenar</label>
            <input id="polla-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="polla__field">
            <label className="polla__label" htmlFor="polla-email">Tu correo</label>
            <input
              id="polla-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="hincha@correo.cl"
              className="polla__input"
              aria-invalid={Boolean(error)}
            />
            <p className="polla__consent">
              Lo usamos solo para avisarte si ganas. Lee cómo cuidamos tus datos en{" "}
              <a href="/privacidad">privacidad</a>.
            </p>
            {error && <p className="polla__error" role="alert">{error}</p>}
          </div>

          <div className="polla__nav">
            <button
              type="button"
              className="polla__btn polla__btn--ghost"
              onClick={() => setStep(matches.length - 1)}
            >
              Atrás
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    );
  }

  // ----- Match step -----
  const m = matches[step];
  const s = scores[m.match_id];
  const kickoff = kickoffLabel(m.kickoff_at);
  return (
    <div className="polla__rail">
      <Mast edition={edition} />
      <p className="polla__progress">Partido {step + 1} de {matches.length}</p>
      {kickoff && <p className="polla__kickoff">Pitazo {kickoff}</p>}

      <div className="polla__fixture">
        <Stepper
          team={m.home_team}
          value={s.home}
          onDec={() => setScore(m.match_id, "home", -1)}
          onInc={() => setScore(m.match_id, "home", +1)}
        />
        <span className="polla__vs">vs</span>
        <Stepper
          team={m.away_team}
          value={s.away}
          onDec={() => setScore(m.match_id, "away", -1)}
          onInc={() => setScore(m.match_id, "away", +1)}
        />
      </div>

      <div className="polla__nav">
        <button
          type="button"
          className="polla__btn polla__btn--ghost"
          onClick={() => setStep(step - 1)}
        >
          Atrás
        </button>
        <button
          type="button"
          className="polla__btn polla__btn--primary"
          onClick={() => setStep(step + 1)}
        >
          {step + 1 === matches.length ? "Revisar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}

function Stepper({
  team,
  value,
  onDec,
  onInc
}: {
  team: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div>
      <p className="polla__team">{team}</p>
      <div className="polla__stepper">
        <span className="polla__score" aria-live="polite">{value}</span>
        <div className="polla__stepper-btns">
          <button
            type="button"
            className="polla__step-btn"
            onClick={onDec}
            disabled={value <= 0}
            aria-label={`Menos un gol para ${team}`}
          >
            −
          </button>
          <button
            type="button"
            className="polla__step-btn"
            onClick={onInc}
            disabled={value >= MAX_SCORE}
            aria-label={`Un gol más para ${team}`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="polla__btn polla__btn--primary" disabled={pending}>
      {pending ? "Enviando…" : "Enviar mi polla"}
    </button>
  );
}

function Mast({ edition }: { edition: string }) {
  return (
    <div className="polla__mast">
      <span>{edition}</span>
      <span className="polla__mast-tick" />
      <span>La Polla</span>
    </div>
  );
}

function Submitted({ email, edition }: { email: string; edition: string }) {
  return (
    <div className="polla__rail">
      <Mast edition={edition} />
      <div className="polla__terminal">
        <p className="polla__terminal-eyebrow">La Polla del Mundial</p>
        <h1 className="polla__terminal-title">Tu polla quedó <em>marcada.</em></h1>
        <p className="polla__terminal-body">
          Si le achuntas a todos los marcadores de hoy, te llega un café gratis a{" "}
          <strong>{email}</strong> para mañana. Revisa tu correo después de los partidos.
        </p>
        <p className="polla__colophon">Magnere 1570 · Providencia</p>
      </div>
    </div>
  );
}

function Terminal({
  edition,
  title,
  body
}: {
  edition: string;
  title: React.ReactNode;
  body: string;
}) {
  return (
    <div className="polla__rail">
      <Mast edition={edition} />
      <div className="polla__terminal">
        <p className="polla__terminal-eyebrow">La Polla del Mundial</p>
        <h1 className="polla__terminal-title">{title}</h1>
        <p className="polla__terminal-body">{body}</p>
        <p className="polla__colophon">Magnere 1570 · Providencia</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(landing)/mundial/_components/PollaWizard.tsx"
git commit -m "feat(mundial): prediction wizard (cover, steppers, review, submitted)"
```

---

## Task A7: Public surface verification

**Files:** none (verification only)

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: PASS, `/mundial` listed in the route output.

- [ ] **Step 2: Run the backend + dev server**

Terminal 1: `cd ../13_companion_backend && make api-up-memory`
Terminal 2 (from `10_webapp`): `npm run dev`
Confirm slate: `curl http://localhost:8080/public/campaigns/world-cup-predictor/matches/today`

- [ ] **Step 3: Manual state matrix**

Visit `http://localhost:3000/mundial` and verify:
- Cover shows edition mast + rules + "Empezar".
- Each match step shows two team names + −/＋ steppers; − disabled at 0.
- Review lists all matches; tapping a score returns to that match.
- Submitting with a valid email → "Tu polla quedó marcada." echoing the email.
- Submitting the same email again → "Este correo ya jugó hoy" (409 path) — if the in-memory backend dedups.
- Bad email → inline "Revisa tu correo".
- No horizontal scroll at widths 320 / 375 / 390 / 430 (dev tools responsive).

- [ ] **Step 4: Commit (if any fixes were needed)**

```bash
git add -A && git commit -m "fix(mundial): polish from manual verification"
```

---

# PHASE B — Staff `/redemptions`

## Task B1: Staff token seam — `src/server/staff-token.ts`

**Files:**
- Create: `src/server/staff-token.ts`
- Modify: `.env.example`

- [ ] **Step 1: Write the resolver**

Create `src/server/staff-token.ts`:

```ts
import "server-only";

// Server-held bearer token for the protected /staff/* campaign-reward endpoints.
// The PIN cookie gates the human operator (see staff-match-up.ts); this token is
// what actually authenticates the proxy to the Go backend, which requires a
// Firebase staff/manager/owner bearer. It is set ONLY in server env
// (BACKEND_STAFF_TOKEN in Vercel) and never reaches the browser.
//
// OPEN ITEM (spec §8.1): provision a long-lived staff-role service credential
// and document its refresh story. Until BACKEND_STAFF_TOKEN is set, staff
// actions return a calm "config unavailable" state instead of a raw 401.

export function staffBearerToken(): string | null {
  const token = process.env.BACKEND_STAFF_TOKEN;
  return token && token.trim().length > 0 ? token.trim() : null;
}
```

- [ ] **Step 2: Document the env var**

In `.env.example`, add (near the other backend vars):

```
# Server-held bearer for protected /staff/* campaign-reward endpoints.
# Long-lived staff/manager/owner-role token. Server-only — never NEXT_PUBLIC.
BACKEND_STAFF_TOKEN=
```

- [ ] **Step 3: Typecheck + commit**

Run: `npm run typecheck` → PASS

```bash
git add src/server/staff-token.ts .env.example
git commit -m "feat(redemptions): server-held staff token seam"
```

---

## Task B2: Staff fetchers — `src/api/campaign-rewards.ts`

**Files:**
- Create: `src/api/campaign-rewards.ts`

- [ ] **Step 1: Write the module**

Create `src/api/campaign-rewards.ts`:

```ts
import "server-only";

import { staffBearerToken } from "../server/staff-token";

// Typed client for the protected staff campaign-reward endpoints.
//
// BACKEND CONTRACT (13_companion_backend/docs/openapi.yaml):
//   GET  /staff/campaign-rewards/{code}          → CampaignReward (200)
//   POST /staff/campaign-rewards/{code}/redeem    → CampaignReward (200)
//   401/403 → not authorized ; 404 → not found ; 409 → already redeemed ;
//   410 → expired. Auth: Bearer (Firebase staff/manager/owner). We attach a
//   server-held token (never the browser's). Never throws on transport.

function resolveBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

export type CampaignRewardStatus = "issued" | "redeemed" | "expired";

export type CampaignReward = {
  id: string;
  campaign_id: string;
  email: string;
  reward_label: string;
  reward_description?: string;
  short_code: string;
  qr_payload_url: string;
  status: CampaignRewardStatus;
  valid_from: string;
  expires_at: string;
  issued_at: string;
  redeemed_at?: string;
  redeemed_by_actor_id?: string;
  redemption_notes?: string;
};

export type RewardLookupResult =
  | { ok: true; reward: CampaignReward }
  | { ok: false; kind: "not_found"; status: number }
  | { ok: false; kind: "unauthorized"; status: number }
  | { ok: false; kind: "unconfigured" }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

export type RewardRedeemResult =
  | { ok: true; reward: CampaignReward }
  | { ok: false; kind: "already_redeemed"; status: number } // 409
  | { ok: false; kind: "expired"; status: number } // 410
  | { ok: false; kind: "not_found"; status: number }
  | { ok: false; kind: "unauthorized"; status: number }
  | { ok: false; kind: "unconfigured" }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

const REQUEST_TIMEOUT_MS = 8000;

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}

function authHeaders(): Record<string, string> | null {
  const token = staffBearerToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export async function validateReward(code: string): Promise<RewardLookupResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, kind: "unconfigured" };

  const url = `${resolveBaseUrl()}/staff/campaign-rewards/${encodeURIComponent(code)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const reward = (await res.json()) as CampaignReward;
      return { ok: true, reward };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  if (res.status === 401 || res.status === 403) return { ok: false, kind: "unauthorized", status: res.status };
  if (res.status === 404) return { ok: false, kind: "not_found", status: res.status };
  return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
}

export async function redeemReward(code: string, notes?: string): Promise<RewardRedeemResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, kind: "unconfigured" };

  const url = `${resolveBaseUrl()}/staff/campaign-rewards/${encodeURIComponent(code)}/redeem`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(notes ? { notes } : {}),
      signal: controller.signal,
      cache: "no-store"
    });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const reward = (await res.json()) as CampaignReward;
      return { ok: true, reward };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  switch (res.status) {
    case 401:
    case 403:
      return { ok: false, kind: "unauthorized", status: res.status };
    case 404:
      return { ok: false, kind: "not_found", status: res.status };
    case 409:
      return { ok: false, kind: "already_redeemed", status: res.status };
    case 410:
      return { ok: false, kind: "expired", status: res.status };
    default:
      return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
  }
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS

```bash
git add src/api/campaign-rewards.ts
git commit -m "feat(redemptions): server-only staff reward fetchers"
```

---

## Task B3: Staff server actions — `src/server/campaign-rewards.ts`

**Files:**
- Create: `src/server/campaign-rewards.ts`

- [ ] **Step 1: Write the actions**

Create `src/server/campaign-rewards.ts`. Both actions are gated by `isStaffUnlocked()` (reused from the Match Up PIN gate). They take FormData (`code`, optional `notes`) and return states the client card renders.

```ts
"use server";

import { isStaffUnlocked } from "./staff-match-up";
import {
  validateReward,
  redeemReward,
  type CampaignReward
} from "../api/campaign-rewards";

export type RewardCardState =
  | { status: "idle" }
  | { status: "locked" }
  | { status: "found"; reward: CampaignReward }
  | { status: "not_found" }
  | { status: "unauthorized" }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

const COPY = {
  generic: "No pudimos validar el código. Inténtalo de nuevo.",
  unconfigured: "El canje no está configurado. Avisa a administración.",
  notFound: "Código no encontrado.",
  unauthorized: "Sesión de barra no válida. Vuelve a ingresar el código de la barra."
} as const;

function code(form: FormData): string {
  const v = form.get("code");
  return typeof v === "string" ? v.trim() : "";
}

export async function lookupRewardAction(
  _prev: RewardCardState,
  formData: FormData
): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const c = code(formData);
  if (!c) return { status: "error", message: "Ingresa o escanea un código." };

  const result = await validateReward(c);
  if (result.ok) return { status: "found", reward: result.reward };
  switch (result.kind) {
    case "not_found":
      return { status: "not_found" };
    case "unauthorized":
      return { status: "unauthorized" };
    case "unconfigured":
      return { status: "unconfigured" };
    default:
      return { status: "error", message: COPY.generic };
  }
}

export async function redeemRewardAction(
  _prev: RewardCardState,
  formData: FormData
): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const c = code(formData);
  if (!c) return { status: "error", message: "Falta el código." };
  const notes = typeof formData.get("notes") === "string" ? (formData.get("notes") as string).trim() : "";

  const result = await redeemReward(c, notes || undefined);
  if (result.ok) return { status: "found", reward: result.reward };
  switch (result.kind) {
    case "already_redeemed":
    case "expired": {
      // Re-fetch so the card reflects the authoritative current state.
      const fresh = await validateReward(c);
      if (fresh.ok) return { status: "found", reward: fresh.reward };
      return { status: "error", message: COPY.generic };
    }
    case "not_found":
      return { status: "not_found" };
    case "unauthorized":
      return { status: "unauthorized" };
    case "unconfigured":
      return { status: "unconfigured" };
    default:
      return { status: "error", message: COPY.generic };
  }
}

// Server-side pre-validation used by the [code] page so the QR lands straight
// on the card without a manual "Validar" tap.
export async function prevalidate(codeValue: string): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const result = await validateReward(codeValue);
  if (result.ok) return { status: "found", reward: result.reward };
  if (result.kind === "not_found") return { status: "not_found" };
  if (result.kind === "unauthorized") return { status: "unauthorized" };
  if (result.kind === "unconfigured") return { status: "unconfigured" };
  return { status: "error", message: COPY.generic };
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS

```bash
git add src/server/campaign-rewards.ts
git commit -m "feat(redemptions): PIN-gated lookup + redeem server actions"
```

---

## Task B4: Validator card — `app/(admin)/redemptions/_components/RewardValidator.tsx`

**Files:**
- Create: `app/(admin)/redemptions/_components/RewardValidator.tsx`

- [ ] **Step 1: Write the client card**

Create `app/(admin)/redemptions/_components/RewardValidator.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  lookupRewardAction,
  redeemRewardAction,
  type RewardCardState
} from "../../../../src/server/campaign-rewards";

function tz(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STATUS_LABEL: Record<string, string> = {
  issued: "Vigente",
  redeemed: "Ya canjeado",
  expired: "Expirado"
};

export function RewardValidator({
  initialCode = "",
  initialState
}: {
  initialCode?: string;
  initialState: RewardCardState;
}) {
  const [lookupState, lookupAction] = useActionState(lookupRewardAction, initialState);
  const [redeemState, redeemAction] = useActionState(redeemRewardAction, { status: "idle" } as RewardCardState);

  // The redeem result (when present) supersedes the lookup result.
  const state = redeemState.status !== "idle" ? redeemState : lookupState;

  return (
    <div className="redeem">
      {/* Lookup form — hidden once we already have a reward from the URL token. */}
      {state.status !== "found" && (
        <form className="redeem__lookup" action={lookupAction} noValidate>
          <label className="redeem__label" htmlFor="redeem-code">Código de la recompensa</label>
          <input
            id="redeem-code"
            name="code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            defaultValue={initialCode}
            placeholder="Escanea el QR o escribe el código"
            className="redeem__input"
            autoFocus
          />
          <LookupButton />
          <ResultMessage state={state} />
        </form>
      )}

      {state.status === "found" && (
        <RewardCard reward={state.reward} redeemAction={redeemAction} />
      )}
    </div>
  );
}

function RewardCard({
  reward,
  redeemAction
}: {
  reward: NonNullable<Extract<RewardCardState, { status: "found" }>["reward"]>;
  redeemAction: (formData: FormData) => void;
}) {
  const redeemable = reward.status === "issued";
  return (
    <div className="redeem__card">
      <div className="redeem__head">
        <span className={`redeem__badge redeem__badge--${reward.status}`}>
          {STATUS_LABEL[reward.status] ?? reward.status}
        </span>
        <span className="redeem__code">{reward.short_code}</span>
      </div>

      <h2 className="redeem__reward">{reward.reward_label}</h2>
      {reward.reward_description && <p className="redeem__desc">{reward.reward_description}</p>}

      <dl className="redeem__meta">
        <div><dt>Correo</dt><dd>{reward.email}</dd></div>
        <div><dt>Válido</dt><dd>{tz(reward.valid_from)} — {tz(reward.expires_at)}</dd></div>
        {reward.redeemed_at && <div><dt>Canjeado</dt><dd>{tz(reward.redeemed_at)}</dd></div>}
      </dl>

      {redeemable ? (
        <form action={redeemAction} className="redeem__redeem">
          <input type="hidden" name="code" value={reward.short_code} />
          <input
            name="notes"
            type="text"
            placeholder="Nota (opcional)"
            className="redeem__input redeem__input--notes"
            autoComplete="off"
          />
          <RedeemButton />
        </form>
      ) : (
        <p className="redeem__closed">
          {reward.status === "redeemed" ? "Esta recompensa ya fue canjeada." : "Esta recompensa expiró."}
        </p>
      )}
    </div>
  );
}

function LookupButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="redeem__btn redeem__btn--ghost" disabled={pending}>
      {pending ? "Validando…" : "Validar"}
    </button>
  );
}

function RedeemButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="redeem__btn redeem__btn--primary" disabled={pending}>
      {pending ? "Canjeando…" : "Canjear café"}
    </button>
  );
}

function ResultMessage({ state }: { state: RewardCardState }) {
  if (state.status === "not_found") return <p className="redeem__msg" role="alert">Código no encontrado.</p>;
  if (state.status === "unauthorized") return <p className="redeem__msg" role="alert">Sesión de barra no válida.</p>;
  if (state.status === "unconfigured") return <p className="redeem__msg" role="alert">El canje no está configurado. Avisa a administración.</p>;
  if (state.status === "error") return <p className="redeem__msg" role="alert">{state.message}</p>;
  return null;
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `npm run typecheck` → PASS

```bash
git add "app/(admin)/redemptions/_components/RewardValidator.tsx"
git commit -m "feat(redemptions): validate/redeem client card"
```

---

## Task B5: Staff pages + styles

**Files:**
- Create: `app/(admin)/redemptions/redemptions.css`
- Create: `app/(admin)/redemptions/page.tsx`
- Create: `app/(admin)/redemptions/[code]/page.tsx`

- [ ] **Step 1: Write the stylesheet**

Create `app/(admin)/redemptions/redemptions.css`:

```css
.redeem-shell { min-height: 100svh; background: #fff9f0; color: var(--ink); }
.redeem-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--copper);
}
.redeem-bar__brand {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
}
.redeem-bar__diamond { width: 7px; height: 7px; background: var(--green); transform: rotate(45deg); }
.redeem-bar__signout {
  background: none; border: none; font-family: var(--mono); font-size: 12px;
  color: var(--muted); text-decoration: underline; cursor: pointer;
}
.redeem-body { max-width: 460px; margin: 0 auto; padding: 28px 20px 48px; }

.redeem__lookup { display: flex; flex-direction: column; gap: 12px; }
.redeem__label { font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.redeem__input {
  font-family: var(--mono); font-size: 16px; padding: 13px 14px;
  border: 1.5px solid var(--copper); border-radius: 10px; background: #fff; color: var(--ink);
}
.redeem__input:focus { outline: none; border-color: var(--green); }
.redeem__input--notes { font-size: 14px; }

.redeem__btn {
  border: none; border-radius: 999px; padding: 14px 20px; cursor: pointer;
  font-family: var(--mono); font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
}
.redeem__btn--primary { background: var(--green); color: var(--paper); }
.redeem__btn--ghost { background: transparent; color: var(--ink); border: 1.5px solid var(--copper); }
.redeem__btn:disabled { opacity: 0.5; cursor: not-allowed; }

.redeem__card { border: 1.5px solid var(--copper); border-radius: 16px; padding: 22px; background: #fff; }
.redeem__head { display: flex; align-items: center; justify-content: space-between; }
.redeem__badge {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px;
}
.redeem__badge--issued { background: rgba(46,64,52,0.12); color: var(--green); }
.redeem__badge--redeemed { background: rgba(107,95,82,0.16); color: var(--muted); }
.redeem__badge--expired { background: rgba(154,52,18,0.12); color: #9a3412; }
.redeem__code { font-family: var(--mono); font-size: 14px; letter-spacing: 0.06em; color: var(--muted); }

.redeem__reward { font-family: var(--display); font-style: italic; font-size: 28px; margin: 14px 0 4px; }
.redeem__desc { font-family: var(--mono); font-size: 13px; color: var(--muted); line-height: 1.6; }

.redeem__meta { margin: 18px 0; display: flex; flex-direction: column; gap: 10px; }
.redeem__meta div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgba(201,165,122,0.4); padding-bottom: 8px; }
.redeem__meta dt { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.redeem__meta dd { font-family: var(--mono); font-size: 13px; color: var(--ink); text-align: right; overflow-wrap: anywhere; }

.redeem__redeem { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.redeem__closed { font-family: var(--mono); font-size: 13px; color: var(--muted); margin-top: 12px; }
.redeem__msg { font-family: var(--mono); font-size: 13px; color: #9a3412; }
```

- [ ] **Step 2: Write the manual-entry page**

Create `app/(admin)/redemptions/page.tsx`. Reuses the Match Up unlock gate; renders the validator with no initial code.

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { isStaffUnlocked, signOutStaffMatchUp } from "../../../src/server/staff-match-up";
import { StaffUnlock } from "../match-up/_components/StaffUnlock";
import { RewardValidator } from "./_components/RewardValidator";
import "./redemptions.css";

export const metadata: Metadata = {
  title: "Canje de recompensas · Barra",
  robots: { index: false, follow: false }
};

export default function RedemptionsPage() {
  return (
    <div className="redeem-shell">
      <Suspense fallback={<Bar />}>
        <Gate />
      </Suspense>
    </div>
  );
}

async function Gate() {
  const unlocked = await isStaffUnlocked();
  return (
    <>
      <Bar unlocked={unlocked} />
      <main className="redeem-body">
        {unlocked ? (
          <RewardValidator initialState={{ status: "idle" }} />
        ) : (
          <StaffUnlock />
        )}
      </main>
    </>
  );
}

function Bar({ unlocked }: { unlocked?: boolean }) {
  return (
    <header className="redeem-bar">
      <span className="redeem-bar__brand">
        <span className="redeem-bar__diamond" aria-hidden="true" />
        Barra · Canje
      </span>
      {unlocked && (
        <form action={signOutStaffMatchUp}>
          <button type="submit" className="redeem-bar__signout">Cerrar sesión</button>
        </form>
      )}
    </header>
  );
}
```

- [ ] **Step 3: Write the token-entry page**

Create `app/(admin)/redemptions/[code]/page.tsx`. Same gate; pre-validates the URL token so the QR lands straight on the card.

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { isStaffUnlocked, signOutStaffMatchUp } from "../../../../src/server/staff-match-up";
import { prevalidate } from "../../../../src/server/campaign-rewards";
import { StaffUnlock } from "../../match-up/_components/StaffUnlock";
import { RewardValidator } from "../_components/RewardValidator";
import "../redemptions.css";

export const metadata: Metadata = {
  title: "Canje de recompensas · Barra",
  robots: { index: false, follow: false }
};

export default async function RedemptionByCodePage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <div className="redeem-shell">
      <Suspense fallback={<Bar />}>
        <Gate code={decodeURIComponent(code)} />
      </Suspense>
    </div>
  );
}

async function Gate({ code }: { code: string }) {
  const unlocked = await isStaffUnlocked();
  if (!unlocked) {
    return (
      <>
        <Bar />
        <main className="redeem-body"><StaffUnlock /></main>
      </>
    );
  }
  const initialState = await prevalidate(code);
  return (
    <>
      <Bar unlocked />
      <main className="redeem-body">
        <RewardValidator initialCode={code} initialState={initialState} />
      </main>
    </>
  );
}

function Bar({ unlocked }: { unlocked?: boolean }) {
  return (
    <header className="redeem-bar">
      <span className="redeem-bar__brand">
        <span className="redeem-bar__diamond" aria-hidden="true" />
        Barra · Canje
      </span>
      {unlocked && (
        <form action={signOutStaffMatchUp}>
          <button type="submit" className="redeem-bar__signout">Cerrar sesión</button>
        </form>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck` → PASS
Run: `npm run build` → PASS (routes `/redemptions` and `/redemptions/[code]` listed)

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/redemptions"
git commit -m "feat(redemptions): PIN-gated staff validate/redeem pages"
```

---

## Task B6: Staff surface verification

**Files:** none (verification only)

- [ ] **Step 1: Configure dev env**

In `.env.local`, set `MATCH_UP_STAFF_PIN` (if not already) and `BACKEND_STAFF_TOKEN` to a value the in-memory backend accepts (or leave `BACKEND_STAFF_TOKEN` empty to verify the "unconfigured" state path first).

- [ ] **Step 2: Dev-server matrix (dev uses the `/admin` prefix)**

With `npm run dev` + the in-memory backend running, visit:
- `http://localhost:3000/admin/redemptions` → PIN gate appears; wrong PIN → "Código incorrecto"; correct PIN → manual-entry field.
- With a known issued `short_code`: type it → **Validar** → card shows label, email, Vigente badge, validity window → **Canjear café** → badge flips to "Ya canjeado".
- Re-validate the same code → shows "Ya canjeado", no redeem button (409/expired path resolves to the fresh card).
- Unknown code → "Código no encontrado."
- `http://localhost:3000/admin/redemptions/<token>` → after unlock, lands straight on the card (pre-validated).
- With `BACKEND_STAFF_TOKEN` empty → "El canje no está configurado."
- No horizontal scroll at 320 / 375 / 390.

- [ ] **Step 3: Commit (if fixes were needed)**

```bash
git add -A && git commit -m "fix(redemptions): polish from manual verification"
```

---

# PHASE C — Paper-first + handoff

## Task C1: Paper artboards + deploy gate

**Files:** none (Paper Desktop + approval)

- [ ] **Step 1: Port every state to Paper**

Using `paper-desktop:code-to-design` (or the Paper MCP tools directly), build artboards at **mobile 390×844** and **desktop 1440×900** for:
- Public: Cover, Match step (stepper), Review+email, Submitted, Closed, Empty.
- Staff: Unlock (reuse Match Up artboard if present), Validate (issued card), Redeemed, Expired, Not-found.

Use real brand tokens, fonts, copy, and the edition device — no placeholders.

- [ ] **Step 2: Screenshot + present to user**

Take `get_screenshot` of each artboard, then **Read the exported PNGs** to verify symmetry/crop (per `feedback_paper_export_verification`). Present screenshots to the user.

- [ ] **Step 3: WAIT for explicit approval**

Do **not** run any `vercel` command until the user says "ship it" / "go" / equivalent.

- [ ] **Step 4: Resolve the two backend open items before staff go-live**

Confirm with the backend owner:
1. `BACKEND_STAFF_TOKEN` provisioned in Vercel (long-lived staff-role credential).
2. The emailed reward's `qr_payload_url` points at `https://admin.derivastudio.cl/redemptions/{token}`.

- [ ] **Step 5: Deploy (only after approval)**

```bash
rm -rf .next && npm run build
vercel deploy --prod --yes
```

Then verify `derivastudio.cl/mundial` and `admin.derivastudio.cl/redemptions` in production.

---

## Self-review notes (author)

- **Spec coverage:** public wizard states (§5) → A5/A6; staff card states (§6) → B4/B5; server-action trust boundary (§4) → A3/B3; no-camera redemption (§6) → B5 `[code]` page + manual field; token seam (§8.1) → B1; middleware/sitemap (§4) → A1; Paper-first (§7) → C1; open items (§8) → C1 step 4 + B1 doc.
- **No invented backend fields:** all types match the OpenAPI schemas read on 2026-06-12.
- **Type consistency:** `RewardCardState`, `PollaFormState`, fetcher result kinds are defined once and reused; `prevalidate` returns the same `RewardCardState` the client card consumes.
- **Known follow-up:** the `[code]` and manual pages duplicate the `Bar` component; acceptable (small, two files) — extract to a shared `_components/RedeemBar.tsx` only if a third consumer appears (YAGNI).
