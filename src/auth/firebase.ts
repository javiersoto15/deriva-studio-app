import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
};

const isProduction = process.env.NODE_ENV === "production";
const USE_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
const CONFIGURED_EMULATOR_HOST =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ?? "http://localhost:9099";

let emulatorConnected = false;

// Resolve the actual emulator URL the browser should hit.
// When a developer loads the app from a LAN device (e.g., their phone at
// http://192.168.x.y:3000), `localhost` in the configured host won't resolve —
// the phone has no service on its own localhost:9099. We swap localhost for
// the hostname the page was loaded from, so the same emulator instance serves
// both the desktop browser and any LAN device pointed at the dev server.
function resolveEmulatorHost(): string {
  if (typeof window === "undefined") return CONFIGURED_EMULATOR_HOST;
  try {
    const url = new URL(CONFIGURED_EMULATOR_HOST);
    if (url.hostname === "localhost" && window.location.hostname !== "localhost") {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
    return CONFIGURED_EMULATOR_HOST;
  } catch {
    return CONFIGURED_EMULATOR_HOST;
  }
}

function assertConfig(): void {
  const missing = (Object.keys(config) as Array<keyof typeof config>).filter(
    (k) => !config[k]
  );
  if (missing.length === 0) return;
  const message = `[Deriva] Firebase env vars missing: ${missing.join(", ")}. ` +
    "Phone auth will fail until provisioned. See docs/plans/2026-05-10-companion-firebase-setup-checklist.md.";
  if (isProduction && !USE_EMULATOR) {
    throw new Error(message);
  }
  if (typeof window !== "undefined") {
    console.warn(message);
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    assertConfig();
    return initializeApp(config);
  }
  return getApp();
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  if (USE_EMULATOR && !emulatorConnected) {
    if (isProduction) {
      // Hard refuse: production must never talk to an emulator.
      throw new Error(
        "[Deriva] NEXT_PUBLIC_FIREBASE_USE_EMULATOR is 'true' in production. Refusing to connect."
      );
    }
    // disableWarnings: true hides Firebase's bottom-fixed yellow banner
    // ("Running in emulator mode") that would otherwise cover the companion app's
    // bottom tab bar. Emulator-mode status is still surfaced via the console.info
    // line below + the Auth Emulator UI at :4000 + the fact that any phone+code works.
    const host = resolveEmulatorHost();
    connectAuthEmulator(auth, host, { disableWarnings: true });
    emulatorConnected = true;
    if (typeof window !== "undefined") {
      console.info(`[Deriva] Firebase Auth connected to emulator at ${host}`);
    }
  }
  return auth;
}
