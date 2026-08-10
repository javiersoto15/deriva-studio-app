import type { Metadata } from "next";
import { Suspense } from "react";

import { getPublicMenuView } from "../../../src/api/server";
import { getActiveLocale, getActiveBackendLocale } from "../../../src/i18n/server";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { MENU_URL } from "../../../src/seo/local-business";
import { buildMenuGraph } from "../../../src/seo/menu-schema";
import { CartaBody } from "./_components/CartaBody";
import { CartaSkeleton } from "./_components/CartaSkeleton";

export const metadata: Metadata = {
  title: "Carta de café de especialidad en Providencia",
  description:
    "Carta de Deriva Coffee Studio en Providencia, Santiago: café de especialidad, desayunos y brunch, almuerzos con Menú Ejecutivo, onces y pastelería.",
  alternates: { canonical: MENU_URL },
  openGraph: {
    title: "Carta de café de especialidad en Providencia · Deriva Coffee Studio",
    description:
      "Café de especialidad, desayunos, brunch, almuerzos con Menú Ejecutivo, onces y pastelería en Magnere 1570.",
    url: MENU_URL,
    type: "website"
  }
};

// El Mercado carta — the live public /menu. The locale-cookie read + menu fetch
// are dynamic, so they live in a Suspense boundary (Cache Components / PPR)
// rather than a force-dynamic export.
async function CartaContent() {
  const [uiLocale, backendLocale] = await Promise.all([
    getActiveLocale(),
    getActiveBackendLocale()
  ]);
  const menu = await getPublicMenuView({ locale: backendLocale });
  // The pricing embargo lifted on 2026-05-17 (PRICING_OPEN_AT), so the gate is
  // permanently open. Dropping the Date.now() comparison also drops the
  // `await connection()` it required under Cache Components — the cookie reads
  // above already make this subtree dynamic.
  const showPrices = true;

  if (!menu) {
    return (
      <div style={{ padding: "120px 24px", textAlign: "center", fontFamily: "var(--mono)" }}>
        <p>La carta no está disponible en este momento.</p>
      </div>
    );
  }
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildMenuGraph(menu, showPrices)) }}
      />
      <CartaBody menu={menu} locale={uiLocale} showPrices={showPrices} />
    </>
  );
}

export default function MenuPage() {
  return (
    <>
      <SiteNav active="carta" variant="solid" />
      <main className="menu-page menu-page--with-nav">
        {/* A real fallback, not null: the carta's own ground is nocturno
            (#1a1410) while the empty .menu-page shell is cream, so an absent
            fallback made every navigation flash light-then-dark. The skeleton
            establishes the dark ground and the static masthead in the
            prerendered shell; only backend-derived rows resolve later. */}
        <Suspense fallback={<CartaSkeleton />}>
          <CartaContent />
        </Suspense>
      </main>
    </>
  );
}
