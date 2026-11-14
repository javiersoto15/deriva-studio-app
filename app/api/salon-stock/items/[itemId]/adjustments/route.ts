import { type NextRequest } from "next/server";
import {
  salonWrite,
  salonId,
} from "../../../../../../src/server/salon-stock-proxy";
import { invalidProxyRequest } from "../../../../../../src/server/barra-stock-proxy";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const id = salonId((await params).itemId);
  if (!id)
    return invalidProxyRequest("invalid_input", "El artículo no es válido.");
  return salonWrite(request, `/admin/salon-stock/items/${id}/adjustments`);
}
