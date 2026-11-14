import { type NextRequest } from "next/server";
import {
  forwardKitchenWrite,
  kitchenIdSegment,
} from "../../../../../../src/server/kitchen-stock-proxy";
import { invalidProxyRequest } from "../../../../../../src/server/barra-stock-proxy";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const id = kitchenIdSegment((await params).itemId);
  if (!id)
    return invalidProxyRequest(
      "invalid_item_id",
      "El ingrediente no es válido.",
    );
  return forwardKitchenWrite(
    request,
    `/admin/kitchen-stock/items/${id}/adjustments`,
  );
}
