import { type NextRequest, NextResponse } from "next/server";

// Production: host-based routing + path-prefix gating into Next.js route groups.
// Dev / preview: path-prefix fallback (/app, /staff, /admin → companion/staff/admin).
//
// Route groups in app/ don't add URL segments, so /inicio resolves against
// (companion)/inicio/page.tsx regardless of host. That means we have to gate
// at the path level: each host is allowed to serve only the top-level path
// segments owned by its surface, plus shared infra (Next chunks, /api, service
// worker, manifest, sitemap, robots, icons). Anything else gets redirected
// (302) to the host's surface root.

const COMPANION_PREFIX = "/app";
const STAFF_PREFIX = "/staff";
const ADMIN_PREFIX = "/admin";

// Top-level segments served on every host: framework + PWA + crawler files.
// Service worker, manifest, and Next chunks are loaded under the same paths
// on both surfaces — they must never be redirected.
const SHARED_INFRA_PREFIXES = [
  "/_next",
  "/api",
  "/sw.js",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/opengraph-image",
  // Static assets served from public/ that both surfaces reference (logos,
  // isotipos, OG fallbacks, email artwork). Any new top-level public/ folder
  // accessed from both hosts needs to be added here.
  "/brand"
] as const;

// Top-level path segments owned by the landing surface (apex host).
// Mirrors directories under app/(landing)/. Add a new entry here whenever a
// new top-level route is added to the landing route group. Nested routes
// (e.g. /menu/foo) ride along under their parent prefix.
const LANDING_PREFIXES = [
  "/menu",
  "/menu-display",
  "/abierto",
  "/privacidad",
  "/unsubscribe"
] as const;

// Top-level path segments owned by the companion surface (app. host).
// Mirrors directories under app/(companion)/.
const COMPANION_PREFIXES = [
  "/inicio",
  "/carta",
  "/cartera",
  "/codigo",
  "/canjear",
  "/actividad",
  "/estudio",
  "/favoritos",
  "/feedback",
  "/ingresar",
  "/sumar-visita",
  "/verificar-email",
  "/offline"
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isSharedInfra(pathname: string): boolean {
  return matchesPrefix(pathname, SHARED_INFRA_PREFIXES);
}

function isPreviewHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".vercel.app")
  );
}

function withSurfaceHeader(
  request: NextRequest,
  surface: "landing" | "companion" | "staff" | "admin"
): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-deriva-surface", surface);
  return headers;
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  // 302 (not 308): wrong-host visits may be bookmarked. Keeping the redirect
  // non-permanent leaves room to change the gating rule later without
  // browsers caching the redirect into oblivion.
  return NextResponse.redirect(url, 302);
}

export function routeByHost(request: NextRequest): NextResponse {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Dev / preview: keep the path-prefix fallback so we can exercise each
  // surface on localhost / *.vercel.app without DNS. No allowlist gating
  // here — previews are for testing, not production traffic.
  if (isPreviewHost(host)) {
    if (pathname === COMPANION_PREFIX || pathname.startsWith(`${COMPANION_PREFIX}/`)) {
      url.pathname = pathname.slice(COMPANION_PREFIX.length) || "/inicio";
      if (url.pathname === "/") url.pathname = "/inicio";
      return NextResponse.rewrite(url, {
        request: { headers: withSurfaceHeader(request, "companion") }
      });
    }
    if (pathname === STAFF_PREFIX || pathname.startsWith(`${STAFF_PREFIX}/`)) {
      url.pathname = pathname.slice(STAFF_PREFIX.length) || "/staff";
      if (url.pathname === "/") url.pathname = "/staff";
      return NextResponse.rewrite(url, {
        request: { headers: withSurfaceHeader(request, "staff") }
      });
    }
    if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
      url.pathname = pathname.slice(ADMIN_PREFIX.length) || "/admin-console";
      if (url.pathname === "/") url.pathname = "/admin-console";
      return NextResponse.rewrite(url, {
        request: { headers: withSurfaceHeader(request, "admin") }
      });
    }
    return NextResponse.next({
      request: { headers: withSurfaceHeader(request, "landing") }
    });
  }

  // Production hosts. Each branch gates its allowlist + redirects strays.

  // app.derivastudio.cl — companion surface.
  if (host.startsWith("app.")) {
    if (isSharedInfra(pathname)) {
      return NextResponse.next({
        request: { headers: withSurfaceHeader(request, "companion") }
      });
    }
    if (pathname === "/" || pathname === "") {
      url.pathname = "/inicio";
      return NextResponse.rewrite(url, {
        request: { headers: withSurfaceHeader(request, "companion") }
      });
    }
    if (matchesPrefix(pathname, COMPANION_PREFIXES)) {
      return NextResponse.rewrite(url, {
        request: { headers: withSurfaceHeader(request, "companion") }
      });
    }
    // Landing path landed on the app host — bounce to the companion root.
    return redirectTo(request, "/inicio");
  }

  // staff. / admin. — not yet public. Keep the existing rewrite-only behavior
  // (no allowlist gating) until those surfaces ship. Shared infra still passes.
  if (host.startsWith("staff.")) {
    if (pathname === "/" || pathname === "") url.pathname = "/staff";
    return NextResponse.rewrite(url, {
      request: { headers: withSurfaceHeader(request, "staff") }
    });
  }
  if (host.startsWith("admin.")) {
    if (pathname === "/" || pathname === "") url.pathname = "/admin-console";
    return NextResponse.rewrite(url, {
      request: { headers: withSurfaceHeader(request, "admin") }
    });
  }

  // Apex (derivastudio.cl) — landing surface.
  if (isSharedInfra(pathname)) {
    return NextResponse.next({
      request: { headers: withSurfaceHeader(request, "landing") }
    });
  }
  if (pathname === "/" || pathname === "") {
    return NextResponse.next({
      request: { headers: withSurfaceHeader(request, "landing") }
    });
  }
  if (matchesPrefix(pathname, LANDING_PREFIXES)) {
    return NextResponse.next({
      request: { headers: withSurfaceHeader(request, "landing") }
    });
  }
  // Companion path landed on the apex host — bounce home.
  return redirectTo(request, "/");
}
