// CSP violation report sink.
//
// The CSP header in middleware.ts is currently `Content-Security-Policy-Report-Only`
// with `report-uri /api/csp-report`, so browsers POST violation reports here.
// We log them; Sentry's global handler picks them up (when DSN is set).
//
// The browser sends `application/csp-report` (legacy) or `application/reports+json`
// (Reporting API). We accept either as raw JSON and log the body shape as-is.
import { NextResponse, type NextRequest } from "next/server";

// Node is the default runtime (Edge is not supported under cacheComponents);
// console output lands in the usual Vercel function logs. We previously set
// `export const runtime = "nodejs"` here, but cacheComponents rejects route
// segment runtime config — removed accordingly.

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    // Single-line log so it groups nicely in Vercel logs / Sentry breadcrumbs.
    console.warn("[csp-report]", JSON.stringify(body));
  } catch (error) {
    console.warn("[csp-report] failed to parse body", error);
  }
  // 204 — no body needed, browser doesn't look at the response.
  return new NextResponse(null, { status: 204 });
}
