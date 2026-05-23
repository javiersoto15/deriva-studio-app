# Next session — Capacitor native shell, what's next

**Last updated:** 2026-05-23, end of session.
**Pickup context:** read `project_capacitor_native_shell.md` in auto-memory + this file.

## State as of last session

iOS native shell is **runnable + signed in via Google end-to-end in Simulator**. Both `signInWithPhone` and `signInWithGoogle` (plus their `linkProvider` counterpart) branch on `Capacitor.isNativePlatform()` and use `@capacitor-firebase/authentication` with `skipNativeAuth:true`. The `/estudio` "Conectar Google" link flow works.

Tested in Sim and confirmed working:
- Splash, /inicio, /ingresar with proper safe-area
- Google SSO sign-in → backend `/me` 403 → onboarding completion
- Phone capture step (linkPhone) — fires native plugin (no reCAPTCHA bug anymore), but no SMS because Sim can't receive APNS
- `/estudio` link a second provider via `linkProvider`

Last commit on `main`: `1c0f478 ios: commit SPM Package.resolved lockfile`. All pushed.

## Pending tasks (TaskList state at session end)

| # | Status | Subject |
|---|---|---|
| 3 | pending | Add .well-known stubs for deep links |
| 4 | pending | Generate iOS/Android icon set |

## Next-session menu, ranked by value/hour

### 1. Exercise the rest of the app in Sim (~30 min, highest ROI)
You've never used the companion in a true native shell before. Walk `/carta`, `/cartera`, `/codigo`, `/estudio`, `/actividad`, `/canjear`, `/sumar-visita` as your signed-in user. Likely surfaces:
- More safe-area gaps (5 routes still on static padding — see `feedback-ui-iteration-mode` for triage)
- `100vh` → `100dvh` bugs on `/canjear`, `/offline`
- Keyboard avoidance on OTP grid + free-text inputs
- Sheet (`src/ui/Sheet.tsx`) gesture/dismiss in WKWebView
- Pull-to-refresh behavior

### 2. APNS setup + real iPhone test (~30 min, unblocks phone auth)
Three manual steps from `docs/native/SETUP.md` item 1:
- Generate APNS Auth Key at developer.apple.com (keys section)
- Upload to Firebase Console → Cloud Messaging
- Add Push Notifications + Background Modes (Remote notifications) capabilities in Xcode
Then plug an iPhone via USB → Xcode device picker → ⌘R installs on device. Phone auth should work.

### 3. Apple SSO (~1 hr)
Required by App Store rules if any other SSO is offered. Needs:
- Services ID in developer.apple.com
- Sign in with Apple capability in Xcode
- Entitlement file
- Firebase Console → Apple provider config
- Code swap mirrors what we did for Google (already supported by `@capacitor-firebase/authentication`)

### 4. .well-known files (~20 min, Universal Links)
Team ID known: `7XGTNY336J`. Bundle: `cl.derivastudio.companion`. Serve from `derivastudio.cl/.well-known/aasa` and `.well-known/assetlinks.json` (Android, has SHA-256 placeholder until cap add android runs).

Create as Next.js route handlers in `app/.well-known/`:
```ts
// app/.well-known/apple-app-site-association/route.ts
export async function GET() {
  return Response.json(
    {
      applinks: {
        details: [{ appIDs: ["7XGTNY336J.cl.derivastudio.companion"], components: [{ "/": "/verificar-email" }, { "/": "/canjear/*" }, { "/": "/feedback/*" }] }]
      }
    },
    { headers: { "Content-Type": "application/json" } }
  );
}
```

### 5. Icon master in Paper + capacitor/assets (Paper time + ~10 min)
Required for TestFlight. Paper-design 1024² source (strip the isotipo white rect per `feedback-isotipo-white-rect`), place at `resources/icon.png` + `resources/splash.png`, then `npx capacitor-assets generate`. See SETUP.md.

### 6. Android (several hours, defer)
Install Android Studio + SDK (~6GB). `npx cap add android`. Will surface its own gotchas (Play Integrity setup, SHA-256 fingerprint registration). Recommend deferring until iOS proven on TestFlight.

## Suggested opening prompt for next session

> Pick up the Capacitor native shell from last session. Read `project_capacitor_native_shell.md` and `docs/native/NEXT-SESSION.md`. Let's [exercise the rest of the app in Sim / do APNS setup / wire .well-known / etc — pick one].

The skill `deriva-webapp` will load. Memory entries for the native shell are already indexed in `MEMORY.md`.
