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
