"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Eyebrow } from "../../../../../src/ui/Eyebrow";
import { colors } from "../../../../../src/design/tokens";
import {
  useAddFavorite,
  useCurrentMember,
  useFavorites,
  useRemoveFavorite
} from "../../../../../src/api/hooks";

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

// The authenticated member id comes from /me; the existing favorites endpoint
// validates the actor before the saved list is refreshed.
export function ItemSaveButton({ itemId }: { itemId: string }) {
  const t = useTranslations("menu");
  const member = useCurrentMember();
  const favorites = useFavorites();
  const add = useAddFavorite();
  const remove = useRemoveFavorite();
  const [failed, setFailed] = useState(false);
  const saved = favorites.data?.saved.some((favorite) => favorite.id === itemId) ?? false;
  const pending = add.isPending || remove.isPending;
  const ready = Boolean(member.data?.id && favorites.data && !pending);

  async function toggleFavorite() {
    const memberId = member.data?.id;
    if (!memberId || !favorites.data || pending) return;
    setFailed(false);
    try {
      if (saved) await remove.mutateAsync(itemId);
      else await add.mutateAsync({ memberId, itemId });
    } catch {
      setFailed(true);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <button
        type="button"
        className="tap-target"
        disabled={!ready}
        aria-pressed={saved}
        aria-busy={pending}
        onClick={() => void toggleFavorite()}
        style={{
          border: "none",
          background: "transparent",
          cursor: ready ? "pointer" : "default",
          color: colors.brown700,
          fontFamily: "var(--font-display), serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 16,
          opacity: ready ? 1 : 0.65
        }}
      >
        {saved ? `♥ ${t("saved")}` : `♡ ${t("save")}`}
      </button>
      {failed ? (
        <span role="alert" style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: colors.brown700 }}>
          {t("save_error")}
        </span>
      ) : null}
    </div>
  );
}

export function ItemUsualCta(_props: { itemId: string }) {
  return null;
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
