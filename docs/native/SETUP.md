# Deriva Companion — Native Shell Setup

The companion ships as a Capacitor native shell wrapping the deployed PWA at
`https://app.derivastudio.cl` (the **livehost** strategy). This document is the
runbook for taking the repo from "scaffold present" to "TestFlight build."

## What's in the repo already

- `capacitor.config.ts` — `appId: cl.derivastudio.companion`, `appName: Deriva`,
  `server.url: https://app.derivastudio.cl`. **Bundle ID is permanent** once
  the App Store / Play Store records are created; confirm before first
  `cap add`.
- `@capacitor/core`, `@capacitor/ios`, `@capacitor/android` in `dependencies`.
- `@capacitor/cli`, `@capacitor/assets` in `devDependencies`.
- `.gitignore` entries for native build outputs (Pods, .gradle, build/, signing
  artifacts). Project shells in `ios/` and `android/` **are** committed once
  generated.

## What still needs human input before first `cap add`

| Decision | Default | Notes |
|---|---|---|
| **Apple Developer Team ID** | — | Required for iOS signing + Universal Links. Found in Apple Developer → Membership. |
| **Android signing keystore** | — | Generate with `keytool -genkey -v -keystore deriva-release.jks -alias deriva -keyalg RSA -keysize 2048 -validity 10000`. Store outside repo. |
| **App display name on home screen** | "Deriva" | Set in `capacitor.config.ts`. |
| **iOS minimum version** | iOS 14 | Capacitor 6 default. |
| **Android minSdk** | 23 (Android 6.0) | Capacitor 6 default. |

## First-time generation (one-time, on a Mac with Xcode + Android Studio)

```bash
# 1. Generate native projects (creates ios/ and android/)
npx cap add ios
npx cap add android

# 2. Generate icon + splash from a 1024² master
#    (BLOCKED on Paper-designed master; see project_print_collateral.md tradition)
#    Place master at resources/icon.png + resources/splash.png, then:
npx capacitor-assets generate --iconBackgroundColor "#F0E8D7" --splashBackgroundColor "#F0E8D7"

# 3. Open in IDE to set signing identities
npx cap open ios       # → Xcode → Signing & Capabilities → Team
npx cap open android   # → Android Studio → Build > Generate Signed Bundle
```

## Per-deploy sync

Livehost means **the web deploy IS the app update for the WebView contents**.
The native shell only needs a rebuild when:

- Capacitor plugins are added/removed/upgraded
- Native config changes (Info.plist, AndroidManifest.xml, entitlements)
- App Store / Play Store metadata (icon, splash, version) changes

When that happens:

```bash
npx cap sync          # copies plugin native code into ios/ and android/
npx cap open ios      # build & archive in Xcode → TestFlight
npx cap open android  # build → upload to Play Console
```

## Open engineering items before TestFlight

1. **Firebase Phone Auth inside WebView** — ✅ code swap done. `@capacitor-firebase/authentication`
   is installed; `src/auth/provider.tsx` branches on `Capacitor.isNativePlatform()`
   for all 4 phone methods (signIn/verify + link/verifyLink). Native path uses
   `skipNativeAuth:true` so the web JS SDK stays authoritative for auth state.

   **3 manual prerequisites before native phone auth actually works:**

   a. **Generate APNS Authentication Key** (developer.apple.com):
      - Account → Certificates, Identifiers & Profiles → **Keys** → +
      - Name: "Deriva APNS Auth Key"
      - Check **Apple Push Notifications service (APNs)**
      - Download the `.p8` file (you can only download ONCE; back it up)
      - Note the **Key ID** and your **Team ID** (`7XGTNY336J`)

   b. **Upload APNS key to Firebase Console**:
      - Project Settings → **Cloud Messaging** tab → iOS app configuration
      - Under **APNs Authentication Key** → Upload the `.p8`
      - Enter Key ID + Team ID

   c. **Add iOS capabilities in Xcode**:
      - `npx cap open ios` → App target → **Signing & Capabilities**
      - **+ Capability** → **Push Notifications**
      - **+ Capability** → **Background Modes** → check **Remote notifications**
      - Rebuild + reinstall on a real iPhone (the iOS Simulator can NOT
        receive APNS pushes — phone auth will fail in Sim no matter what).

   **iOS Simulator note:** Phone auth requires APNS, which the Simulator can't
   receive. To test in Sim, sign in via Google or Apple SSO instead (those
   work over the web SDK popup flow). Phone auth must be tested on a real
   device via Xcode (Run on connected iPhone) or TestFlight.
2. **Backend CORS** — `.env.example` files in `13_companion_backend/` are
   updated, but the live Cloud Run env var still needs the change:

   ```bash
   gcloud run services update deriva-companion-api \
     --region southamerica-west1 \
     --update-env-vars 'DERIVA_CORS_ALLOWED_ORIGINS=http://localhost:3000,capacitor://localhost,https://localhost'
   ```

   The backend's domain-suffix CORS path rejects non-http(s) schemes
   (`internal/http/server.go:211`), so `capacitor://localhost` MUST go in the
   exact-origins env var, not `DERIVA_CORS_ALLOWED_DOMAINS`.
3. **Deep links** — serve `apple-app-site-association` (no extension,
   `application/json`) from `derivastudio.cl/.well-known/` and
   `assetlinks.json` likewise. Both need the real Team ID + SHA-256 cert
   fingerprint generated above.
4. **Push notifications** — `@capacitor/push-notifications` + an FCM project
   (separate from the Auth project). Defer until there's an actual push use
   case (order ready? Apertura day?).
5. **Safe-area sweep** — 11 routes use static top/bottom padding instead of
   `env(safe-area-inset-*)`. They render fine in Mobile Safari (URL bar
   absorbs the inset) but will clip the notch / home-indicator in a Capacitor
   WebView. Routes: all 6 `/ingresar/*` steps, `/inicio`, `/canjear/[rewardId]`,
   `/carta/[id]`, `/offline`, `/verificar-email`. `/canjear` and `/offline`
   also use `100vh` instead of `100dvh`.
6. **Analytics blind spot** — `@vercel/analytics` and `@vercel/speed-insights`
   are web-only; native sessions either need a different channel or must be
   acknowledged as out-of-scope for product analytics.
7. **Identity reconciliation** — see
   `project_companion_identity_reconciliation.md`. More painful on native:
   email-list members tapping the Apertura email deep link will land in a
   phone-first onboarding flow with no email-to-account bridge.
