"use client";

import { useTransition } from "react";

import { colors } from "../design/tokens";
import { LOCALE_COOKIE, locales, type Locale } from "../i18n/locale";

// Short display labels for the three supported UI locales.
const LABELS: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  "pt-BR": "PT"
};

// Locale switcher — writes the NEXT_LOCALE cookie and refreshes so server
// components re-resolve their locale (request config) and menu fetchers re-run
// with the new ?locale. Reads/writes the cookie directly rather than depending
// on NextIntlClientProvider, so it works on both the companion (provider
// present) and the landing /menu (no provider) surfaces. The current locale is
// passed in as a prop (server-resolved) to avoid a first-paint cookie read.
export function LocaleSwitcher({ current }: { current: Locale }) {
  const [isPending, startTransition] = useTransition();

  function select(next: Locale) {
    if (next === current) return;
    // 1 year, lax — mirrors next-intl's own NEXT_LOCALE cookie conventions.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Full reload (not router.refresh): the companion provider holds the locale
    // in client state, which router.refresh() would not reset. A reload re-runs
    // both the server request config and the client provider initializer, so
    // the switch lands consistently on every surface. Locale change is a rare,
    // deliberate action, so the heavier reload is an acceptable trade.
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div
      role="group"
      aria-label="Idioma"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        opacity: isPending ? 0.5 : 1,
        transition: "opacity 120ms ease"
      }}
    >
      {locales.map((loc, i) => {
        const active = loc === current;
        return (
          <span key={loc} style={{ display: "inline-flex", alignItems: "center" }}>
            {i > 0 ? (
              <span aria-hidden="true" style={{ color: colors.hairline, margin: "0 6px" }}>
                ·
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => select(loc)}
              aria-pressed={active}
              disabled={isPending}
              style={{
                appearance: "none",
                background: "none",
                border: "none",
                padding: 0,
                cursor: active ? "default" : "pointer",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                color: active ? colors.ink900 : colors.inkMuted,
                fontWeight: active ? 600 : 400
              }}
            >
              {LABELS[loc]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
