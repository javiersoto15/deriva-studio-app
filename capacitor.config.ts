import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Deriva Companion — native shell (Capacitor).
 *
 * Strategy: **livehost**. `server.url` points the WebView at the deployed
 * companion at https://app.derivastudio.cl, so the native shell inherits the
 * full Next.js 16 stack — middleware (host routing + CSP + path-aware 403),
 * Server Components, Cache Components, and host-aware manifest — instead of
 * trying to ship a static export that would lose all of those.
 *
 * Trade-off: livehost requires network for first paint and breaks pure-offline.
 * Serwist's precache handles the second-load shell; the /offline route covers
 * total disconnects.
 *
 * Bundle ID (`appId`) is permanent once the App Store / Play Store records
 * exist. Confirm before first `cap add ios` / `cap add android`.
 */
const config: CapacitorConfig = {
  appId: "cl.derivastudio.companion",
  appName: "Deriva",
  // `webDir` is unused in livehost mode (the WebView never reads local HTML),
  // but Capacitor requires the field to exist. Point at .next so a future
  // bundled-build fallback would Just Work.
  webDir: ".next",
  server: {
    url: "https://app.derivastudio.cl",
    // iOS WebView is HTTPS by default. Android needs explicit allowlist for the
    // production host (cleartext stays off; we never want HTTP).
    androidScheme: "https",
    cleartext: false
  },
  ios: {
    // Use the modern WKWebView content inset so safe-area-inset env() vars
    // resolve correctly on notched devices.
    contentInset: "always"
  }
};

export default config;
