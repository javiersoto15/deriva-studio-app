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
  full_name: string;
  predictions: WorldCupPrediction[];
};

export type WorldCupSubmission = {
  id: string;
  campaign_id: string;
  campaign_date: string;
  email: string;
  full_name: string;
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
      return { ok: true, submission: { id: "", campaign_id: "", campaign_date: "", email: body.email, full_name: body.full_name, status: "pending", submitted_at: "", predictions: body.predictions } };
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
