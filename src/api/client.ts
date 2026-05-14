import createClient, { type Middleware } from "openapi-fetch";
import * as Sentry from "@sentry/nextjs";
import { endSessionAndReturnToInicio } from "../auth/expire-session";
import { getFirebaseAuth } from "../auth/firebase";
import type { paths } from "./schema";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// Generates a correlation ID for the request. Prefers Web Crypto's randomUUID,
// falls back to a Math.random-based UUID v4 shape if unavailable (older runtimes).
function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback. Not cryptographically strong, but fine as a correlation ID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Attempts to extract a W3C traceparent from the currently-active Sentry span.
// Sentry's API has moved around between SDK versions, so we feature-detect both
// `getActiveSpan` and `spanToTraceHeader`. If either is missing we silently skip
// traceparent — the backend still gets X-Request-Id for correlation.
function buildTraceparent(): string | undefined {
  const sentryUnknown = Sentry as unknown as {
    getActiveSpan?: () => unknown;
    spanToTraceHeader?: (span: unknown) => string | undefined;
  };
  if (typeof sentryUnknown.getActiveSpan !== "function") return undefined;
  if (typeof sentryUnknown.spanToTraceHeader !== "function") return undefined;
  const span = sentryUnknown.getActiveSpan();
  if (!span) return undefined;
  try {
    return sentryUnknown.spanToTraceHeader(span);
  } catch {
    return undefined;
  }
}

const tracingMiddleware: Middleware = {
  async onRequest({ request }) {
    // Temporarily disabled in production: the Cloud Run backend's CORS
    // preflight response does not yet include X-Request-Id (nor traceparent)
    // in Access-Control-Allow-Headers, so the browser rejects requests that
    // carry them. Re-enable both lines once the backend allowlists these.
    //
    // request.headers.set("X-Request-Id", generateRequestId());
    // const traceparent = buildTraceparent();
    // if (traceparent) request.headers.set("traceparent", traceparent);
    void generateRequestId;
    void buildTraceparent;
    return request;
  }
};

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    let current;
    try {
      current = getFirebaseAuth().currentUser;
    } catch {
      // Firebase not configured in dev — skip the header entirely.
      return request;
    }
    if (!current) return request;

    try {
      const token = await current.getIdToken();
      request.headers.set("Authorization", `Bearer ${token}`);
    } catch (err) {
      // getIdToken() throws when the cached token is stale AND the silent
      // refresh fails (revoked refresh token, account deleted, hard network
      // failure on Firebase's token endpoint). The Firebase SDK still
      // believes the user is signed in, but no future API call can succeed
      // — so we end the session here rather than letting the request fly
      // unauthenticated and 401-cascade. The same exit ramp handles the
      // /inicio redirect, toast, and Firebase signOut.
      console.warn("[Deriva] token refresh failed; ending session", err);
      void endSessionAndReturnToInicio({ reason: "refresh-failed" });
    }
    return request;
  }
};

export const apiClient = createClient<paths>({ baseUrl });
// Order matters: tracing first so the correlation ID is on every request even if
// the auth step throws or short-circuits.
apiClient.use(tracingMiddleware);
apiClient.use(authMiddleware);
