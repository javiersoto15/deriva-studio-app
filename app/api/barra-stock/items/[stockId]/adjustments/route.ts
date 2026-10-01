import { revalidateTag } from "next/cache";
import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  readJsonBody,
  stockIdSegment
} from "../../../../../../src/server/barra-stock-proxy";

export async function POST(
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
  const body = await readJsonBody(request);
  if (!body) {
    return new Response(JSON.stringify({ error: "invalid_request", message: "Falta el cuerpo de la solicitud." }), {
      status: 400,
      headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
    });
  }
  const response = await forwardStockRequest(request, `/admin/stock/items/${segment}/adjustments`, {
    method: "POST",
    body
  });
  if (response.ok) revalidateTag("menu", { expire: 0 });
  return response;
}
