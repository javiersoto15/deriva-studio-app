import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { injectManifest } from "@serwist/build";
import { serwist as serwistConfigurator } from "@serwist/next/config";
import esbuild from "esbuild";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

// Static, framework-applied security headers. These complement the per-request
// Content-Security-Policy-Report-Only header that middleware.ts sets (it can't
// live here because it needs a per-request nonce).
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  }
];

// Phase 2A.1 — Service worker via Serwist in "configurator mode".
// We avoid the webpack-plugin path (`withSerwistInit`) because Next 16 builds
// with Turbopack, which the webpack-plugin can't hook into. Instead, after the
// production build completes (`runAfterProductionCompile`), we invoke
// `injectManifest` from `@serwist/build` with config produced by Serwist's
// Next-aware configurator. This emits `public/sw.js` from `app/sw.ts`.
// In development we skip emission entirely.
const SW_SRC = "app/sw.ts";
const SW_DEST = "public/sw.js";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Phase 2B.1 — opt into Next 16 Cache Components (PPR + `'use cache'` /
  // cacheLife / cacheTag / updateTag). With this flag on, public/menu routes
  // can mix static shell + cached menu data + dynamic islands in a single tree.
  cacheComponents: true,
  // LAN dev access: when testing on a phone over WiFi, Next.js 16 blocks
  // cross-origin requests to /_next/* by default (CSRF defense). Allowlist
  // the developer's machine LAN IP + common loopbacks so HMR + JS chunks
  // load on the device. Update this list when the Mac's LAN IP changes.
  // Pattern strings support wildcards via `*` (e.g. "192.168.*.*").
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.12.107",
    "192.168.*.*",
    "10.*.*.*"
  ],
  // Phase 2B.1 — tree-shake heavy client libs whose barrels otherwise pull in
  // unused submodules. Both packages are large enough to be worth it.
  experimental: {
    optimizePackageImports: ["firebase/auth", "@tanstack/react-query"]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  // Dev-only API proxy: forward /api/* to the Go backend so the browser sees
  // every request as same-origin. Eliminates CORS preflight failures and lets
  // the phone hit the Mac without knowing the Mac's LAN IP for the backend.
  // The backend URL is configurable via DERIVA_BACKEND_PROXY_URL (defaults to
  // http://localhost:8080 — where `make api-up-firebase-emulator` listens).
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    const target = process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`
      }
    ];
  },
  compiler: {
    runAfterProductionCompile: async ({ projectDir }: { projectDir: string; distDir: string }) => {
      if (process.env.NODE_ENV !== "production") return;
      if (process.env.SERWIST_DISABLE === "1") return;

      // Step 1 — bundle the TypeScript service worker (app/sw.ts) to a temp
      // JavaScript file with esbuild. injectManifest does ONLY string-replace,
      // not transpilation, so the bundle has to happen here. We preserve the
      // `self.__SW_MANIFEST` injection point as a free variable so step 2 can
      // substitute it.
      const swSrcTs = path.join(projectDir, SW_SRC);
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "deriva-sw-"));
      const swSrcBundled = path.join(tmpDir, "sw.bundled.js");
      await esbuild.build({
        entryPoints: [swSrcTs],
        outfile: swSrcBundled,
        bundle: true,
        format: "iife",
        target: "es2020",
        platform: "browser",
        minify: true,
        sourcemap: false,
        legalComments: "none",
        define: { "process.env.NODE_ENV": '"production"' }
      });

      // Step 2 — let Serwist's Next-aware configurator decide glob patterns
      // (precaches Next static assets + public/), then run injectManifest to
      // string-replace `self.__SW_MANIFEST` in the bundled SW with the real
      // entries and write the result to public/sw.js.
      const config = await serwistConfigurator.withNextConfig(
        async () => ({
          swSrc: swSrcBundled,
          swDest: path.join(projectDir, SW_DEST)
        }),
        { cwd: projectDir, isDev: false }
      );
      // The configurator emits `esbuildOptions`, which @serwist/build's
      // injectManifest schema currently rejects (package-version drift between
      // @serwist/next and @serwist/build). Strip it before passing through.
      const { esbuildOptions: _esbuildOptions, ...cleanConfig } = config as {
        esbuildOptions?: unknown;
      } & Parameters<typeof injectManifest>[0];
      const { count, size, warnings } = await injectManifest(cleanConfig);
      for (const warning of warnings) console.warn("[serwist]", warning);
      console.log(
        `[serwist] Precached ${count} entries, ${(size / 1024).toFixed(1)} KiB → ${SW_DEST}`
      );

      // Clean up bundled intermediate.
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
};

// next-intl plugin — aliases the request config so getRequestConfig /
// NextIntlClientProvider resolve messages. Points explicitly at our src/ path.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// withSentryConfig is safe to apply unconditionally — it only uploads source maps
// when SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT are set, and the runtime
// init early-returns when NEXT_PUBLIC_SENTRY_DSN is empty.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true
});
