import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  readJsonBody,
  invalidProxyRequest,
} from "./barra-stock-proxy";
export function salonId(id: string): string | null {
  return /^salon_[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
}
export async function salonWrite(request: NextRequest, path: string) {
  const body = await readJsonBody(request);
  if (!body) return invalidProxyRequest("invalid_input", "Faltan los datos.");
  return forwardStockRequest(request, path, { method: "POST", body });
}
export function salonQuery(
  request: NextRequest,
  kind: "list" | "item" | "withdrawals",
): URLSearchParams | null {
  const out = new URLSearchParams();
  const allowed =
    kind === "list"
      ? ["location", "q"]
      : kind === "item"
        ? ["limit", "before_revision"]
        : ["limit", "before_sequence", "location", "taker"];
  for (const key of request.nextUrl.searchParams.keys())
    if (!allowed.includes(key)) return null;
  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value === null) continue;
    if (
      key === "location" &&
      !["fridge", "storage", "cleaning"].includes(value)
    )
      return null;
    if (kind === "withdrawals" && key === "location" && value === "fridge")
      return null;
    if (
      key === "limit" &&
      (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)
    )
      return null;
    if (
      key.startsWith("before_") &&
      (!/^\d+$/.test(value) ||
        !Number.isSafeInteger(Number(value)) ||
        Number(value) < 1)
    )
      return null;
    out.set(key, value);
  }
  if (out.has("q") && !out.has("location")) return null;
  return out;
}
