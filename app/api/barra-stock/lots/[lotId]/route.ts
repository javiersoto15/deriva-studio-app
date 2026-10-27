import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  invalidProxyRequest,
  readJsonBody,
  stockLotSegment
} from "../../../../../src/server/barra-stock-proxy";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const { lotId } = await params;
  const segment = stockLotSegment(lotId);
  if (!segment) return invalidProxyRequest("invalid_lot_id", "El lote no es válido.");
  const body = await readJsonBody(request);
  if (!body) return invalidProxyRequest("invalid_request", "Falta el cuerpo de la solicitud.");
  return forwardStockRequest(request, `/admin/stock/lots/${segment}`, { method: "PATCH", body });
}
