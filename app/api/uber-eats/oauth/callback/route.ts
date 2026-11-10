import { type NextRequest } from "next/server";
import { completeUberEatsOAuth } from "../../../../../src/server/uber-eats-oauth-proxy";

export async function GET(request: NextRequest) {
  return completeUberEatsOAuth(request);
}
