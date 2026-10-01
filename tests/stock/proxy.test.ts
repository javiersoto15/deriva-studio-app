import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { GET } from "../../app/api/barra-stock/route";
import { POST as postAdjustment } from "../../app/api/barra-stock/items/[stockId]/adjustments/route";

test("stock proxy requires the caller bearer and does not call the backend without it", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("unexpected", { status: 200 });
  };
  try {
    const response = await GET(new NextRequest("http://localhost/api/barra-stock"));
    assert.equal(response.status, 401);
    assert.equal(called, false);
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("stock proxy forwards only the fixed list path and preserves a 409", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.DERIVA_BACKEND_PROXY_URL;
  process.env.DERIVA_BACKEND_PROXY_URL = "http://backend.test";
  let requestedUrl = "";
  let requestedAuthorization = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ code: "stale_revision", message: "revision conflict" }), {
      status: 409,
      headers: { "content-type": "application/json" }
    });
  };
  try {
    const response = await GET(
      new NextRequest("http://localhost/api/barra-stock", {
        headers: { authorization: "Bearer firebase-token" }
      })
    );
    assert.equal(response.status, 409);
    assert.equal(requestedUrl, "http://backend.test/admin/stock");
    assert.equal(requestedAuthorization, "Bearer firebase-token");
    assert.equal(await response.text(), JSON.stringify({ code: "stale_revision", message: "revision conflict" }));
    assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.DERIVA_BACKEND_PROXY_URL;
    else process.env.DERIVA_BACKEND_PROXY_URL = originalBase;
  }
});

test("adjustment proxy encodes the confirmed stock id and rejects path input", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.DERIVA_BACKEND_PROXY_URL;
  process.env.DERIVA_BACKEND_PROXY_URL = "http://backend.test";
  let requestedUrl = "";
  let requestedBody = "";
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedBody = String(init?.body ?? "");
    return new Response(JSON.stringify({ code: "stale_revision" }), {
      status: 409,
      headers: { "content-type": "application/json" }
    });
  };
  try {
    const body = JSON.stringify({
      mode: "delta",
      quantity: 1,
      expected_revision: 2,
      request_id: "retry-1"
    });
    const response = await postAdjustment(
      new NextRequest("http://localhost/api/barra-stock/items/menu%3Aespresso/adjustments", {
        method: "POST",
        headers: {
          authorization: "Bearer firebase-token",
          "content-type": "application/json"
        },
        body
      }),
      { params: Promise.resolve({ stockId: "menu:espresso" }) }
    );
    assert.equal(response.status, 409);
    assert.equal(requestedUrl, "http://backend.test/admin/stock/items/menu%3Aespresso/adjustments");
    assert.equal(requestedBody, body);

    const invalid = await postAdjustment(
      new NextRequest("http://localhost/api/barra-stock/items/menu%3A..%2Fsecret/adjustments", {
        method: "POST",
        headers: { authorization: "Bearer firebase-token", "content-type": "application/json" },
        body
      }),
      { params: Promise.resolve({ stockId: "menu:../secret" }) }
    );
    assert.equal(invalid.status, 400);
    assert.equal(requestedUrl, "http://backend.test/admin/stock/items/menu%3Aespresso/adjustments");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.DERIVA_BACKEND_PROXY_URL;
    else process.env.DERIVA_BACKEND_PROXY_URL = originalBase;
  }
});
