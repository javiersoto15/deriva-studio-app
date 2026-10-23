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
  const forwarded = new URLSearchParams();
  for (const [name, min, max] of [["limit", 1, 100], ["before_revision", 1, Number.MAX_SAFE_INTEGER]] as const) {
    const values = request.nextUrl.searchParams.getAll(name);
    if (values.length > 1) {
      return new Response(JSON.stringify({ error: "invalid_history_query", message: "La consulta del historial no es válida." }), {
        status: 400,
        headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const value = values[0];
    if (value === undefined) continue;
    if (!/^\d+$/.test(value)) {
      return new Response(JSON.stringify({ error: "invalid_history_query", message: "La consulta del historial no es válida." }), {
        status: 400,
        headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
      return new Response(JSON.stringify({ error: "invalid_history_query", message: "La consulta del historial no es válida." }), {
        status: 400,
        headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" }
      });
    }
    forwarded.set(name, String(parsed));
  }
  const query = forwarded.toString();
  return forwardStockRequest(request, `/admin/stock/items/${segment}/history${query ? `?${query}` : ""}`);
}
