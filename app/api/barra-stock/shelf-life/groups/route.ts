import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  invalidProxyRequest,
  readJsonBody
} from "../../../../../src/server/barra-stock-proxy";

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) return invalidProxyRequest("invalid_request", "Falta el cuerpo de la solicitud.");
  return forwardStockRequest(request, "/admin/stock/shelf-life/groups", { method: "POST", body });
}
