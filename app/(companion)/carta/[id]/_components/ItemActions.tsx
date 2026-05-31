"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "../../../../../src/ui/Button";
import { Eyebrow } from "../../../../../src/ui/Eyebrow";
import { colors } from "../../../../../src/design/tokens";

// Localized back-link to the carta. A client component (rather than translating
// in the page's static header via getTranslations, which would read the cookie
// and abort PPR for the shell) — useTranslations resolves from the companion
// provider with no server cookie read.
export function ItemBackLink() {
  const t = useTranslations("menu");
  return (
    <Link
      href="/carta"
      style={{
        fontFamily: "var(--font-display), serif",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 16,
        color: colors.brown700,
        textDecoration: "none"
      }}
    >
      ← {t("back")}
    </Link>
  );
}

// Phase 2B.5 — Client island for the item detail page.
// Renders the "♡ Guardar" header button and the "Es mi usual" CTA. Wiring to
// the favorites mutation lands in Phase 2C; for now these are visual only,
// matching the original client-page behavior. The `itemId` prop will be the
// cache key for the mutation once it's wired. Labels localize via next-intl
// (the companion provider supplies the active UI locale).
export function ItemSaveButton({ itemId: _itemId }: { itemId: string }) {
  const t = useTranslations("menu");
  return (
    <button
      type="button"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--color-brown-700, #5a3a1e)",
        fontFamily: "var(--font-display), serif",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 16
      }}
    >
      ♡ {t("save")}
    </button>
  );
}

export function ItemUsualCta({ itemId: _itemId }: { itemId: string }) {
  const t = useTranslations("menu");
  return (
    <Button variant="primary" style={{ width: "100%" }}>
      {t("my_usual")}
    </Button>
  );
}

// Client loading fallback for the item detail body — a Suspense fallback must
// render synchronously, so it can't use the async getTranslations(); a client
// component using the useTranslations() hook localizes the placeholder instead.
export function ItemBodyFallback() {
  const t = useTranslations("menu");
  return (
    <div style={{ flex: 1, paddingTop: 8 }}>
      <Eyebrow>{t("item_loading")}</Eyebrow>
    </div>
  );
}
