"use client";

import {
  type AuthError,
  type ConfirmationResult,
  type UserCredential,
  type User,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  applyActionCode as fbApplyActionCode,
  isSignInWithEmailLink,
  linkWithPhoneNumber,
  linkWithPopup,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink as fbSignInWithEmailLink,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as fbSignOut,
  unlink as fbUnlink
} from "firebase/auth";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { getFirebaseAuth } from "./firebase";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

// Providers the frontend can sign in with or link to an existing account.
// Strings match Firebase provider ids exactly, which is also what backend
// `LinkProviderRequest.provider` expects (the openapi enum mirrors them).
export type SsoProvider = "google.com" | "apple.com";

// Result of a Firebase link/sign-in that yields credential metadata the
// backend needs to record in auth_identities. The subject is the user-visible
// provider subject (google sub, apple sub, email address, normalized phone)
// — never the Firebase UID.
export type ProviderCredentialMeta = {
  provider: "phone" | "email-link" | "password" | "google.com" | "apple.com";
  credential_subject: string;
  credential_verified: boolean;
  claims: Record<string, unknown>;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type AuthResultWith<T> =
  | ({ ok: true } & T)
  | { ok: false; code: string; message: string };

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  signInWithPhone: (phone: string) => Promise<AuthResult>;
  verifyOtp: (code: string) => Promise<AuthResult>;
  // SSO sign-in via popup. Returns provider credential metadata the caller
  // can post to /me/link-provider if this was a *link* attempt — for fresh
  // sign-ins the backend mints the auth_identity on first /me/POST.
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  // Passwordless email sign-in. sendEmailLink stores the email in
  // localStorage so completeEmailLink can verify it on the action-code
  // landing route.
  sendEmailLink: (email: string, redirectUrl: string) => Promise<AuthResult>;
  completeEmailLink: (href: string) => Promise<AuthResult>;
  // Applies an out-of-band Firebase action code (verify-email or email
  // revoke). Used by /verificar-email when the action link is a pure
  // verify-email link rather than a sign-in-link. After this resolves
  // successfully, the next /me/identity fetch will see email_verified_at
  // populated by the backend's reconciler.
  applyActionCode: (code: string) => Promise<AuthResult>;
  // In-app phone link for an already-authed user. Calls Firebase
  // linkWithPhoneNumber against the current user (NOT signInWithPhoneNumber),
  // so the user's primary auth session is preserved. After verifyLinkOtp
  // succeeds, callers MUST force a fresh ID token with getIdToken(true) so
  // the Deriva backend sees a verified phone_number claim on POST
  // /me/phone/confirm.
  linkPhone: (phone: string) => Promise<AuthResult>;
  verifyLinkOtp: (code: string) => Promise<AuthResult>;
  // Link an SSO provider to the currently signed-in user. Returns the
  // credential metadata the caller can forward to POST /me/link-provider.
  linkProvider: (provider: SsoProvider) => Promise<AuthResultWith<{ credential: ProviderCredentialMeta }>>;
  // Unlink at the Firebase level — backend mirror call is DELETE
  // /me/link-provider/{provider}. Caller should issue both, ideally
  // backend-first so a 409 last_method_cant_remove blocks the Firebase
  // unlink (which would otherwise leave the user with no auth methods).
  unlinkFirebaseProvider: (provider: SsoProvider | "phone" | "password") => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // forceRefresh=true triggers a fresh Firebase token mint — needed after a
  // provider link adds a new claim (e.g., phone_number). Callers use this
  // immediately before any backend confirm endpoint that reads provider
  // claims off the bearer.
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

// Map Firebase Auth error codes to ES-locale user-facing copy.
// Anything unmapped falls back to the generic message at the call site.
function describeAuthError(err: unknown): { code: string; message: string } {
  const fbErr = err as Partial<AuthError> & { code?: string; message?: string };
  const code = typeof fbErr?.code === "string" ? fbErr.code : "auth/unknown";
  switch (code) {
    case "auth/invalid-phone-number":
      return { code, message: "El número no es válido. Revisa los 8 dígitos." };
    case "auth/missing-phone-number":
      return { code, message: "Ingresa tu número de teléfono." };
    case "auth/quota-exceeded":
    case "auth/too-many-requests":
      return {
        code,
        message: "Recibimos muchos intentos. Espera unos minutos e inténtalo de nuevo."
      };
    case "auth/captcha-check-failed":
      return { code, message: "No pudimos verificar que no eres un robot. Recarga la página." };
    case "auth/network-request-failed":
      return { code, message: "Sin conexión. Revisa tu internet e inténtalo de nuevo." };
    case "auth/invalid-verification-code":
    case "auth/invalid-verification-id":
      return { code, message: "El código no es válido o expiró. Pídenos otro." };
    case "auth/code-expired":
      return { code, message: "El código expiró. Pídenos otro." };
    default:
      return {
        code,
        message: typeof fbErr?.message === "string" && fbErr.message
          ? fbErr.message
          : "Ocurrió un problema. Inténtalo de nuevo."
      };
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

const RECAPTCHA_CONTAINER_ID = "deriva-recaptcha-container";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  // Separate confirmation ref for in-app phone-link flow. Mixing it with the
  // sign-in confirmation would let a stale signup code accidentally confirm
  // a link mid-flow (and vice versa) if both flows are active in the same
  // session — unlikely but cheap to isolate.
  const linkConfirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (next) => {
        setUser(next);
        setStatus(next ? "authenticated" : "anonymous");
      });
      return () => unsubscribe();
    } catch {
      // Firebase not configured — stay in 'anonymous' so UI renders.
      setStatus("anonymous");
      return;
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      const auth = getFirebaseAuth();
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
          size: "invisible"
        });
      }
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phone,
        verifierRef.current
      );
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  const verifyOtp = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      if (!confirmationRef.current) {
        return {
          ok: false,
          code: "auth/no-pending-confirmation",
          message: "No hay un código pendiente de verificación. Solicita uno nuevo."
        };
      }
      await confirmationRef.current.confirm(code);
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code: errCode, message } = describeAuthError(err);
      return { ok: false, code: errCode, message };
    }
  }, []);

  const linkPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      const auth = getFirebaseAuth();
      const current = auth.currentUser;
      if (!current) {
        return {
          ok: false,
          code: "auth/no-current-user",
          message: "Inicia sesión antes de sumar un teléfono."
        };
      }
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
          size: "invisible"
        });
      }
      linkConfirmationRef.current = await linkWithPhoneNumber(
        current,
        phone,
        verifierRef.current
      );
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  const verifyLinkOtp = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      if (!linkConfirmationRef.current) {
        return {
          ok: false,
          code: "auth/no-pending-link",
          message: "No hay un código pendiente para sumar el teléfono. Pide otro."
        };
      }
      await linkConfirmationRef.current.confirm(code);
      linkConfirmationRef.current = null;
      // Force a fresh ID token so the Deriva confirm endpoint sees the new
      // phone_number claim from Firebase. The caller will read it via
      // getIdToken(true) right after this resolves.
      const current = getFirebaseAuth().currentUser;
      await current?.getIdToken(true);
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code: errCode, message } = describeAuthError(err);
      return { ok: false, code: errCode, message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth());
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    const current = getFirebaseAuth().currentUser;
    if (!current) return null;
    return current.getIdToken(forceRefresh);
  }, []);

  // ----- SSO sign-in (Google, Apple) -----
  //
  // Popup-based; redirect-based fallback is the right escape hatch on iOS
  // Safari where popups can be blocked, but we start with popup since it's
  // the simpler primitive. If iOS-Safari Pop-up Blocker becomes a real
  // friction point, swap to signInWithRedirect + getRedirectResult.
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    try {
      await signInWithPopup(getFirebaseAuth(), new OAuthProvider("apple.com"));
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  // ----- Email-link sign-in -----
  //
  // sendEmailLink persists the email locally so the action-code landing
  // route (where the user clicks the link from email) can complete the
  // sign-in without asking the user to re-type their address.
  const EMAIL_LINK_KEY = "derivaEmailForSignIn";

  const sendEmailLink = useCallback(async (email: string, redirectUrl: string): Promise<AuthResult> => {
    try {
      await sendSignInLinkToEmail(getFirebaseAuth(), email, {
        url: redirectUrl,
        handleCodeInApp: true
      });
      try {
        window.localStorage.setItem(EMAIL_LINK_KEY, email);
      } catch {
        // Storage unavailable (private mode etc.) — the landing route will
        // prompt the user for their email instead.
      }
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  const applyActionCode = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      await fbApplyActionCode(getFirebaseAuth(), code);
      // Force a fresh ID token so the next /me / /me/identity request
      // reflects email_verified status if the backend reconciles it.
      await getFirebaseAuth().currentUser?.getIdToken(true);
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code: errCode, message } = describeAuthError(err);
      return { ok: false, code: errCode, message };
    }
  }, []);

  const completeEmailLink = useCallback(async (href: string): Promise<AuthResult> => {
    try {
      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, href)) {
        return {
          ok: false,
          code: "auth/invalid-email-link",
          message: "El enlace ya no es válido. Pídenos otro."
        };
      }
      const stored = (() => {
        try {
          return window.localStorage.getItem(EMAIL_LINK_KEY);
        } catch {
          return null;
        }
      })();
      if (!stored) {
        return {
          ok: false,
          code: "auth/missing-email",
          message: "Necesitamos saber qué email es. Vuelve a iniciar el envío."
        };
      }
      await fbSignInWithEmailLink(auth, stored, href);
      try {
        window.localStorage.removeItem(EMAIL_LINK_KEY);
      } catch {
        // ignore
      }
      return { ok: true };
    } catch (err) {
      console.error("[Deriva]", err);
      const { code, message } = describeAuthError(err);
      return { ok: false, code, message };
    }
  }, []);

  // ----- Link SSO provider to existing user -----
  //
  // Returns credential metadata the caller forwards to POST /me/link-provider.
  // The backend records the link in auth_identities; if the same provider
  // subject already belongs to a different user_profile, backend returns
  // 409 provider_taken and the caller surfaces the inline conflict UX.
  const linkProvider = useCallback(
    async (
      provider: SsoProvider
    ): Promise<AuthResultWith<{ credential: ProviderCredentialMeta }>> => {
      try {
        const current = getFirebaseAuth().currentUser;
        if (!current) {
          return {
            ok: false,
            code: "auth/no-current-user",
            message: "Inicia sesión antes de conectar otro método."
          };
        }
        const fbProvider =
          provider === "google.com" ? new GoogleAuthProvider() : new OAuthProvider("apple.com");
        const result: UserCredential = await linkWithPopup(current, fbProvider);
        // Force-refresh so any new claims (email, sub) land on the next bearer.
        await current.getIdToken(true);
        const linked = result.user.providerData.find((p) => p.providerId === provider);
        const credential: ProviderCredentialMeta = {
          provider,
          credential_subject: linked?.uid ?? linked?.email ?? "",
          credential_verified: true,
          claims: {
            email: linked?.email ?? undefined,
            display_name: linked?.displayName ?? undefined,
            provider_id: provider
          }
        };
        return { ok: true, credential };
      } catch (err) {
        console.error("[Deriva]", err);
        const { code, message } = describeAuthError(err);
        return { ok: false, code, message };
      }
    },
    []
  );

  const unlinkFirebaseProvider = useCallback(
    async (provider: SsoProvider | "phone" | "password"): Promise<AuthResult> => {
      try {
        const current = getFirebaseAuth().currentUser;
        if (!current) {
          return {
            ok: false,
            code: "auth/no-current-user",
            message: "Inicia sesión antes de desconectar un método."
          };
        }
        await fbUnlink(current, provider);
        await current.getIdToken(true);
        return { ok: true };
      } catch (err) {
        console.error("[Deriva]", err);
        const { code, message } = describeAuthError(err);
        return { ok: false, code, message };
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signInWithPhone,
      verifyOtp,
      signInWithGoogle,
      signInWithApple,
      sendEmailLink,
      completeEmailLink,
      applyActionCode,
      linkPhone,
      verifyLinkOtp,
      linkProvider,
      unlinkFirebaseProvider,
      signOut,
      getIdToken
    }),
    [
      user,
      status,
      signInWithPhone,
      verifyOtp,
      signInWithGoogle,
      signInWithApple,
      sendEmailLink,
      completeEmailLink,
      applyActionCode,
      linkPhone,
      verifyLinkOtp,
      linkProvider,
      unlinkFirebaseProvider,
      signOut,
      getIdToken
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
