import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  readJsonBody,
  invalidProxyRequest,
} from "./barra-stock-proxy";
export function kitchenIdSegment(id: string): string | null {
  return /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : null;
}
export async function forwardKitchenWrite(request: NextRequest, path: string) {
  const body = await readJsonBody(request);
  if (!body) return invalidProxyRequest("invalid_request", "Faltan los datos.");
  return forwardStockRequest(request, path, { method: "POST", body });
}
