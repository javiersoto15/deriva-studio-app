import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  invalidProxyRequest,
  readJsonBody,
  shelfLifeGroupSegment
} from "../../../../../../src/server/barra-stock-proxy";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const segment = shelfLifeGroupSegment(groupId);
  if (!segment) return invalidProxyRequest("invalid_group_id", "El grupo no es válido.");
  const body = await readJsonBody(request);
  if (!body) return invalidProxyRequest("invalid_request", "Falta el cuerpo de la solicitud.");
  return forwardStockRequest(request, `/admin/stock/shelf-life/groups/${segment}`, { method: "PUT", body });
}
