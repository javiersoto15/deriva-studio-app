// Shared locale vocabulary — importable from server, client, and the next-intl
// request config alike (NO "use client" / "server-only" directive on purpose,
// and NO next/headers import so it stays safe in the client bundle).
//
// Two distinct vocabularies meet here:
//   - Frontend UI locale (next-intl): "es" | "en" | "pt-BR"
//   - Backend content locale (BCP-47): "es-CL" | "en" | "pt-BR" — openapi enum
//
// The backend owns localized menu/reward copy and resolves it from ?locale.
// `toBackendLocale` is the single bridge between the two. New locales added
// here MUST also be added to the backend enum in openapi.yaml.

// ---- Frontend UI locale (next-intl, no routing) ----------------------------
export const defaultLocale = "es" as const;
export const locales = ["es", "en", "pt-BR"] as const;
export type Locale = (typeof locales)[number];

// Cookie that carries the active UI locale. Mirrors next-intl's own default
// cookie name so the convention is familiar. Written by LocaleSwitcher; read
// by the request config (server) and the companion locale provider (client).
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// ---- Backend content locale (BCP-47) ---------------------------------------
export type BackendLocale = "es-CL" | "en" | "pt-BR";
export const DEFAULT_BACKEND_LOCALE: BackendLocale = "es-CL";

// Maps a frontend short/UI locale ("es", "en", "pt", "pt-BR") to the backend's
// BCP-47 content locale. Unknown values fall back to the Chilean default —
// mirrors the backend's own "unknown → es-CL" fallback documented in the
// openapi spec.
export function toBackendLocale(short?: string | null): BackendLocale {
  if (short === "en") return "en";
  if (short === "pt" || short === "pt-BR") return "pt-BR";
  return DEFAULT_BACKEND_LOCALE;
}
