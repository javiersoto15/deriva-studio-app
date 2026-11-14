import { type NextRequest } from "next/server";
import { kitchenIdSegment } from "../../../../../../src/server/kitchen-stock-proxy";
import {
  forwardStockRequest,
  invalidProxyRequest,
} from "../../../../../../src/server/barra-stock-proxy";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const id = kitchenIdSegment((await params).itemId);
  if (!id)
    return invalidProxyRequest(
      "invalid_item_id",
      "El ingrediente no es válido.",
    );
  const query = new URLSearchParams();
  for (const key of ["limit", "before_revision"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) {
      if (!/^\d+$/.test(value))
        return invalidProxyRequest("invalid_cursor", "La página no es válida.");
      query.set(key, value);
    }
  }
  return forwardStockRequest(
    request,
    `/admin/kitchen-stock/items/${id}/history${query.size ? "?" + query.toString() : ""}`,
  );
}
