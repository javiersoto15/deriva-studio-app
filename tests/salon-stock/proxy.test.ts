import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../../app/api/salon-stock/route";
import { POST } from "../../app/api/salon-stock/withdrawals/route";
import { GET as history } from "../../app/api/salon-stock/withdrawals/route";
import { isStockNetworkOnlyRequest } from "../../src/sw/routing";
test("salon list requires caller auth and no-store", async () => {
  const r = await GET(new NextRequest("http://localhost/api/salon-stock"));
  assert.equal(r.status, 401);
  assert.match(r.headers.get("cache-control") ?? "", /no-store/);
});
test("global withdrawal proxy forwards exact immutable payload to salon only", async () => {
  const old = globalThis.fetch;
  let url = "",
    body = "";
  globalThis.fetch = async (u, init) => {
    url = String(u);
    body = String(init?.body);
    return Response.json({ code: "revision_conflict" }, { status: 409 });
  };
  try {
    const r = await POST(
      new NextRequest("http://localhost/api/salon-stock/withdrawals", {
        method: "POST",
        headers: { authorization: "Bearer caller" },
        body: '{"location":"storage","amount":"0.125","request_id":"same"}',
      }),
    );
    assert.equal(r.status, 409);
    assert.ok(url.endsWith("/admin/salon-stock/withdrawals"));
    assert.equal(
      body,
      '{"location":"storage","amount":"0.125","request_id":"same"}',
    );
  } finally {
    globalThis.fetch = old;
  }
});
test("withdrawal history rejects malformed cursors instead of broadening the query", async () => {
  const r = await history(
    new NextRequest(
      "http://localhost/api/salon-stock/withdrawals?before_sequence=oops",
    ),
  );
  assert.equal(r.status, 400);
});
test("salon routes bypass service worker caches", () => {
  for (const p of [
    "/stock-salon",
    "/admin/stock-salon",
    "/api/salon-stock",
    "/api/salon-stock/withdrawals",
  ])
    assert.equal(
      isStockNetworkOnlyRequest(
        p,
        "GET",
        p.startsWith("/api") ? "" : "document",
      ),
      true,
    );
});
