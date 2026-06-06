import "server-only";

// Typed client for the public Deriva Match Up campaign endpoint —
//   `POST /public/campaigns/deriva-match-up/submissions`.
//
// CAMPAIGN: a customer brings a receipt ("boleta") from another café and Deriva
// matches the coffee price (floored at 1600 CLP). The backend stores only a
// HASHED RUT — never the raw one — and dedups one submission per normalized RUT.
//
// BACKEND CONTRACT (source of truth):
//   POST /public/campaigns/deriva-match-up/submissions  (public, no auth)
//   Request:  { rut, competitor_place, coffee_name, competitor_price_clp }
//   Response: { id, campaign_id, competitor_place, coffee_name,
//               competitor_price_clp, matched_price_clp, submitted_at }
//   200/201 → accepted; matched_price_clp = max(competitor_price_clp, 1600)
//   400     → validation error
//   409     → duplicate normalized RUT (already used this campaign)
//   410     → campaign expired (valid until 2026-06-30)
//
// Like `src/api/reviews.ts`, this never throws on transport/HTTP failure — it
// returns a typed discriminated result the server action maps to calm UI copy.
// The raw RUT travels only inside the request body and is never logged here.

// ----- Resolution order matches src/api/reviews.ts --------------------------
// 1. INTERNAL_API_BASE_URL — server-only private backend address in prod.
// 2. NEXT_PUBLIC_API_BASE_URL — fallback / dev / preview.
// 3. http://localhost:8080 — last-resort local dev.
function resolveBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

// ----- Request --------------------------------------------------------------
export type MatchUpRequest = {
  /** Chilean RUT, normalized to the documented form, e.g. "12.345.678-5". */
  rut: string;
  /** Where the customer usually buys their coffee. Required. */
  competitor_place: string;
  /** Which coffee they bought there. Required. */
  coffee_name: string;
  /** Price paid at the other café, in whole CLP. Required, > 0. */
  competitor_price_clp: number;
};

// ----- Response -------------------------------------------------------------
// We type the display-safe envelope. `matched_price_clp` is authoritative —
// the floor logic lives on the backend; the UI shows exactly what it returns.
export type MatchUpResponse = {
  id: string;
  campaign_id: string;
  competitor_place: string;
  coffee_name: string;
  competitor_price_clp: number;
  matched_price_clp: number;
  submitted_at: string;
};

// Discriminated result so callers never have to try/catch the transport, and
// so the campaign's distinct 409/410 states get first-class handling.
export type SubmitMatchUpResult =
  | { ok: true; submission: MatchUpResponse }
  | { ok: false; kind: "duplicate"; status: number; message?: string }
  | { ok: false; kind: "expired"; status: number; message?: string }
  | { ok: false; kind: "validation"; status: number; message?: string }
  | { ok: false; kind: "rate_limited"; status: number; message?: string }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

const REQUEST_TIMEOUT_MS = 8000;

/**
 * POST a Match Up submission. Never throws on transport/HTTP failure — returns
 * a typed `SubmitMatchUpResult` the server action maps to UI copy. Logs nothing
 * about the RUT.
 */
export async function submitMatchUp(
  body: MatchUpRequest,
  init?: { signal?: AbortSignal }
): Promise<SubmitMatchUpResult> {
  const url = `${resolveBaseUrl()}/public/campaigns/deriva-match-up/submissions`;

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
    return {
      ok: false,
      kind: "network",
      message: error instanceof Error ? error.message : "network error"
    };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const submission = (await res.json()) as MatchUpResponse;
      return { ok: true, submission };
    } catch {
      // 2xx with an unreadable body shouldn't happen for this contract (we need
      // matched_price_clp to render). Treat it as a server-side problem.
      return { ok: false, kind: "server", status: res.status, message: undefined };
    }
  }

  const message = await safeErrorMessage(res);
  switch (res.status) {
    case 409:
      return { ok: false, kind: "duplicate", status: res.status, message };
    case 410:
      return { ok: false, kind: "expired", status: res.status, message };
    case 400:
    case 422:
      return { ok: false, kind: "validation", status: res.status, message };
    case 429:
      return { ok: false, kind: "rate_limited", status: res.status, message };
    default:
      return { ok: false, kind: "server", status: res.status, message };
  }
}

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}
