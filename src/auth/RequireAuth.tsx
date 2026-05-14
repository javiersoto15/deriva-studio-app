"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";

// Routes inside the (companion) group that DON'T require an authenticated
// member — the splash, the phone signup flow, the email-verification
// action-link landing (accessed from inbox before the user signs in), and
// the offline fallback. Anything else gets bounced to /inicio when status
// flips to "anonymous".
const PUBLIC_PREFIXES = ["/inicio", "/ingresar", "/verificar-email", "/offline"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

// Companion-wide auth guard. Watches the Firebase auth status and, when
// the user becomes anonymous while on a protected route, clears the React
// Query cache (so we don't paint stale member data after the next sign-in)
// and pushes them to /inicio.
//
// Complements `endSessionAndReturnToInicio()` — that helper handles the
// "we just got a 401" path; this component handles the "Firebase silently
// dropped the user" path (background token refresh failure, expired refresh
// token, account deleted, manual signOut from another tab).
export function RequireAuth() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const queryClient = useQueryClient();
  // Avoid double-firing on rapid status transitions during initial mount.
  const lastHandledAt = useRef<number>(0);

  useEffect(() => {
    if (status !== "anonymous") return;
    if (isPublicPath(pathname)) return;
    const now = Date.now();
    if (now - lastHandledAt.current < 500) return;
    lastHandledAt.current = now;
    // Drop cached member-scoped data so the next sign-in doesn't briefly
    // paint the previous user's profile / balance / activity.
    queryClient.clear();
    router.replace("/inicio");
  }, [status, pathname, router, queryClient]);

  return null;
}
