import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { Suspense } from "react";

import { getPublicMenuView } from "../../../src/api/server";
import { getActiveLocale, getActiveBackendLocale } from "../../../src/i18n/server";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { MENU_URL, SITE_NAME } from "../../../src/seo/local-business";
import { buildMenuGraph } from "../../../src/seo/menu-schema";
import { CartaA } from "./_components/carta-a/CartaA";
import { parseView } from "./_components/carta-a/doors";
import { CartaASkeleton } from "./_components/carta-a/CartaASkeleton";

// Carta A's display + body face. Scoped to /menu so the rest of the site keeps
// its own type system and doesn't pay for this font.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap"
});

type SearchParams = Promise<{ puerta?: string | string[] }>;

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
async function CartaContent({ searchParams }: { searchParams: SearchParams }) {
  const [uiLocale, backendLocale, params] = await Promise.all([
    getActiveLocale(),
    getActiveBackendLocale(),
    searchParams
  ]);
  const puerta = Array.isArray(params.puerta) ? params.puerta[0] : params.puerta;
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
      <CartaA menu={menu} locale={uiLocale} initialView={parseView(puerta)} />
    </>
  );
}

export default function MenuPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <SiteNav active="carta" variant="solid" brand={SITE_NAME} />
      <main className={`menu-page menu-page--with-nav ${bricolage.variable}`}>
        {/* The skeleton paints the cream ground and the four roast bands in the
            prerendered shell, so the doors don't jump in when the menu lands. */}
        <Suspense fallback={<CartaASkeleton />}>
          <CartaContent searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
