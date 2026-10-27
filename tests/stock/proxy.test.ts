import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { GET } from "../../app/api/barra-stock/route";
import { POST as postAdjustment } from "../../app/api/barra-stock/items/[stockId]/adjustments/route";
import { GET as getHistory } from "../../app/api/barra-stock/items/[stockId]/history/route";

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

test("history proxy forwards only validated pagination parameters", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.DERIVA_BACKEND_PROXY_URL;
  process.env.DERIVA_BACKEND_PROXY_URL = "http://backend.test";
  let requestedUrl = "";
  let called = false;
  globalThis.fetch = async (input) => {
    called = true;
    requestedUrl = String(input);
    return new Response(JSON.stringify({ entries: [], has_more: false, next_before_revision: null }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  try {
    const response = await getHistory(
      new NextRequest("http://localhost/api/barra-stock/items/raw%3Acoffee/history?limit=100&before_revision=12&ignored=secret", {
        headers: { authorization: "Bearer firebase-token" }
      }),
      { params: Promise.resolve({ stockId: "raw:coffee" }) }
    );
    assert.equal(response.status, 200);
    assert.equal(requestedUrl, "http://backend.test/admin/stock/items/raw%3Acoffee/history?limit=100&before_revision=12");

    called = false;
    const invalid = await getHistory(
      new NextRequest("http://localhost/api/barra-stock/items/raw%3Acoffee/history?limit=101", {
        headers: { authorization: "Bearer firebase-token" }
      }),
      { params: Promise.resolve({ stockId: "raw:coffee" }) }
    );
    assert.equal(invalid.status, 400);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.DERIVA_BACKEND_PROXY_URL;
    else process.env.DERIVA_BACKEND_PROXY_URL = originalBase;
  }
});

test("shelf-life proxies forward only well-formed group and lot ids", async () => {
  const { PUT: putGroup } = await import("../../app/api/barra-stock/shelf-life/groups/[groupId]/route");
  const { PATCH: patchLot } = await import("../../app/api/barra-stock/lots/[lotId]/route");
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.DERIVA_BACKEND_PROXY_URL;
  process.env.DERIVA_BACKEND_PROXY_URL = "http://backend.test";
  const calls: Array<{ url: string; method?: string }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method });
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  };
  const uuid = "0b9c6f2e-4f0a-4d5e-9a51-2c7d8e9f0a1b";
  const request = (method: string) =>
    new NextRequest("http://localhost/api/barra-stock/x", {
      method,
      headers: { authorization: "Bearer firebase-token" },
      body: JSON.stringify({ request_id: "r" })
    });
  try {
    const badGroup = await putGroup(request("PUT"), { params: Promise.resolve({ groupId: "../stock" }) });
    const badLot = await patchLot(request("PATCH"), { params: Promise.resolve({ lotId: "lot_1/../../x" }) });
    assert.equal(badGroup.status, 400);
    assert.equal(badLot.status, 400);
    assert.equal(calls.length, 0);

    await putGroup(request("PUT"), { params: Promise.resolve({ groupId: `group_${uuid}` }) });
    await patchLot(request("PATCH"), { params: Promise.resolve({ lotId: `lot_${uuid}` }) });
    assert.deepEqual(calls, [
      { url: `http://backend.test/admin/stock/shelf-life/groups/group_${uuid}`, method: "PUT" },
      { url: `http://backend.test/admin/stock/lots/lot_${uuid}`, method: "PATCH" }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.DERIVA_BACKEND_PROXY_URL;
    else process.env.DERIVA_BACKEND_PROXY_URL = originalBase;
  }
});
