import "server-only";

// Server-held bearer token for the protected /staff/* campaign-reward endpoints.
// The PIN cookie gates the human operator (see staff-match-up.ts); this token is
// what actually authenticates the proxy to the Go backend, which requires a
// Firebase staff/manager/owner bearer. It is set ONLY in server env
// (BACKEND_STAFF_TOKEN in Vercel) and never reaches the browser.
//
// OPEN ITEM (spec §8.1): provision a long-lived staff-role service credential
// and document its refresh story. Until BACKEND_STAFF_TOKEN is set, staff
// actions return a calm "config unavailable" state instead of a raw 401.

export function staffBearerToken(): string | null {
  const token = process.env.BACKEND_STAFF_TOKEN;
  return token && token.trim().length > 0 ? token.trim() : null;
}
