import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  invalidProxyRequest,
} from "../../../src/server/barra-stock-proxy";
import { salonQuery } from "../../../src/server/salon-stock-proxy";
export function GET(request: NextRequest) {
  const query = salonQuery(request, "list");
  if (!query)
    return invalidProxyRequest("invalid_input", "La búsqueda no es válida.");
  return forwardStockRequest(
    request,
    "/admin/salon-stock" + (query.size ? "?" + query : ""),
  );
}
