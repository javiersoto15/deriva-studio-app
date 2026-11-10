import { NextResponse, type NextRequest } from "next/server";

const PRODUCTION_ADMIN_HOSTNAME = "admin.derivastudio.cl";
const STATE_COOKIE_NAME = "__Host-uber_eats_oauth_state";
const START_PATH = "/admin/integrations/uber-eats/oauth/start";
const CALLBACK_PATH = "/integrations/uber-eats/oauth/callback";
const PROXY_TIMEOUT_MS = 15_000;

function backendBaseUrl(): string {
  const explicit = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, "");
  return (process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

function responseHeaders(contentType = "application/json; charset=utf-8"): Headers {
  return new Headers({
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Content-Type": contentType
  });
}

function jsonResponse(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ error, message }, { status, headers: responseHeaders() });
}

function isAllowedHost(request: NextRequest): boolean {
  const host = (request.headers.get("host") ?? request.nextUrl.host).trim().toLowerCase();
  if (!host || host.includes(",") || host.includes(" ")) return false;

  const configuredAdminHost = process.env.UBER_EATS_ADMIN_HOSTNAME === undefined
    ? PRODUCTION_ADMIN_HOSTNAME
    : process.env.UBER_EATS_ADMIN_HOSTNAME.trim().toLowerCase();
  if (configuredAdminHost === PRODUCTION_ADMIN_HOSTNAME && host === PRODUCTION_ADMIN_HOSTNAME) return true;

  const configuredLocalHost = process.env.UBER_EATS_LOCAL_HOSTNAME?.trim().toLowerCase();
  if (process.env.NODE_ENV !== "development" || !configuredLocalHost || host !== configuredLocalHost) return false;
  try {
    const parsed = new URL(`http://${configuredLocalHost}`);
    return ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname) && parsed.host === configuredLocalHost;
  } catch {
    return false;
  }
}

function validBearer(value: string | null): value is string {
  return typeof value === "string" && /^Bearer\s+\S+$/i.test(value);
}

function genericUpstreamFailure(status: number, callback: boolean): { status: number; error: string; message: string } {
  if (status === 401) {
    return { status, error: "missing_bearer", message: "Inicia sesión para continuar." };
  }
  if (status === 403) {
    return { status, error: "owner_required", message: "Necesitas permisos de propietario para continuar." };
  }
  if (status === 400) {
    return {
      status,
      error: "uber_eats_callback_invalid",
      message: "Uber Eats authorization could not be completed. Restart the connection and try again."
    };
  }
  if (status === 503) {
    return { status, error: "uber_eats_integration_unavailable", message: "Uber Eats integration is not configured." };
  }
  if (status >= 500) {
    return {
      status: status === 502 ? 502 : 503,
      error: callback ? "uber_eats_provider_unavailable" : "uber_eats_backend_unavailable",
      message: callback
        ? "Uber Eats authorization could not be completed. Restart the connection and try again."
        : "Uber Eats authorization is temporarily unavailable. Try again shortly."
    };
  }
  return { status: 502, error: "uber_eats_backend_unavailable", message: "Uber Eats authorization is temporarily unavailable." };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<{ response?: Response; timedOut: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    return {
      response: await fetch(url, { ...init, signal: controller.signal, cache: "no-store", redirect: "error" }),
      timedOut: false
    };
  } catch (error) {
    return { timedOut: error instanceof DOMException && error.name === "AbortError" };
  } finally {
    clearTimeout(timeout);
  }
}

async function forward(
  path: string,
  options: { method: "POST"; authorization?: string; body?: string; callback?: boolean }
): Promise<NextResponse> {
  const { response: upstream, timedOut } = await fetchWithTimeout(`${backendBaseUrl()}${path}`, {
    method: options.method,
    headers: {
      Accept: "application/json",
      ...(options.authorization ? { Authorization: options.authorization } : {}),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {})
    },
    body: options.body
  });

  if (!upstream) {
    const error = genericUpstreamFailure(timedOut ? 504 : 502, Boolean(options.callback));
    return jsonResponse(error.status, error.error, error.message);
  }

  const headers = responseHeaders(upstream.headers.get("content-type") ?? "application/json; charset=utf-8");
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) headers.append("Set-Cookie", setCookie);

  if (!upstream.ok) {
    const error = genericUpstreamFailure(upstream.status, Boolean(options.callback));
    return NextResponse.json(
      { error: error.error, message: error.message },
      { status: error.status, headers }
    );
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

export async function startUberEatsOAuth(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedHost(request)) {
    return jsonResponse(404, "not_found", "Not found.");
  }

  const authorization = request.headers.get("authorization");
  if (!validBearer(authorization)) {
    return jsonResponse(401, "missing_bearer", "Inicia sesión para continuar.");
  }

  return forward(START_PATH, { method: "POST", authorization });
}

function singleQueryValue(request: NextRequest, key: string, maximumLength: number): string {
  const values = request.nextUrl.searchParams.getAll(key);
  if (values.length !== 1 || values[0].length > maximumLength) return "";
  return values[0];
}

export async function completeUberEatsOAuth(request: NextRequest): Promise<NextResponse> {
  if (!isAllowedHost(request)) {
    return jsonResponse(404, "not_found", "Not found.");
  }

  const cookie = request.cookies.get(STATE_COOKIE_NAME)?.value ?? "";
  const cookieFits = cookie.length <= 2048;
  const providerDenied = request.nextUrl.searchParams.has("error");
  const body = JSON.stringify({
    denied: providerDenied,
    code: providerDenied || !cookieFits ? "" : singleQueryValue(request, "code", 4096),
    state: providerDenied || !cookieFits ? "" : singleQueryValue(request, "state", 512),
    state_cookie: cookieFits ? cookie : ""
  });

  return forward(CALLBACK_PATH, { method: "POST", body, callback: true });
}
