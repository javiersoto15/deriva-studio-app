import { type NextRequest } from "next/server";
import {
  salonWrite,
  salonQuery,
} from "../../../../src/server/salon-stock-proxy";
import {
  forwardStockRequest,
  invalidProxyRequest,
} from "../../../../src/server/barra-stock-proxy";
export function POST(request: NextRequest) {
  return salonWrite(request, "/admin/salon-stock/withdrawals");
}
export function GET(request: NextRequest) {
  const query = salonQuery(request, "withdrawals");
  if (!query)
    return invalidProxyRequest(
      "invalid_input",
      "La página de retiros no es válida.",
    );
  return forwardStockRequest(
    request,
    "/admin/salon-stock/withdrawals" + (query.size ? "?" + query : ""),
  );
}
