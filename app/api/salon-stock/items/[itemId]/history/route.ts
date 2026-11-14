import { type NextRequest } from "next/server";
import {
  salonQuery,
  salonId,
} from "../../../../../../src/server/salon-stock-proxy";
import {
  forwardStockRequest,
  invalidProxyRequest,
} from "../../../../../../src/server/barra-stock-proxy";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const id = salonId((await params).itemId),
    query = salonQuery(request, "item");
  if (!id || !query)
    return invalidProxyRequest("invalid_input", "La página no es válida.");
  return forwardStockRequest(
    request,
    `/admin/salon-stock/items/${id}/history${query.size ? "?" + query : ""}`,
  );
}
