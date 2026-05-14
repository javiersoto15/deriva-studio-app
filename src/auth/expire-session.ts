"use client";

// Central exit ramp for any path that loses a valid session — 401 from the
// backend, getIdToken() refresh failure, or an explicit "force sign out"
// from anywhere in the UI.
//
// Why this exists: until now the 401 handler set a pending redirect but
// never called Firebase signOut. The Firebase SDK kept the user alive
// locally and re-attached its (now-rejected) cached token to the next
// request, producing a 401 cascade. This helper makes sure local Firebase
// state, the toast queue, and the navigation target all agree.

import { signOut as fbSignOut } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { useToast } from "../lib/useToast";

export type SessionEndReason = "expired" | "refresh-failed" | "forbidden" | "manual";

// Guard against re-entry. Multiple in-flight queries can all see the same
// 401 in the same tick; we only want one Firebase signOut + one toast.
let inFlight = false;

export async function endSessionAndReturnToInicio(
  opts: { reason?: SessionEndReason } = {}
): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  const reason: SessionEndReason = opts.reason ?? "expired";

  try {
    try {
      await fbSignOut(getFirebaseAuth());
    } catch {
      // Firebase already signed out, or never configured — non-fatal.
      // The redirect path below still fires.
    }

    if (reason !== "manual") {
      // Manual signouts emit their own confirmation toast at the call site.
      // 401 / refresh failures share the "session expired" framing. 403
      // means the bearer is technically valid but the backend rejected it
      // for this resource — most likely because the Deriva user_profile
      // doesn't exist or was revoked. Distinct copy so the user knows it
      // isn't a "your code expired" problem.
      const copy =
        reason === "forbidden"
          ? { line: "SIN ACCESO", italic: "Vuelve a entrar para continuar." }
          : { line: "SESIÓN EXPIRADA", italic: "Vuelve a entrar con tu número." };
      useToast.getState().push({ variant: "warn", ...copy });
    }
    useToast.getState().setPendingRedirect("/inicio");
  } finally {
    // Release the in-flight latch after the redirect has a chance to fire
    // and any same-tick 401s have been swallowed. 1s is well past the
    // Toaster's 250 ms bridge.
    setTimeout(() => {
      inFlight = false;
    }, 1000);
  }
}
