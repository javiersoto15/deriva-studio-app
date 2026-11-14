import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { startUberEatsOAuth, completeUberEatsOAuth } from "../../src/server/uber-eats-oauth-proxy";
import { isUberEatsOAuthNetworkOnlyRequest } from "../../src/sw/routing";

const admin = "https://admin.derivastudio.cl";
function settings() {
  const prior = { ...process.env };
  process.env.UBER_EATS_ADMIN_HOSTNAME = "admin.derivastudio.cl";
  process.env.INTERNAL_API_BASE_URL = "https://backend.test";
  const fetch = globalThis.fetch;
  return () => {
    globalThis.fetch = fetch;
    for (const key of Object.keys(process.env)) if (!(key in prior)) delete process.env[key];
    Object.assign(process.env, prior);
  };
}

test("OAuth callbacks and start requests never enter a service-worker cache", () => {
  for (const path of ["/api/uber-eats/oauth/start", "/api/uber-eats/oauth/callback"])
    assert.equal(isUberEatsOAuthNetworkOnlyRequest(path), true);
  assert.equal(isUberEatsOAuthNetworkOnlyRequest("/api/uber-eats/oauth/callback-extra"), false);
});

test("OAuth bootstrap rejects wrong hosts and missing bearer without upstream access", async () => {
  const restore = settings(); let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({}); };
  try {
    assert.equal((await startUberEatsOAuth(new NextRequest("https://derivastudio.cl/api/uber-eats/oauth/start", { method: "POST", headers: { authorization: "Bearer user" } }))).status, 404);
    assert.equal((await startUberEatsOAuth(new NextRequest(admin + "/api/uber-eats/oauth/start", { method: "POST" }))).status, 401);
    assert.equal(calls, 0);
  } finally { restore(); }
});

test("owner bootstrap forwards caller bearer only to fixed backend route and preserves state cookie", async () => {
  const restore = settings(); let url = "", authorization = "";
  globalThis.fetch = async (input, init) => {
    url = String(input); authorization = new Headers(init?.headers).get("authorization") ?? "";
    return Response.json({ authorization_url: "https://auth.uber.com/oauth/v2/authorize" }, { headers: { "set-cookie": "__Host-uber_eats_oauth_state=signed; Path=/; Secure; HttpOnly; SameSite=Lax" } });
  };
  try {
    const response = await startUberEatsOAuth(new NextRequest(admin + "/api/uber-eats/oauth/start", { method: "POST", headers: { authorization: "Bearer caller" } }));
    assert.equal(response.status, 200); assert.equal(url, "https://backend.test/admin/integrations/uber-eats/oauth/start");
    assert.equal(authorization, "Bearer caller"); assert.match(response.headers.get("set-cookie") ?? "", /Secure; HttpOnly/);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/); assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  } finally { restore(); }
});

test("callback moves code/state/cookie to a POST body and never forwards browser bearer or query upstream", async () => {
  const restore = settings(); let url = "", body: unknown, headers = new Headers();
  globalThis.fetch = async (input, init) => {
    url = String(input); body = JSON.parse(String(init?.body)); headers = new Headers(init?.headers);
    return Response.json({ stores: [{ id: "store-1", name: "Deriva" }] });
  };
  try {
    const response = await completeUberEatsOAuth(new NextRequest(admin + "/api/uber-eats/oauth/callback?code=temporary-code&state=signed-state", { headers: { cookie: "__Host-uber_eats_oauth_state=signed-cookie", authorization: "Bearer not-forwarded" } }));
    assert.equal(response.status, 200); assert.equal(url, "https://backend.test/integrations/uber-eats/oauth/callback");
    assert.deepEqual(body, { denied: false, code: "temporary-code", state: "signed-state", state_cookie: "signed-cookie" });
    assert.equal(headers.has("authorization"), false); assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  } finally { restore(); }
});

test("duplicate or denied callback values fail closed and provider error detail is sanitized", async () => {
  const restore = settings(); let body: unknown;
  globalThis.fetch = async (_input, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json({ access_token: "must-not-leak", detail: "provider-error-private" }, { status: 502, headers: { "set-cookie": "__Host-uber_eats_oauth_state=; Path=/; Max-Age=0; Secure; HttpOnly" } });
  };
  try {
    const response = await completeUberEatsOAuth(new NextRequest(admin + "/api/uber-eats/oauth/callback?code=a&code=b&state=c", { headers: { cookie: "__Host-uber_eats_oauth_state=cookie" } }));
    assert.deepEqual(body, { denied: false, code: "", state: "c", state_cookie: "cookie" });
    assert.equal(response.status, 502); assert.ok(!(await response.text()).includes("must-not-leak")); assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/);
    await completeUberEatsOAuth(new NextRequest(admin + "/api/uber-eats/oauth/callback?error=denied&code=ignored&state=ignored"));
    assert.deepEqual(body, { denied: true, code: "", state: "", state_cookie: "" });
  } finally { restore(); }
});
