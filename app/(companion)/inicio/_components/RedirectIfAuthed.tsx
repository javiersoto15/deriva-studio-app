"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "../../../../src/auth/use-auth";

// Phase 2B.3 — Client island for /inicio.
// The splash UI is fully server-rendered; this component hydrates only to
// observe the auth state and push the user into /carta if they're already
// signed in. It renders nothing.
export function RedirectIfAuthed() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/hoy");
    }
  }, [status, router]);

  return null;
}
