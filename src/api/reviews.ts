import "server-only";

// Typed client for the public reviews endpoint — `POST /public/reviews`.
//
// BACKEND CONTRACT (source of truth):
//   docs/plans/2026-06-02-review-system-design.md
//   docs/plans/2026-06-02-review-system-implementation-plan.md (Task 5 + Task 6)
//
// The Go backend exposes `POST /public/reviews` with NO auth. It always creates
// the review in `status: "pending"` and runs server-side validation, honeypot,
// timing, throttling, and profanity heuristics. The `source` field is derived
// server-side (`public_web`) — the client must NOT send it. Nothing here is
// displayed publicly without manual moderation.
//
// `submitPublicReview` degrades to a typed `network`/`server` error result when
// the endpoint is unreachable so the UI can show a calm failure state instead of
// throwing.

// ----- Resolution order matches src/api/server.ts ---------------------------
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
// One of `menu_item_id`, `item_name`, or `review_context: "place_only"` must be
// present (item context requirement). The backend re-validates this.
export type PublicReviewContext = "place_only";

export type PublicReviewRequest = {
  /** Overall rating, 1–5. Required. */
  rating_overall: number;
  /** Free-text body, 20–1200 chars. Required. */
  review_body: string;
  /** ISO calendar date (YYYY-MM-DD), not in the future. Required. */
  visit_date: string;

  /** Known backend menu item id, when the customer picked from the catalog. */
  menu_item_id?: string;
  /** Free-text item fallback when not in the catalog. */
  item_name?: string;
  /** Set to "place_only" when the feedback is about the place, not an item. */
  review_context?: PublicReviewContext;

  /** Optional display name (trimmed, length-limited server-side). */
  display_name?: string;
  /** Optional contact email (validated when present). */
  contact_email?: string;
  /** Optional contact phone (lightly normalized server-side). */
  contact_phone?: string;
  /** Customer agrees Deriva may reach out about this feedback. Default false. */
  consent_to_contact?: boolean;

  /** Preferred BCP-47-ish language tag for the submission (defaults es-CL). */
  language?: string;
};

// ----- Response -------------------------------------------------------------
// We intentionally type only the display-safe envelope the public client needs.
// Moderation/safety/agent fields exist on the record but are never returned to
// an anonymous caller.
export type PublicReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "private_feedback"
  | "follow_up";

export type PublicReviewResponse = {
  id: string;
  status: PublicReviewStatus;
  created_at?: string;
};

// Discriminated result so callers never have to try/catch the transport.
export type SubmitReviewResult =
  | { ok: true; review: PublicReviewResponse }
  | { ok: false; kind: "validation"; status: number; message?: string }
  | { ok: false; kind: "rate_limited"; status: number; message?: string }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

const REQUEST_TIMEOUT_MS = 8000;

/**
 * POST a public, anonymous review. Never throws on transport/HTTP failure —
 * returns a typed `SubmitReviewResult` the server action maps to UI copy.
 */
export async function submitPublicReview(
  body: PublicReviewRequest,
  init?: { signal?: AbortSignal }
): Promise<SubmitReviewResult> {
  const url = `${resolveBaseUrl()}/public/reviews`;

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
      const review = (await res.json()) as PublicReviewResponse;
      return { ok: true, review };
    } catch {
      // 2xx with an unreadable body — treat as success; the record was created.
      return { ok: true, review: { id: "", status: "pending" } };
    }
  }

  const message = await safeErrorMessage(res);
  if (res.status === 422 || res.status === 400) {
    return { ok: false, kind: "validation", status: res.status, message };
  }
  if (res.status === 429) {
    return { ok: false, kind: "rate_limited", status: res.status, message };
  }
  return { ok: false, kind: "server", status: res.status, message };
}

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}
