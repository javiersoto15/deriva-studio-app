import { type NextRequest } from "next/server";
import { salonWrite } from "../../../../src/server/salon-stock-proxy";
export function POST(request: NextRequest) {
  return salonWrite(request, "/admin/salon-stock/items");
}
