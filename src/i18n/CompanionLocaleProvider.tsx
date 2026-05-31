"use client";

import { NextIntlClientProvider } from "next-intl";
import { useState, type ReactNode } from "react";

import enMessages from "./messages/en.json";
import esMessages from "./messages/es.json";
import ptMessages from "./messages/pt-BR.json";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./locale";

// Statically bundled so locale selection is synchronous — no async import, no
// flash. The chrome message set is tiny (a few dozen strings × 3 locales).
const MESSAGES: Record<Locale, Record<string, unknown>> = {
  es: esMessages,
  en: enMessages,
  "pt-BR": ptMessages
};

function readCookieLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === LOCALE_COOKIE) {
      const value = decodeURIComponent(rest.join("="));
      if (isLocale(value)) return value;
    }
  }
  return defaultLocale;
}

// Client-side next-intl provider for the companion surface. Reading the cookie
// on the client (instead of in the server layout) keeps the companion layout
// PPR-prerenderable — a server cookie read there would abort PPR for the whole
// subtree. The useState initializer runs on the client's first (hydration)
// render with `document` available, so useLocale() returns the cookie locale
// from the first client render. SSR uses the default; no chrome is translated
// in the static shell, so there is no hydration mismatch.
//
// LocaleSwitcher writes the cookie and calls router.refresh(), which remounts
// this provider with the new cookie value picked up by the initializer.
export function CompanionLocaleProvider({ children }: { children: ReactNode }) {
  const [locale] = useState<Locale>(readCookieLocale);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="America/Santiago"
    >
      {children}
    </NextIntlClientProvider>
  );
}
