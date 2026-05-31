"use client";

import { useLocale } from "next-intl";

import { toBackendLocale, type BackendLocale } from "./locale";

// Client-side active-locale hook. Reads the locale from NextIntlClientProvider
// (mounted in the companion layout) and maps it to the backend content locale,
// so authed companion menu fetches request the user's active UI language.
export function useActiveBackendLocale(): BackendLocale {
  return toBackendLocale(useLocale());
}
