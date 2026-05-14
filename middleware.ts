import { type NextRequest, NextResponse } from "next/server";
import { routeByHost } from "./src/middleware/host";

// Paths that don't execute scripts and so don't benefit from CSP. Skipping them
// also avoids paying the per-request nonce/header cost on hot static assets.
const CSP_SKIP_PREFIXES = [
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/api/csp-report"
];

function shouldSkipCsp(pathname: string): boolean {
  return CSP_SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function generateNonce(): string {
  // btoa() in middleware (edge runtime) is fine on the UUID string.
  // The resulting nonce is 48 base64 chars — well above the CSP-recommended 128 bits of entropy.
  return btoa(crypto.randomUUID());
}

// CSP connect-src is composed from a base set + the live backend origin.
// In dev we additionally allow localhost backend + Firebase Auth emulator so
// the dev server doesn't need separate config. In production NEXT_PUBLIC_API_BASE_URL
// must be set to the Cloud Run service URL (e.g. https://deriva-companion-xyz.run.app).
function backendOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const backend = backendOrigin();
  const connectSrc = [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseapp.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://*.ingest.sentry.io",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-analytics.com",
    backend ?? "",
    // Apple Sign-In completes inside a Firebase popup, but the popup itself
    // chats with appleid.apple.com — keep it on the allowlist so the SSO flow
    // doesn't break under enforced CSP.
    "https://appleid.apple.com",
    // Dev-only: Firebase Auth emulator + local Go backend. Stripped in prod.
    isDev ? "http://localhost:9099 ws://localhost:9099 http://localhost:8080" : ""
  ]
    .filter(Boolean)
    .join(" ");

  // Enforced policy. Host allowlists are explicit instead of using
  // 'strict-dynamic' because some third-party components (e.g. Vercel
  // Analytics, Speed Insights) render their own <script> tags without a
  // way to consume the per-request nonce — strict-dynamic would silently
  // block them. The hybrid nonce + explicit-host allowlist is slightly
  // less strict but reliably covers our SDK surface.
  const policy = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://*.googleapis.com https://*.gstatic.com https://*.firebaseapp.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https:;
    connect-src ${connectSrc};
    frame-src 'self' https://*.firebaseapp.com https://appleid.apple.com;
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
    report-uri /api/csp-report;
  `;
  return policy.replace(/\s{2,}/g, " ").trim();
}

export function middleware(request: NextRequest): NextResponse {
  // Preserve all existing host-routing behaviour unchanged.
  const response = routeByHost(request);

  if (shouldSkipCsp(request.nextUrl.pathname)) {
    return response;
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // Make the nonce readable from Server Components / pages via the request
  // header. Pages can read it from `headers()` and stamp it onto inline
  // <script nonce={...}> tags. Today nothing reads x-nonce yet, but having
  // it available unblocks the future flip from report-only to enforced.
  response.headers.set("x-nonce", nonce);

  // Enforced. report-uri inside the policy still emits violation reports to
  // /api/csp-report, so we keep observability while blocking offenders.
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  // Match everything except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)"]
};
