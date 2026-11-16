import { type NextRequest } from "next/server";
import {
  forwardStockRequest,
  readJsonBody,
  invalidProxyRequest,
} from "../../../../../../src/server/barra-stock-proxy";
import {
  beanIdSegment,
  beanHistoryQuery,
} from "../../../../../../src/server/bean-stock-proxy";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ beanId: string }> },
) {
  const segment = beanIdSegment((await params).beanId);
  if (!segment)
    return invalidProxyRequest("invalid_bean_id", "El grano no es válido.");
  const query = beanHistoryQuery(request.nextUrl.searchParams);
  if (query === null)
    return invalidProxyRequest("invalid_query", "La paginación no es válida.");
  return forwardStockRequest(
    request,
    `/admin/stock/beans/${segment}/history${query}`,
  );
}
