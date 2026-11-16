// Real Next route integration against a controlled upstream. No production credentials.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const beanId = "bean_" + "a".repeat(32),
  seen = [];
const backend = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  seen.push({
    url: req.url,
    method: req.method,
    bearer: req.headers.authorization,
    body,
  });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});
await new Promise((r) => backend.listen(0, "127.0.0.1", r));
const upstream = `http://127.0.0.1:${backend.address().port}`;
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3038",
  ],
  {
    env: { ...process.env, INTERNAL_API_BASE_URL: upstream },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
app.stdout.on("data", (d) => (output += d));
app.stderr.on("data", (d) => (output += d));
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error(output)), 15000);
    const check = (d) => {
      if (String(d).includes("Ready")) {
        clearTimeout(timeout);
        resolve();
      }
    };
    app.stdout.on("data", check);
    app.once("exit", () => {
      clearTimeout(timeout);
      reject(Error(output));
    });
  });
  const base = "http://127.0.0.1:3038/api/barra-stock/beans";
  const noAuth = await fetch(base);
  assert.equal(noAuth.status, 401);
  assert.equal(seen.length, 0);
  const headers = {
    Authorization: "Bearer fixture-only-token",
    "Content-Type": "application/json",
  };
  for (const [suffix, method, body] of [
    ["", "GET", undefined],
    [`/${beanId}/history?limit=20&before_revision=4`, "GET", undefined],
    [`/${beanId}/menu-links`, "GET", undefined],
    [
      `/${beanId}/adjustments`,
      "POST",
      JSON.stringify({
        mode: "set",
        quantity_kg: "0.125",
        expected_revision: 0,
        request_id: "fixture-count",
      }),
    ],
    [
      `/${beanId}/menu-links`,
      "PUT",
      JSON.stringify({
        menu_item_ids: ["pourover"],
        expected_menu_item_ids: [],
        request_id: "fixture-links",
      }),
    ],
  ]) {
    const response = await fetch(base + suffix, { method, body, headers });
    assert.equal(response.status, 200, await response.text());
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(seen.at(-1).url, "/admin/stock/beans" + suffix);
    assert.equal(seen.at(-1).bearer, "Bearer fixture-only-token");
    if (body) assert.equal(seen.at(-1).body, body);
  }
  const previous = seen.length;
  assert.equal(
    (await fetch(base + `/${beanId}/history?limit=101`, { headers })).status,
    400,
  );
  assert.equal(
    (await fetch(base + "/bean_invalid/history", { headers })).status,
    400,
  );
  assert.equal(seen.length, previous);
  const page = await fetch("http://127.0.0.1:3038/stock");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Stock de barra/);
  await writeFile(
    "docs/verification/2026-11-16-bean-frontend/bff-results.json",
    JSON.stringify(
      {
        passed: true,
        realNextRoutes: 5,
        noStore: true,
        callerBearer: true,
        successfulMutationsInvalidateMenuWithoutRuntimeError: true,
        invalidPathsRejected: true,
        stockPage: 200,
      },
      null,
      2,
    ),
  );
  console.log("Real Next BFF checks passed.");
} finally {
  app.kill("SIGTERM");
  await new Promise((r) => backend.close(r));
}
