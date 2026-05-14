import { type NextRequest, NextResponse } from "next/server";

// Production: host-based routing into Next.js route groups.
// Dev / preview: path-prefix fallback (/app, /staff, /admin → companion/staff/admin).
//
// Route groups in app/ don't add URL segments, so we keep the original pathname
// and rely on Next.js to resolve the segment inside the matching group. The
// "rewrite" really only triggers in path-prefix mode where we strip the prefix.

const COMPANION_PREFIX = "/app";
const STAFF_PREFIX = "/staff";
const ADMIN_PREFIX = "/admin";

function isPreviewHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".vercel.app")
  );
}

export function routeByHost(request: NextRequest): NextResponse {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const url = request.nextUrl.clone();

  // Map host → internal root path. Each surface lives in a route group, but
  // we keep only one `/` page (landing). The other surfaces have their root
  // at `/inicio` inside their own route group, so all four root URLs resolve
  // unambiguously to distinct files.
  const surfaceRoot = {
    companion: "/inicio",
    staff: "/staff",
    admin: "/admin-console"
  } as const;

  function rewriteToSurface(surface: "companion" | "staff" | "admin"): NextResponse {
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = surfaceRoot[surface];
    }
    const headers = new Headers(request.headers);
    headers.set("x-deriva-surface", surface);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (isPreviewHost(host)) {
    if (url.pathname === COMPANION_PREFIX || url.pathname.startsWith(`${COMPANION_PREFIX}/`)) {
      url.pathname = url.pathname.slice(COMPANION_PREFIX.length) || "/inicio";
      if (url.pathname === "/") url.pathname = "/inicio";
      const headers = new Headers(request.headers);
      headers.set("x-deriva-surface", "companion");
      return NextResponse.rewrite(url, { request: { headers } });
    }
    if (url.pathname === STAFF_PREFIX || url.pathname.startsWith(`${STAFF_PREFIX}/`)) {
      url.pathname = url.pathname.slice(STAFF_PREFIX.length) || "/staff";
      if (url.pathname === "/") url.pathname = "/staff";
      const headers = new Headers(request.headers);
      headers.set("x-deriva-surface", "staff");
      return NextResponse.rewrite(url, { request: { headers } });
    }
    if (url.pathname === ADMIN_PREFIX || url.pathname.startsWith(`${ADMIN_PREFIX}/`)) {
      url.pathname = url.pathname.slice(ADMIN_PREFIX.length) || "/admin-console";
      if (url.pathname === "/") url.pathname = "/admin-console";
      const headers = new Headers(request.headers);
      headers.set("x-deriva-surface", "admin");
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return NextResponse.next();
  }

  // Production hosts.
  if (host.startsWith("app.")) return rewriteToSurface("companion");
  if (host.startsWith("staff.")) return rewriteToSurface("staff");
  if (host.startsWith("admin.")) return rewriteToSurface("admin");

  const headers = new Headers(request.headers);
  headers.set("x-deriva-surface", "landing");
  return NextResponse.next({ request: { headers } });
}
