import React from "react";

import type { Locale } from "../../../../src/i18n/locale";

export function AuthorByline({
  author,
  locale,
  className
}: {
  author?: string | null;
  locale: Locale;
  className?: string;
}) {
  const name = author?.trim();
  if (!name) return null;

  return (
    <span className={className}>
      {locale === "en" ? "By" : "Por"} {name}
    </span>
  );
}
