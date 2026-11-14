import { type NextRequest } from "next/server";
import { forwardStockRequest } from "../../../src/server/barra-stock-proxy";
export function GET(request: NextRequest) {
  return forwardStockRequest(request, "/admin/kitchen-stock");
}
