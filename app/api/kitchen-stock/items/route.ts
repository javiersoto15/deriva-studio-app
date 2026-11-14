import { type NextRequest } from "next/server";
import { forwardKitchenWrite } from "../../../../src/server/kitchen-stock-proxy";
export function POST(request: NextRequest) {
  return forwardKitchenWrite(request, "/admin/kitchen-stock/items");
}
