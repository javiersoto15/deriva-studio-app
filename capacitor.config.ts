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
    contentInset: "always",
    // Paint the native view beige-100 so the status-bar and home-indicator
    // areas don't flash white before/around the WebView's HTML paint.
    backgroundColor: "#F4EDE6"
  },
  android: {
    // Same rationale as iOS — keep the native surface beige under the WebView.
    backgroundColor: "#F4EDE6"
  },
  plugins: {
    SplashScreen: {
      // Show the launch storyboard until the WebView's first paint, then fade
      // out. We don't want to hold the splash long — livehost first-paint is
      // usually <1s on LTE.
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#F4EDE6", // beige-100
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    },
    StatusBar: {
      // overlay = WebView draws under the status bar; combined with
      // contentInset:"always" above, env(safe-area-inset-top) resolves to the
      // real status-bar height so our editorial top padding is preserved.
      overlaysWebView: true,
      style: "DARK",       // dark text on the beige background
      backgroundColor: "#F4EDE6"
    },
    Keyboard: {
      // "native" = the WebView resizes on keyboard open (matches mobile Safari
      // behavior). Required so the OTP grid and phone-number input don't get
      // covered.
      resize: "native",
      style: "DEFAULT"
    }
  }
};

export default config;
