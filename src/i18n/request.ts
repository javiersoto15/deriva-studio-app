// next-intl request config — provisioned for future locale switch.
// MVP is Spanish-only; EN keys exist but UI does not switch yet.
export const defaultLocale = "es" as const;
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export async function getMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return (await import("./messages/en.json")).default;
    case "es":
    default:
      return (await import("./messages/es.json")).default;
  }
}
