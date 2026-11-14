import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../../app/api/kitchen-stock/route";
import { POST } from "../../app/api/kitchen-stock/items/[itemId]/adjustments/route";
import { isStockNetworkOnlyRequest } from "../../src/sw/routing";
test("kitchen proxy requires bearer and preserves no-store", async () => {
  const r = await GET(new NextRequest("http://localhost/api/kitchen-stock"));
  assert.equal(r.status, 401);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
});
test("kitchen adjustments forward exact caller body to independent endpoint and preserve conflicts", async () => {
  const old = globalThis.fetch;
  let url = "",
    body = "";
  globalThis.fetch = async (u, i) => {
    url = String(u);
    body = String(i?.body);
    assert.equal(new Headers(i?.headers).get("authorization"), "Bearer caller");
    return Response.json({ code: "revision_conflict" }, { status: 409 });
  };
  try {
    const r = await POST(
      new NextRequest(
        "http://localhost/api/kitchen-stock/items/kitchen_123/adjustments",
        {
          method: "POST",
          headers: { authorization: "Bearer caller" },
          body: '{"amount":"0.5"}',
        },
      ),
      { params: Promise.resolve({ itemId: "kitchen_123" }) },
    );
    assert.equal(r.status, 409);
    assert.ok(
      url.endsWith("/admin/kitchen-stock/items/kitchen_123/adjustments"),
    );
    assert.equal(body, '{"amount":"0.5"}');
    const invalid = await POST(
      new NextRequest("http://localhost", { method: "POST", body: "{}" }),
      { params: Promise.resolve({ itemId: "../menu" }) },
    );
    assert.equal(invalid.status, 400);
  } finally {
    globalThis.fetch = old;
  }
});
test("kitchen pages and API bypass service worker cache", () => {
  for (const p of [
    "/stock-cocina",
    "/admin/stock-cocina",
    "/api/kitchen-stock",
    "/api/kitchen-stock/items/a/history",
  ])
    assert.equal(
      isStockNetworkOnlyRequest(
        p,
        "GET",
        p.startsWith("/api") ? "" : "document",
      ),
      true,
      p,
    );
});
