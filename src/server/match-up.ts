"use server";

import { z } from "zod";
import { submitMatchUp, type MatchUpRequest } from "../api/match-up";

// Server action behind the Deriva Match Up campaign form. Mirrors the reviews
// action: honeypot + timing gate + structured validation, then a clean typed
// payload to `src/api/match-up.ts`. This action is the trust boundary — the
// browser posts here, never to Cloud Run directly, so the backend host stays
// server-side and CORS is moot.
//
// PRIVACY: the raw RUT lives only in `formData`, the normalized string, and the
// outbound request body. It is NEVER logged, echoed back to the client, or put
// in the returned form state. The backend stores only a hashed RUT.

export type MatchUpFieldErrors = Partial<
  Record<
    "rut" | "competitor_place" | "coffee_name" | "competitor_price_clp",
    string
  >
>;

export type MatchUpFormState =
  | { status: "idle" }
  // Success carries only what we render: the matched price (authoritative from
  // the backend) and the customer's own inputs — NOT the RUT.
  | {
      status: "success";
      matchedPriceClp: number;
      competitorPriceClp: number;
      competitorPlace: string;
      coffeeName: string;
    }
  | { status: "duplicate" }
  | { status: "expired" }
  | { status: "error"; message: string; fieldErrors?: MatchUpFieldErrors };

// Bots submit instantly; a real person needs seconds to read + type. The client
// stamps `render_started` (ms epoch) when the form mounts.
const MIN_FILL_MS = 3000;

// The campaign floor lives on the backend; this is only used for client-side
// sanity bounds on the price input, not to compute the match.
const MAX_PRICE_CLP = 100_000; // a single coffee above this is surely a typo.
const MAX_PLACE_LEN = 120;
const MAX_COFFEE_LEN = 120;

const COPY = {
  generic: "No pudimos registrar tu boleta. Inténtalo de nuevo en un momento.",
  rateLimited:
    "Recibimos varios intentos. Dale un respiro e inténtalo más tarde.",
  spam: "No pudimos validar tu envío. Vuelve a intentarlo.",
  fieldRut: "Revisa tu RUT — debería verse como 12.345.678-5.",
  fieldPlace: "Cuéntanos dónde compraste tu café.",
  fieldCoffee: "Cuéntanos qué café compraste.",
  fieldPriceMissing: "Indica cuánto pagaste, en pesos.",
  fieldPriceRange: "Revisa el precio — ingresa el valor en pesos chilenos."
} as const;

// Light per-process throttle keyed by normalized RUT. The backend owns
// authoritative dedup/throttling; this just blunts trivial repeat-spam.
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

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

// ----- Chilean RUT (módulo 11) ----------------------------------------------
// A RUT is a body of 7–8 digits plus a verification digit (0–9 or K), computed
// by a fixed weighted-sum-mod-11 scheme. This is a deterministic standard, not
// a heuristic — validating here gives instant UX feedback and keeps obviously
// bogus values off the network. The backend re-validates and hashes.
function cleanRut(raw: string): string {
  return raw.replace(/[.\-\s]/g, "").toUpperCase();
}

function computeDv(bodyDigits: string): string {
  let sum = 0;
  let multiplier = 2;
  for (let i = bodyDigits.length - 1; i >= 0; i--) {
    sum += Number(bodyDigits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

function isValidRut(raw: string): boolean {
  const clean = cleanRut(raw);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return computeDv(body) === dv;
}

// Canonical form matching the documented contract example ("12.345.678-5").
// Dedup is backend-side on a normalized RUT, so format is cosmetic — we send a
// consistent, human-legible shape.
function formatRut(raw: string): string {
  const clean = cleanRut(raw);
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}

export async function submitMatchUpAction(
  _previous: MatchUpFormState,
  formData: FormData
): Promise<MatchUpFormState> {
  // 1) Honeypot — real users never see/fill `company`.
  if (str(formData, "company").length > 0) {
    return { status: "error", message: COPY.spam };
  }

  // 2) Timing gate — reject submissions faster than a human could fill the form.
  const renderStarted = Number(str(formData, "render_started"));
  if (Number.isFinite(renderStarted) && renderStarted > 0) {
    if (Date.now() - renderStarted < MIN_FILL_MS) {
      return { status: "error", message: COPY.spam };
    }
  }

  // 3) Structured validation with field-level errors for the UI.
  const rutRaw = str(formData, "rut");
  const place = str(formData, "competitor_place");
  const coffee = str(formData, "coffee_name");
  const priceRaw = str(formData, "competitor_price_clp").replace(/[^\d]/g, "");

  const fieldErrors: MatchUpFieldErrors = {};

  if (!isValidRut(rutRaw)) {
    fieldErrors.rut = COPY.fieldRut;
  }
  if (place.length === 0) {
    fieldErrors.competitor_place = COPY.fieldPlace;
  }
  if (coffee.length === 0) {
    fieldErrors.coffee_name = COPY.fieldCoffee;
  }

  const price = Number(priceRaw);
  if (!priceRaw) {
    fieldErrors.competitor_price_clp = COPY.fieldPriceMissing;
  } else if (!Number.isInteger(price) || price <= 0 || price > MAX_PRICE_CLP) {
    fieldErrors.competitor_price_clp = COPY.fieldPriceRange;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: COPY.generic, fieldErrors };
  }

  // 4) Throttle (best-effort; backend is authoritative). Keyed by normalized
  //    RUT so the same person can't hammer the action — the key never leaves
  //    this process.
  const normalizedRut = formatRut(rutRaw);
  if (!throttle(cleanRut(rutRaw))) {
    return { status: "error", message: COPY.rateLimited };
  }

  // 5) Build the typed payload.
  const payload: MatchUpRequest = {
    rut: normalizedRut,
    competitor_place: place.slice(0, MAX_PLACE_LEN),
    coffee_name: coffee.slice(0, MAX_COFFEE_LEN),
    competitor_price_clp: price
  };

  // Defense-in-depth: re-validate the shape before the network hop.
  const guard = z.object({
    rut: z.string().regex(/^\d{1,3}(\.\d{3})*-[0-9K]$/),
    competitor_place: z.string().min(1).max(MAX_PLACE_LEN),
    coffee_name: z.string().min(1).max(MAX_COFFEE_LEN),
    competitor_price_clp: z.number().int().positive().max(MAX_PRICE_CLP)
  });
  if (!guard.safeParse(payload).success) {
    return { status: "error", message: COPY.generic };
  }

  const result = await submitMatchUp(payload);

  if (result.ok) {
    return {
      status: "success",
      matchedPriceClp: result.submission.matched_price_clp,
      competitorPriceClp: result.submission.competitor_price_clp,
      competitorPlace: result.submission.competitor_place,
      coffeeName: result.submission.coffee_name
    };
  }

  switch (result.kind) {
    case "duplicate":
      return { status: "duplicate" };
    case "expired":
      return { status: "expired" };
    case "validation":
      // Backend disagreed with our client validation — surface generically so
      // we never leak RUT-shaped detail back into the UI.
      return {
        status: "error",
        message: result.message ?? COPY.generic
      };
    case "rate_limited":
      return { status: "error", message: COPY.rateLimited };
    default:
      // Never log the payload (it carries the RUT) — only the failure kind.
      console.error("[match-up] submit failed:", result.kind);
      return { status: "error", message: COPY.generic };
  }
}
