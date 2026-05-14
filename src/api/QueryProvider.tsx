"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { endSessionAndReturnToInicio } from "../auth/expire-session";
import { useToast } from "../lib/useToast";

// Surfaces an error shape from anywhere in the data layer:
// - apiClient errors carry `status` directly on the error body
// - fetchJson throws Error with `${method} ${path} failed: ${status}` (parsed)
// - RedeemCampaignTokenError carries `status` as a class field
// - network errors / TypeError "Failed to fetch" → null status
function extractStatus(error: unknown): number | null {
  if (!error) return null;
  if (typeof error !== "object") return null;
  const anyErr = error as { status?: unknown; cause?: { status?: unknown }; message?: unknown };
  if (typeof anyErr.status === "number") return anyErr.status;
  if (anyErr.cause && typeof anyErr.cause === "object" && typeof anyErr.cause.status === "number") {
    return anyErr.cause.status;
  }
  // Parse "GET /me failed: 401" tail
  if (typeof anyErr.message === "string") {
    const match = anyErr.message.match(/(\d{3})\s*$/);
    if (match) {
      const n = Number(match[1]);
      if (n >= 100 && n < 600) return n;
    }
  }
  return null;
}

function extractMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const anyErr = error as { message?: unknown; body?: { message?: unknown } };
  if (anyErr.body && typeof anyErr.body === "object") {
    const bodyMsg = (anyErr.body as { message?: unknown }).message;
    if (typeof bodyMsg === "string" && bodyMsg.trim().length > 0) return bodyMsg;
  }
  if (typeof anyErr.message === "string" && anyErr.message.trim().length > 0) {
    return anyErr.message;
  }
  return null;
}

// Global error → toast mapping per Phase 1B spec.
// Mutations/queries that surface their own inline error UX can opt out via
// `meta: { silent: true }`.
function handleGlobalError(error: unknown, silent?: boolean): void {
  const status = extractStatus(error);

  // 401 always fires the session-end ramp, even on queries marked silent —
  // a stuck-but-unauthenticated UI is worse than a duplicate toast.
  // The helper signs out of Firebase (so the SDK doesn't re-attach the
  // rejected token), clears the toast, and redirects to /inicio.
  if (status === 401) {
    void endSessionAndReturnToInicio({ reason: "expired" });
    return;
  }

  // 403 on a non-silent call means Firebase still believes we're signed in
  // but the Deriva backend rejected the bearer — usually because the
  // user_profile is gone, revoked, or was never created. Without this
  // branch the app stays "logged in" while every /me/* query 403s forever
  // and the UI hangs on skeletons. Silent mutations (e.g., useConfirmPhone
  // where 403 = token missing phone_number claim) handle their own 403
  // inline and shouldn't trip this ramp — they're recoverable in context.
  if (status === 403 && !silent) {
    void endSessionAndReturnToInicio({ reason: "forbidden" });
    return;
  }

  if (silent) return;

  const { push } = useToast.getState();

  if (status === 410) {
    push({
      variant: "warn",
      line: "CÓDIGO VENCIDO",
      italic: "Vuelve a abrirlo desde tu Cartera."
    });
    return;
  }

  if (status === 409) {
    // IdentityConflict (email_taken / phone_taken / provider_taken /
    // last_method_cant_remove) is owned by the inline manual-resolution UX —
    // do not preempt with a generic toast. Identity-mutation hooks also flag
    // themselves with meta.silent so this branch is defensive.
    const body = (error as { error?: { code?: string } } | null)?.error
      ?? (error as { body?: { code?: string } } | null)?.body
      ?? (error as { code?: string } | null);
    const code = typeof body === "object" && body && typeof (body as { code?: unknown }).code === "string"
      ? (body as { code: string }).code
      : null;
    if (
      code === "email_taken" ||
      code === "phone_taken" ||
      code === "provider_taken" ||
      code === "last_method_cant_remove"
    ) {
      return;
    }
    const bodyMsg = extractMessage(error);
    push({
      variant: "warn",
      line: "CONFLICTO",
      italic: bodyMsg ?? "Inténtalo otra vez."
    });
    return;
  }

  if (status === 404 || (status !== null && status >= 500 && status < 600)) {
    push({
      variant: "error",
      line: "ALGO SE INTERRUMPIÓ",
      italic: "Inténtalo en un momento."
    });
    return;
  }

  if (status === null) {
    // Network / offline / unknown
    push({
      variant: "warn",
      line: "SIN CONEXIÓN",
      italic: "Revisamos tu conexión."
    });
    return;
  }

  // Other 4xx — fall through with the generic interruption surface.
  push({
    variant: "error",
    line: "ALGO SE INTERRUMPIÓ",
    italic: "Inténtalo en un momento."
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const queryCache = new QueryCache({
      onError: (error, query) => {
        const silent = Boolean(
          (query.options.meta as { silent?: boolean } | undefined)?.silent
        );
        handleGlobalError(error, silent);
      }
    });
    const mutationCache = new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        const silent = Boolean(
          (mutation.options.meta as { silent?: boolean } | undefined)?.silent
        );
        handleGlobalError(error, silent);
      }
    });
    return new QueryClient({
      queryCache,
      mutationCache,
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          retry: 1,
          // Tab-back-after-hours used to show stale data forever because no
          // event triggered a refetch on a long-open mount. Window focus is
          // the canonical "user is paying attention again" signal — refetch
          // any stale query when they come back. Per-hook overrides still
          // apply (e.g., ["me"]/["me","profile"] use staleTime:0 so they
          // refetch unconditionally on focus).
          refetchOnWindowFocus: true,
          refetchOnReconnect: true
        }
      }
    });
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    // MSW switch — defaults ON for offline UI work. Set
    // NEXT_PUBLIC_USE_MSW=false in .env.local to talk to the real Go backend
    // at NEXT_PUBLIC_API_BASE_URL (e.g., when running api-up-firebase-emulator).
    //
    // When the flag flips to "false" we MUST also actively unregister any
    // previously-installed mockServiceWorker.js — without this, the SW from
    // a prior dev session keeps intercepting /me/* requests and returning
    // stale fixture data even though we're not calling startMockServiceWorker.
    // The worker lives in the browser per-origin, so flipping the env flag
    // alone is not enough.
    if (process.env.NEXT_PUBLIC_USE_MSW === "false") {
      if (typeof navigator !== "undefined" && navigator.serviceWorker) {
        void navigator.serviceWorker.getRegistrations().then((regs) =>
          Promise.all(
            regs
              .filter((r) => r.active?.scriptURL.endsWith("/mockServiceWorker.js"))
              .map((r) => r.unregister())
          )
        );
      }
      return;
    }
    void import("../mocks/browser").then(({ startMockServiceWorker }) =>
      startMockServiceWorker()
    );
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
