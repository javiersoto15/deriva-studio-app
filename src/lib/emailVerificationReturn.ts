// Hint for /verificar-email: where to send the user after the action code is
// consumed. Set right before POST /me/email by the caller that knows the
// context (signup wizard vs. settings sheet). Read once on success.
//
// localStorage means this only round-trips if the user opens the email link
// on the same browser they triggered it from. Cross-device falls through to
// the handler's default, which is fine — that path is rare and a sensible
// default still works.

const STORAGE_KEY = "deriva.emailVerification.returnPath";

// 15-minute TTL — Firebase action codes expire in 1h, but if the user
// abandons the flow we don't want a stale hint hijacking an unrelated
// future verification.
const TTL_MS = 15 * 60 * 1000;

type Stored = { path: string; setAt: number };

function isSafeReturnPath(path: string): boolean {
  // Only same-origin relative paths starting with `/`, no protocol-relative
  // (`//`) or backslash variants that could escape the origin.
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function setEmailVerificationReturn(path: string): void {
  if (typeof window === "undefined") return;
  if (!isSafeReturnPath(path)) return;
  try {
    const entry: Stored = { path, setAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Quota/private-mode failures are non-fatal; handler falls back to default.
  }
}

export function consumeEmailVerificationReturn(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (typeof parsed.path !== "string" || typeof parsed.setAt !== "number") return null;
    if (Date.now() - parsed.setAt > TTL_MS) return null;
    if (!isSafeReturnPath(parsed.path)) return null;
    return parsed.path;
  } catch {
    return null;
  }
}
