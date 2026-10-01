import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  stockIdSegment
} from "../../../../../../src/server/barra-stock-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  const { stockId } = await params;
  const segment = stockIdSegment(stockId);
  if (!segment) {
    return new Response(JSON.stringify({ error: "invalid_stock_id", message: "El artículo no es válido." }), {
      status: 400,
      headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
    });
  }
  return forwardStockRequest(request, `/admin/stock/items/${segment}/history`);
}
