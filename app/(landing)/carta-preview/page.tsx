import type { Metadata } from "next";
import { Suspense } from "react";

import { getPublicMenuView } from "../../../src/api/server";
import { getActiveLocale, getActiveBackendLocale } from "../../../src/i18n/server";
import { PRICING_OPEN_AT } from "../../../src/data/menu";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { CartaBody } from "./_components/CartaBody";

// Preview route for the El Mercado /menu redesign. Not the live carta yet — kept
// out of the index so it can't compete with /menu for SEO or be mistaken for the
// real thing. The locale-cookie read + menu fetch are dynamic, so they live in a
// Suspense boundary (Cache Components / PPR) rather than a force-dynamic export.
export const metadata: Metadata = {
  title: "Carta · vista previa",
  robots: { index: false, follow: false }
};

async function CartaContent() {
  const [uiLocale, backendLocale] = await Promise.all([
    getActiveLocale(),
    getActiveBackendLocale()
  ]);
  const menu = await getPublicMenuView({ locale: backendLocale });
  const showPrices = Date.now() >= PRICING_OPEN_AT.getTime();

  if (!menu) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", fontFamily: "var(--mono)" }}>
        <p>La carta no está disponible en este momento.</p>
      </div>
    );
  }
  return <CartaBody menu={menu} locale={uiLocale} showPrices={showPrices} />;
}

export default function CartaPreviewPage() {
  return (
    <>
      <SiteNav active="carta" variant="solid" />
      <main className="menu-page menu-page--with-nav">
        <Suspense fallback={null}>
          <CartaContent />
        </Suspense>
      </main>
    </>
  );
}
