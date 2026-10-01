import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_BACKEND_URL = "http://localhost:8080";
const STOCK_PROXY_TIMEOUT_MS = 10_000;

export function resolveStockBackendBaseUrl(): string {
  const explicit = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, "");
  return (process.env.DERIVA_BACKEND_PROXY_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

function noStoreHeaders(contentType?: string): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

function jsonError(status: number, message: string, code?: string): NextResponse {
  return NextResponse.json(
    { error: code ?? "stock_proxy_error", message },
    { status, headers: noStoreHeaders("application/json; charset=utf-8") }
  );
}

function isBearer(value: string | null): value is string {
  return typeof value === "string" && /^Bearer\s+\S+$/i.test(value);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<{ response?: Response; timedOut: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STOCK_PROXY_TIMEOUT_MS);
  try {
    return { response: await fetch(url, { ...init, signal: controller.signal }), timedOut: false };
  } catch (error) {
    return {
      timedOut: error instanceof DOMException && error.name === "AbortError"
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Forward only the fixed route selected by a server route handler. The
 * browser's bearer is passed through unchanged so Firebase remains the sole
 * source of actor identity; no shared Match Up token is involved.
 */
export async function forwardStockRequest(
  request: NextRequest,
  backendPath: string,
  options: { method: "GET" | "POST"; body?: string } = { method: "GET" }
): Promise<NextResponse> {
  const authorization = request.headers.get("authorization");
  if (!isBearer(authorization)) {
    return jsonError(401, "Necesitas iniciar sesión para ver el stock.", "missing_bearer");
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: authorization
  });
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  const { response: upstream, timedOut } = await fetchWithTimeout(
    `${resolveStockBackendBaseUrl()}${backendPath}`,
    {
      method: options.method,
      headers,
      body: options.body,
      cache: "no-store"
    }
  );

  if (!upstream) {
    return jsonError(
      timedOut ? 504 : 502,
      timedOut
        ? "El stock tardó demasiado en responder. Puedes reintentar sin duplicar el ajuste."
        : "No pudimos conectar con el stock. Puedes reintentar sin duplicar el ajuste.",
      timedOut ? "stock_backend_timeout" : "stock_backend_unavailable"
    );
  }

  const responseHeaders = noStoreHeaders(upstream.headers.get("content-type") ?? undefined);
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export async function readJsonBody(request: NextRequest): Promise<string | null> {
  const body = await request.text();
  return body.trim().length > 0 ? body : null;
}

export function stockIdSegment(stockId: string): string | null {
  // IDs are canonical `menu:<id>` or `raw:<id>`. Reject path separators and
  // traversal markers before encoding so the proxy always selects a fixed
  // backend route and never turns user input into a backend path.
  if (!/^(?:menu|raw):[^/\\?#]+$/.test(stockId) || stockId.includes("..")) return null;
  return encodeURIComponent(stockId);
}
