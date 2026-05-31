// next-intl request config — "without i18n routing" setup. The active UI
// locale is resolved from the NEXT_LOCALE cookie (written by LocaleSwitcher),
// defaulting to Spanish. No locale path segment — host-based routing owns the
// URL space (see middleware.ts), so a cookie is the locale carrier.
//
// Backend-driven content (menu, rewards) localizes via ?locale on each fetch
// using toBackendLocale(); this module governs only client-side UI chrome
// translation (next-intl messages). Client-safe locale constants live in
// ./locale (this file imports next/headers and is therefore server-only).
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./locale";

export async function loadMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return (await import("./messages/en.json")).default;
    case "pt-BR":
      return (await import("./messages/pt-BR.json")).default;
    case "es":
    default:
      return (await import("./messages/es.json")).default;
  }
}

// next-intl invokes this per request when a Server Component reads the locale
// (getLocale / getTranslations). Reads the cookie → makes the calling scope
// dynamic, so it must never be reached from inside a `'use cache'` boundary
// (the cached menu fetchers take `locale` as an explicit arg precisely to
// avoid this) and any RSC caller must sit inside a Suspense boundary
// (cacheComponents is on).
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieValue) ? cookieValue : defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
