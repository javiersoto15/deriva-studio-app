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
import { revalidateTag } from "next/cache";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ beanId: string }> },
) {
  const segment = beanIdSegment((await params).beanId);
  if (!segment)
    return invalidProxyRequest("invalid_bean_id", "El grano no es válido.");
  const body = await readJsonBody(request);
  if (!body)
    return invalidProxyRequest(
      "invalid_request",
      "Falta el cuerpo de la solicitud.",
    );
  const response = await forwardStockRequest(
    request,
    `/admin/stock/beans/${segment}/adjustments`,
    { method: "POST", body },
  );
  if (response.ok) revalidateTag("menu", { expire: 0 });
  return response;
}
