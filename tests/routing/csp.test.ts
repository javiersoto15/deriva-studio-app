import assert from "node:assert/strict";
import test from "node:test";

import { buildCsp, firebaseAuthEmulatorOrigin } from "../../middleware";

const env = process.env as Record<string, string | undefined>;

const originalEnv = {
  nodeEnv: env.NODE_ENV,
  useEmulator: env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR,
  emulatorHost: env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST
};

function restoreEnv() {
  if (originalEnv.nodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = originalEnv.nodeEnv;
  if (originalEnv.useEmulator === undefined) delete env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR;
  else env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR = originalEnv.useEmulator;
  if (originalEnv.emulatorHost === undefined) delete env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  else env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = originalEnv.emulatorHost;
}

test("development emulator CSP admits the configured loopback origin", () => {
  env.NODE_ENV = "development";
  env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR = "true";
  env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = "http://127.0.0.1:19099";
  try {
    assert.equal(firebaseAuthEmulatorOrigin(), "http://127.0.0.1:19099");
    const csp = buildCsp("test-nonce");
    assert.match(csp, /connect-src[^;]*http:\/\/127\.0\.0\.1:19099/);
    assert.match(csp, /connect-src[^;]*ws:\/\/127\.0\.0\.1:19099/);
  } finally {
    restoreEnv();
  }
});

test("the emulator CSP allowlist rejects public hosts and stays off in production", () => {
  env.NODE_ENV = "development";
  env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR = "true";
  env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = "https://auth.example.com";
  try {
    assert.equal(firebaseAuthEmulatorOrigin(), null);
    assert.doesNotMatch(buildCsp("test-nonce"), /auth\.example\.com/);

    env.NODE_ENV = "production";
    env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = "http://127.0.0.1:19099";
    assert.equal(firebaseAuthEmulatorOrigin(), null);
    assert.doesNotMatch(buildCsp("test-nonce"), /127\.0\.0\.1:19099/);
  } finally {
    restoreEnv();
  }
});
