// Sentry — client (browser) init.
// No-op when NEXT_PUBLIC_SENTRY_DSN is empty so dev / un-provisioned envs boot cleanly.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    debug: false,
    release:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      "dev-local",
    environment:
      process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    dist: process.env.VERCEL_DEPLOYMENT_ID
  });
}
