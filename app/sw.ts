/// <reference lib="webworker" />

// Service worker for the Deriva Companion PWA.
// Built and emitted by @serwist/next into public/sw.js at production build time.
// Disabled in development (see next.config.ts).
//
// Cache strategy (Phase 2A.1):
//   - Static Next.js assets (_next/static/*) → CacheFirst (filenames are content-hashed).
//   - Menu data (/menu, /carta, /api/menu*) → NetworkOnly for availability freshness.
//   - HTML navigations → NetworkFirst with /offline fallback.
//   - Google Fonts → CacheFirst.
//   - Member-private endpoints (/me/*, /api/me/*, /api/staff/*, /api/admin/*) → NetworkOnly.
//   - Barra stock page/API (/stock, /admin/stock, /api/barra-stock*) → NetworkOnly.
//     These are NEVER cached: they contain user-private data (visits, rewards, profile,
//     staff/admin payloads). Caching offline would (a) leak data across sessions on
//     shared devices and (b) display stale balances which is a trust-breaking UX bug.

import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate
} from "serwist";
import { isFreshMenuRequest, isStockNetworkOnlyRequest } from "../src/sw/routing";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // Member-private — NEVER cache. Privacy + freshness.
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin &&
      (url.pathname.startsWith("/me/") ||
        url.pathname.startsWith("/api/me/") ||
        url.pathname.startsWith("/api/staff/") ||
        url.pathname.startsWith("/api/admin/")),
    handler: new NetworkOnly()
  },
  // Barra stock is authenticated and mutation-sensitive. Never let an
  // installed PWA service worker replay old counts or a stale admin shell.
  {
    matcher: ({ url, sameOrigin, request }) =>
      sameOrigin && isStockNetworkOnlyRequest(url.pathname, request.method, request.destination),
    handler: new NetworkOnly()
  },
  // Next.js static chunks — safe forever (content-hashed filenames).
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 })
      ]
    })
  },
  // Menu reads stay fresh after stock mutations; offline fallback is owned by
  // the document navigation strategy below.
  {
    matcher: ({ url, sameOrigin, request }) =>
      sameOrigin && isFreshMenuRequest(url.pathname, request.method),
    handler: new NetworkOnly()
  },
  // Google Fonts CSS + binaries.
  {
    matcher: ({ url }) =>
      url.origin === "https://fonts.googleapis.com" ||
      url.origin === "https://fonts.gstatic.com",
    handler: new CacheFirst({
      cacheName: "google-fonts",
      plugins: [
        new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })
      ]
    })
  },
  // HTML navigations — network first, fall back to offline page via the fallbacks block.
  {
    matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === "document",
    handler: new NetworkFirst({
      cacheName: "html-documents",
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 })
      ]
    })
  },
  // Same-origin images.
  {
    matcher: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
    handler: new StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })
      ]
    })
  }
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document"
      }
    ]
  }
});

serwist.addEventListeners();
