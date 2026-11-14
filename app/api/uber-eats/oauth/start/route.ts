import { type NextRequest } from "next/server";
import { startUberEatsOAuth } from "../../../../../src/server/uber-eats-oauth-proxy";

export async function POST(request: NextRequest) {
  return startUberEatsOAuth(request);
}
