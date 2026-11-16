import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/javiersoto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core");
const output = await mkdtemp(path.join(tmpdir(), "deriva-beans-browser-"));
await build({
  entryPoints: ["tests/bean-stock/browser-fixture.tsx"],
  bundle: true,
  outdir: output,
  jsx: "automatic",
  tsconfig: "tsconfig.test.json",
  define: { "process.env.NODE_ENV": '"development"', "process.env": "{}" },
  loader: { ".woff2": "file" },
});
let css = await readFile(path.join(output, "browser-fixture.css"), "utf8");
for (const name of [
  "poppins_92141fd6",
  "ibm_plex_mono_cbb339f3",
  "cormorant_garamond_1fcb4161",
]) {
  let font = await readFile(
    `.next/dev/static/chunks/[next]_internal_font_google_${name}_module_css_0w3-wzy._.single.css`,
    "utf8",
  );
  const matches = [...font.matchAll(/url\("([^"]+)"\)/g)];
  for (const m of matches) {
    const bytes = await readFile(path.resolve(".next/dev/static/chunks", m[1]));
    font = font.replace(
      m[0],
      `url(data:font/woff2;base64,${bytes.toString("base64")})`,
    );
  }
  css += font;
}

const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}:root{--font-display:'Cormorant Garamond',Georgia,serif;--font-tracked:Poppins,sans-serif;--font-mono:'IBM Plex Mono',monospace}button,input,textarea{font:inherit}${css}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`;
const server = createServer(async (req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/app.js" ? "text/javascript" : "text/html",
  );
  res.end(
    req.url === "/app.js"
      ? await readFile(path.join(output, "browser-fixture.js"))
      : html,
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const errors = [];
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on("pageerror", (e) => {
  errors.push(String(e));
  console.error("Browser error", String(e));
});
const base = `http://127.0.0.1:${server.address().port}`;
const evidence = path.resolve("docs/verification/2026-11-16-bean-frontend");
await mkdir(evidence, { recursive: true });
try {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {origin:base});
  await page.goto(base);
  await page.getByRole("list", { name: "Granos de barra" }).waitFor();
  for (const width of [320, 375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `list overflow ${width}`,
    );
    await page.screenshot({
      path: `${evidence}/${width}-list.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "House Blend, sin contar, editar conteo" })
      .click();
    await page.getByLabel("Total contado").fill("0,250");
    await page.getByText("0,250 kg = 250 g", { exact: false }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `editor overflow ${width}`,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Guardar conteo", exact: true })
        .isEnabled(),
      true,
    );
    await page.screenshot({ path: `${evidence}/${width}-count.png` });
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "House Blend, sin contar, editar conteo" })
    .click();
  await page.getByLabel("Total contado").fill("0,125");
  await page
    .getByRole("button", { name: "Guardar conteo", exact: true })
    .click();
  await page.getByText("Conteo confirmado:", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Historial", exact: true }).click();
  await page.getByText("Fixture staff", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Carta", exact: true }).click();
  await page.getByRole("checkbox", { name: /Espresso/ }).check();
  await page
    .getByRole("button", { name: "Guardar vínculos", exact: true })
    .click();
  await page.getByText("Vínculos confirmados.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  // Fresh sharing includes changes by another staff member and ignores filters.
  await page.evaluate(() => {
    window.__fixture.data.snapshot.items[0].quantity_kg = "0.875";
    window.__fixture.data.snapshot.items[0].revision++;
    window.__fixture.persist();
  });
  await page.getByLabel("Buscar grano").fill("House");
  await page
    .getByRole("button", { name: "Compartir granos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Copiar texto", exact: true })
    .waitFor();
  await page.waitForFunction(
    () =>
      !document
        .querySelector("button:disabled")
        ?.textContent?.includes("Copiar texto"),
  );
  const share = await page
    .getByRole("textbox", { name: "Texto para compartir" })
    .inputValue();
  assert.match(share, /0,875/);
  assert.match(share, /504 Tasty Roast/);
  await page.getByRole("button", {name:"Copiar texto",exact:true}).click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),share);
  assert.equal(decodeURIComponent((await page.getByRole("link", {name:"Abrir WhatsApp"}).getAttribute("href")).split("text=")[1]),share);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByLabel("Buscar grano").fill("");
  // Commit succeeds but response is lost; reload, reauth, immutable replay and fresh read.
  await page.getByRole("button", { name: /House Blend, 0,875 kg/ }).click();
  await page.getByLabel("Total contado").fill("0,25");
  await page.evaluate(() => (window.__fixture.failNext = "lost"));
  await page
    .getByRole("button", { name: "Guardar conteo", exact: true })
    .click();
  await page.getByRole("button", { name: "Comprobar y reintentar" }).waitFor();
  const original = await page.evaluate(() =>
    JSON.parse(
      sessionStorage.getItem("deriva:bean-stock:pending:fixture-staff"),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "Comprobar y reintentar" }).waitFor();
  await page.evaluate(() => (window.__fixture.failNext = "401"));
  await page.getByRole("button", { name: "Comprobar y reintentar" }).click();
  await page
    .getByRole("button", { name: "Entrar con la misma cuenta" })
    .click();
  await page.getByRole("button", { name: "Comprobar y reintentar" }).waitFor();
  await page.evaluate(() => {
    window.__fixture.data.snapshot.items[0].quantity_kg = "0.75";
    window.__fixture.data.snapshot.items[0].revision++;
    window.__fixture.persist();
  });
  await page.getByRole("button", { name: "Comprobar y reintentar" }).click();
  await page.getByText("Conteo confirmado:", { exact: false }).waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        window.__fixture.requests.filter((r) => r.body?.request_id).at(-1).body
          .request_id,
    ),
    original.payload.request_id,
  );
  await page.getByText("EXISTENCIA ACTUAL · 0,75 kg").waitFor();
  assert.equal(
    await page.evaluate(() =>
      sessionStorage.getItem("deriva:bean-stock:pending:fixture-staff"),
    ),
    null,
  );
  // Conflict preserves draft and prevents silent replacement.
  await page.getByLabel("Total contado").fill("0,1");
  await page.evaluate(() => (window.__fixture.failNext = "conflict"));
  await page
    .getByRole("button", { name: "Guardar conteo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar con stock actualizado" })
    .waitFor();
  assert.equal(await page.getByLabel("Total contado").inputValue(), "0,1");
  assert.equal(
    await page
      .getByRole("button", { name: "Guardar conteo", exact: true })
      .isDisabled(),
    true,
  );
  await page.screenshot({
    path: `${evidence}/390-conflict.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Revisar con stock actualizado" })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Guardar conteo", exact: true })
      .isEnabled(),
    true,
  );
  // A definite first rejection keeps a draft editable; staff cannot edit links.
  await page.evaluate(() => (window.__fixture.failNext = "403"));
  await page
    .getByRole("button", { name: "Guardar conteo", exact: true })
    .click();
  await page
    .getByText("Tu cuenta no tiene permiso para gestionar los granos.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Guardar conteo", exact: true })
      .isEnabled(),
    true,
  );
  assert.equal(await page.getByLabel("Total contado").inputValue(), "0,1");
  assert.equal(
    await page.evaluate(() =>
      sessionStorage.getItem("deriva:bean-stock:pending:fixture-staff"),
    ),
    null,
  );
  await page.getByRole("button", { name: "Carta", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Guardar vínculos", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page.getByRole("checkbox", { name: /Pour Over/ }).isDisabled(),
    true,
  );
  // A stale account response does not invoke global expiry/sign-out.
  await page.getByRole("button", { name: "Conteo", exact: true }).click();
  await page.evaluate(() => (window.__fixture.failNext = "switch"));
  await page
    .getByRole("button", { name: "Guardar conteo", exact: true })
    .click();
  await page.getByRole("button", { name: "Comprobar y reintentar" }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Entrar con la misma cuenta" })
      .count(),
    0,
  );
  // A valid empty resource differs from a missing backend feature.
  await page.evaluate(()=>{const data=window.__fixture.data;data.snapshot.items=[];data.snapshot.links=[];data.receipts={};data.history=[];sessionStorage.removeItem('deriva:bean-stock:pending:fixture-staff');window.__fixture.persist();});
  await page.reload();await page.getByText('Aún no hay granos configurados.',{exact:true}).waitFor();
  await page.evaluate(()=>window.__fixture.failNext='unavailable');await page.getByRole('button',{name:'Compartir granos',exact:true}).click();
  await page.getByText('Granos aún no habilitado.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Copiar texto',exact:true}).isDisabled(),true);
  assert.deepEqual(errors, []);
  await writeFile(
    `${evidence}/browser-results.json`,
    JSON.stringify(
      {
        passed: true,
        widths: [320, 375, 390, 430, 1440],
        checks: [
          "no overflow",
          "decimal save",
          "history",
          "manager links",
          "fresh full share",
          "committed response loss / reload / 401 / same UID retry",
          "immutable replay then fresh snapshot",
          "conflict review",
        "definite rejection keeps editable draft",
        "staff read-only links",
        "stale account response does not sign out replacement",
        "unavailable versus empty resource",
        "clipboard and complete WhatsApp payload",
        ],
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log("Browser checks passed. Evidence:", evidence);
} catch (e) {
  console.error("PAGE ERRORS", errors);
  console.error(await page.locator("body").innerText());
  await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true });
  throw e;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
