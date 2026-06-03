"use server";

import { z } from "zod";
import {
  submitPublicReview,
  type PublicReviewRequest
} from "../api/reviews";

// Server action behind the public review form. Mirrors the waitlist action:
// zod validation + honeypot + timing gate + light throttling, then hands a
// clean typed payload to the `src/api/reviews.ts` client. The action is the
// trust boundary the client form posts through — the browser never talks to the
// backend directly, so the Cloud Run host stays server-side and CORS is moot.

export type ReviewFieldErrors = Partial<
  Record<
    | "rating_overall"
    | "review_body"
    | "visit_date"
    | "item"
    | "contact_email"
    | "contact_phone",
    string
  >
>;

export type ReviewFormState =
  | { status: "idle" }
  | { status: "success"; reviewId?: string }
  | { status: "error"; message: string; fieldErrors?: ReviewFieldErrors };

// Bots submit instantly; a real person needs seconds to read + type. Anything
// faster than this is treated as automation. The client stamps `render_started`
// (ms epoch) when the form mounts.
const MIN_FILL_MS = 3000;
const MAX_BODY = 1200;
const MIN_BODY = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\s-]{6,20}$/;

const COPY = {
  generic: "No pudimos guardar tu reseña. Inténtalo de nuevo en un momento.",
  rateLimited: "Recibimos varias reseñas tuyas. Dale un respiro e inténtalo más tarde.",
  spam: "No pudimos validar tu envío. Vuelve a intentarlo.",
  fieldRating: "Elige una valoración de 1 a 5.",
  fieldBodyShort: "Cuéntanos un poco más — al menos 20 caracteres.",
  fieldBodyLong: "Tu reseña es muy larga (máximo 1200 caracteres).",
  fieldDateMissing: "Indica la fecha de tu visita.",
  fieldDateFuture: "La fecha de tu visita no puede ser en el futuro.",
  fieldItem: "Cuéntanos qué probaste, o marca “Solo el lugar”.",
  fieldEmail: "Revisa tu correo.",
  fieldPhone: "Revisa tu teléfono."
} as const;

// Light per-process throttle keyed by contact when present. The backend owns
// authoritative throttling; this just blunts trivial repeat-spam in the action.
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

export async function submitReview(
  _previous: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
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
  const ratingRaw = Number(str(formData, "rating_overall"));
  const body = str(formData, "review_body");
  const visitDate = str(formData, "visit_date");
  const itemName = str(formData, "item_name");
  const placeOnly = str(formData, "place_only") === "on";
  const displayName = str(formData, "display_name");
  const email = str(formData, "contact_email");
  const phone = str(formData, "contact_phone");
  const consent = str(formData, "consent_to_contact") === "on";

  const fieldErrors: ReviewFieldErrors = {};

  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    fieldErrors.rating_overall = COPY.fieldRating;
  }
  if (body.length < MIN_BODY) {
    fieldErrors.review_body = COPY.fieldBodyShort;
  } else if (body.length > MAX_BODY) {
    fieldErrors.review_body = COPY.fieldBodyLong;
  }

  if (!visitDate) {
    fieldErrors.visit_date = COPY.fieldDateMissing;
  } else {
    const parsed = new Date(`${visitDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      fieldErrors.visit_date = COPY.fieldDateMissing;
    } else {
      // Compare on calendar dates; a visit "today" is valid.
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsed.getTime() > today.getTime()) {
        fieldErrors.visit_date = COPY.fieldDateFuture;
      }
    }
  }

  // Item context requirement: a free-text item OR the place-only toggle.
  if (!placeOnly && itemName.length === 0) {
    fieldErrors.item = COPY.fieldItem;
  }

  if (email && !EMAIL_RE.test(email)) {
    fieldErrors.contact_email = COPY.fieldEmail;
  }
  if (phone && !PHONE_RE.test(phone)) {
    fieldErrors.contact_phone = COPY.fieldPhone;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: COPY.generic, fieldErrors };
  }

  // 4) Throttle (best-effort; backend is authoritative).
  const throttleKey = email || phone || "anon";
  if (throttleKey !== "anon" && !throttle(throttleKey)) {
    return { status: "error", message: COPY.rateLimited };
  }

  // 5) Build the typed payload. Place-only wins over a stray item string.
  const payload: PublicReviewRequest = {
    rating_overall: ratingRaw,
    review_body: body,
    visit_date: visitDate,
    consent_to_contact: consent,
    language: "es-CL"
  };
  if (placeOnly) {
    payload.review_context = "place_only";
  } else if (itemName) {
    payload.item_name = itemName.slice(0, 120);
  }
  if (displayName) payload.display_name = displayName.slice(0, 80);
  if (email) payload.contact_email = email.toLowerCase();
  if (phone) payload.contact_phone = phone;

  // Defense-in-depth: re-validate the shape before the network hop.
  const guard = z.object({
    rating_overall: z.number().int().min(1).max(5),
    review_body: z.string().min(MIN_BODY).max(MAX_BODY),
    visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  });
  if (!guard.safeParse(payload).success) {
    return { status: "error", message: COPY.generic };
  }

  const result = await submitPublicReview(payload);

  if (result.ok) {
    return { status: "success", reviewId: result.review.id || undefined };
  }

  switch (result.kind) {
    case "validation":
      // Backend disagreed with our client validation — surface generically.
      return { status: "error", message: result.message ?? COPY.generic };
    case "rate_limited":
      return { status: "error", message: COPY.rateLimited };
    default:
      console.error("[reviews] submit failed:", result.kind, result);
      return { status: "error", message: COPY.generic };
  }
}
