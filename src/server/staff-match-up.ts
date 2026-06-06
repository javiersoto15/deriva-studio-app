"use server";

import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

// PIN gate for the staff-operated Deriva Match Up tool (staff.derivastudio.cl/
// match-up). A single shared passcode — stored as MATCH_UP_STAFF_PIN in Vercel
// — unlocks the form on a counter device. This is the interim gate until the
// broader per-staff auth project ships; see
// docs/superpowers/specs/2026-06-05-deriva-match-up-staff-design.md.
//
// We never store the raw PIN in the cookie: the cookie holds an opaque token
// derived from the PIN (sha256), and the page re-derives + compares. Forging a
// session therefore requires knowing the PIN.

const COOKIE_NAME = "deriva_matchup_staff";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h — one shift.

export type StaffUnlockState =
  | { status: "idle" }
  // "ok" tells the client to router.refresh() so the server component re-reads
  // the freshly-set cookie and swaps the unlock screen for the form.
  | { status: "ok" }
  | { status: "error"; message: string };

function pinFromEnv(): string {
  return process.env.MATCH_UP_STAFF_PIN ?? "";
}

// Opaque cookie token = sha256(pin). Not reversible to the PIN; matching it
// requires knowing the PIN that produced it.
function sessionToken(pin: string): string {
  return createHash("sha256").update(`deriva-matchup:${pin}`).digest("hex");
}

// Constant-time string compare that doesn't leak length via early return.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Compare against self to keep timing uniform, then fail.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

/** Server-side check used by the staff page to decide unlock vs. form. */
export async function isStaffUnlocked(): Promise<boolean> {
  const pin = pinFromEnv();
  if (!pin) return false; // No PIN configured → tool stays locked.
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, sessionToken(pin));
}

/** Unlock action behind the PIN form. */
export async function unlockStaffMatchUp(
  _previous: StaffUnlockState,
  formData: FormData
): Promise<StaffUnlockState> {
  const pin = pinFromEnv();
  if (!pin) {
    // Misconfiguration — never reveal which side is missing.
    return { status: "error", message: "El acceso no está disponible ahora." };
  }

  const entered =
    typeof formData.get("pin") === "string"
      ? (formData.get("pin") as string).trim()
      : "";

  if (!entered || !safeEqual(entered, pin)) {
    return { status: "error", message: "Código incorrecto." };
  }

  (await cookies()).set(COOKIE_NAME, sessionToken(pin), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    // Host-scoped only — path "/" so the cookie is sent both at the prod URL
    // (admin.derivastudio.cl/match-up) and the dev URL (/admin/match-up).
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
  return { status: "ok" };
}

/** Sign-out action ("Cerrar sesión"). */
export async function signOutStaffMatchUp(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_NAME, path: "/" });
}
