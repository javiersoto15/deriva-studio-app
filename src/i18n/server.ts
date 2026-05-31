import "server-only";

import { getLocale } from "next-intl/server";

import {
  defaultLocale,
  isLocale,
  toBackendLocale,
  type BackendLocale,
  type Locale
} from "./locale";

// Server-side active UI locale (next-intl short code: "es" | "en" | "pt-BR").
// Used to seed client components (e.g. LocaleSwitcher) with the current locale
// as a prop, avoiding a document.cookie read on first client paint.
export async function getActiveLocale(): Promise<Locale> {
  const locale = await getLocale();
  return isLocale(locale) ? locale : defaultLocale;
}

// Server-side active-locale resolution for RSCs and Route Handlers.
//
// `getLocale()` triggers the next-intl request config (request.ts), which reads
// the NEXT_LOCALE cookie — so calling this marks the scope dynamic. NEVER call
// it from inside a `'use cache'` boundary; instead resolve the locale in the
// dynamic caller and pass it as an explicit arg to the cached fetcher (the
// pattern getPublicMenuView / getMenuItem already follow).
export async function getActiveBackendLocale(): Promise<BackendLocale> {
  return toBackendLocale(await getLocale());
}
