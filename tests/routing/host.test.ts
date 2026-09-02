import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import { routeByHost } from "../../src/middleware/host";

function call(host: string, pathname: string) {
  const url = `https://${host}${pathname}`;
  const res = routeByHost(
    new NextRequest(new Request(url, { headers: { host } }))
  );
  return {
    status: res.status,
    location: res.headers.get("location"),
    rewrite: res.headers.get("x-middleware-rewrite"),
    surface: res.headers.get("x-middleware-override-headers")
      ? res.headers.get("x-middleware-request-x-deriva-surface")
      : null
  };
}

// --- The regression this file exists for -----------------------------------

test("apex /menu-ejecutivo is served, not redirected", () => {
  const res = call("derivastudio.cl", "/menu-ejecutivo");

  assert.equal(res.status, 200, "must not be a 302");
  assert.equal(res.location, null, "must not carry a Location header");
  assert.equal(res.rewrite, null, "landing routes pass through, not rewrite");
  assert.equal(res.surface, "landing");
});

test("apex /menu-ejecutivo nested paths ride along", () => {
  const res = call("derivastudio.cl", "/menu-ejecutivo/hoy");

  assert.equal(res.status, 200);
  assert.equal(res.location, null);
});

test("the /menu prefix alone never covered /menu-ejecutivo", () => {
  // Guards the actual bug: an exact-or-slash matcher means sibling top-level
  // routes must each be registered. If someone removes the explicit entry,
  // this fails instead of silently 302-ing production traffic to `/`.
  const res = call("derivastudio.cl", "/menu-ejecutivowrong");
  assert.equal(res.status, 302, "prefix matching must stay exact-or-slash");
  assert.equal(res.location, "https://derivastudio.cl/");
});

// --- Existing behaviour that must not regress -------------------------------

test("apex /menu is unchanged", () => {
  const res = call("derivastudio.cl", "/menu");
  assert.equal(res.status, 200);
  assert.equal(res.location, null);
  assert.equal(res.surface, "landing");
});

test("apex /menu nested detail routes are unchanged", () => {
  assert.equal(call("derivastudio.cl", "/menu/espresso").status, 200);
});

test("apex root and other landing routes are unchanged", () => {
  for (const path of ["/", "/sala", "/abierto", "/resenas", "/privacidad", "/menu-display"]) {
    assert.equal(call("derivastudio.cl", path).status, 200, path);
  }
});

test("apex still bounces companion paths home", () => {
  const res = call("derivastudio.cl", "/cartera");
  assert.equal(res.status, 302);
  assert.equal(res.location, "https://derivastudio.cl/");
});

test("apex shared infra still passes", () => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/brand/isotipo.svg"]) {
    assert.equal(call("derivastudio.cl", path).status, 200, path);
  }
});

test("app subdomain bounces /menu-ejecutivo to the companion root", () => {
  const res = call("app.derivastudio.cl", "/menu-ejecutivo");
  assert.equal(res.status, 302);
  assert.equal(res.location, "https://app.derivastudio.cl/inicio");
});

test("app subdomain companion routes are unchanged", () => {
  const res = call("app.derivastudio.cl", "/cartera");
  assert.equal(res.status, 200);
  assert.equal(res.surface, "companion");
});

test("preview and local hosts serve /menu-ejecutivo without gating", () => {
  for (const host of [
    "localhost:3000",
    "127.0.0.1:3000",
    "deriva-studio-abc123.vercel.app"
  ]) {
    const res = call(host, "/menu-ejecutivo");
    assert.equal(res.status, 200, host);
    assert.equal(res.location, null, host);
    assert.equal(res.surface, "landing", host);
  }
});

test("preview /app prefix fallback is unchanged", () => {
  const res = call("localhost:3000", "/app/cartera");
  assert.equal(res.status, 200);
  assert.ok(res.rewrite?.endsWith("/cartera"), res.rewrite ?? "no rewrite");
});
