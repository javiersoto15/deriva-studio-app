"use server";

import {
  submitPredictions,
  type SubmitPollaResult,
  type WorldCupPrediction,
  type WorldCupSubmissionRequest
} from "../api/world-cup";

// Server action behind the Polla wizard. The browser posts here, never to
// Cloud Run directly, so the backend host stays server-side and CORS is moot.
// Email is normalized + validated here; it is NEVER logged or echoed back in a
// way that leaks beyond the success state's own `email`.

export type PollaFormState =
  | { status: "idle" }
  | { status: "success"; email: string; fullName: string }
  | { status: "duplicate" }
  | { status: "closed" }
  | { status: "error"; message: string; field?: "email" | "full_name" };

const MIN_FILL_MS = 2500; // bots submit instantly; a human reads + taps steppers.
const MAX_PREDICTIONS = 32; // sanity bound on a single day's slate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_MIN = 3;
const FULL_NAME_MAX = 120;

const COPY = {
  generic: "No pudimos registrar tu polla. Inténtalo de nuevo en un momento.",
  rateLimited: "Recibimos varios intentos. Dale un respiro e inténtalo más tarde.",
  spam: "No pudimos validar tu envío. Vuelve a intentarlo.",
  email: "Revisa tu correo — lo necesitamos para avisarte si ganas.",
  fullName: "Escribe tu nombre y apellido.",
  duplicate: "Ya recibimos una predicción para este email hoy.",
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

  // 3) Full name (required; 3–120 chars after trim).
  const fullName = str(formData, "full_name");
  if (fullName.length < FULL_NAME_MIN || fullName.length > FULL_NAME_MAX) {
    return { status: "error", message: COPY.fullName, field: "full_name" };
  }

  // 4) Email.
  const email = str(formData, "email").toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { status: "error", message: COPY.email, field: "email" };
  }

  // 5) Predictions.
  const predictions = parsePredictions(str(formData, "predictions"));
  if (!predictions) {
    return { status: "error", message: COPY.predictions };
  }

  // 6) Throttle (best-effort; backend authoritative). Key stays the normalized email.
  if (!throttle(email)) {
    return { status: "error", message: COPY.rateLimited };
  }

  const payload: WorldCupSubmissionRequest = { email, full_name: fullName, predictions };
  const result = await submitPredictions(payload);

  return mapSubmissionState(result, { email, fullName });
}

/**
 * Centralizes mapping the fetcher result → UI state, so future backend reward
 * semantics land in one place. The submit response is intentionally tier-blind:
 * the tier (café simple / Campesino / combo) is decided backend-side LATER,
 * after same-day results, and is NOT revealed here.
 *
 * FUTURE-PROOFING — the backend may later surface richer submission statuses.
 * None of these exist on the current contract (do NOT read fields that aren't
 * there yet); this is structural readiness only. When they ship, branch them
 * here instead of in the action body:
 *   - submitted_pending_verification → still "success" (verification in flight)
 *   - verified_submission            → still "success"
 *   - duplicate_submission           → "duplicate"
 *   - reward_email_sent              → still "success" (reward already mailed)
 *
 * Internal sync helper (not exported): a "use server" module may only export
 * async functions, and this mapper has no business being a callable action.
 */
function mapSubmissionState(
  result: SubmitPollaResult,
  identity: { email: string; fullName: string }
): PollaFormState {
  if (result.ok) {
    // TODO(backend tiers): once the response carries a settled status enum,
    //   switch (result.submission.status as string) {
    //     case "submitted_pending_verification":
    //     case "verified_submission":
    //     case "reward_email_sent":
    //       return { status: "success", email: identity.email, fullName: identity.fullName };
    //     case "duplicate_submission":
    //       return { status: "duplicate" };
    //   }
    // Until then, a 2xx is simply a successful intake.
    return { status: "success", email: identity.email, fullName: identity.fullName };
  }
  switch (result.kind) {
    case "duplicate":
      // 409 — one participation per canonicalized email per day.
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
