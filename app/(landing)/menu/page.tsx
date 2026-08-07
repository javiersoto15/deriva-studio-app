import type { Metadata } from "next";
import { Suspense } from "react";

import {
  getPublicMenuView,
  type PublicMenuView,
  type PublicMenuItem
} from "../../../src/api/server";
import { getActiveLocale, getActiveBackendLocale } from "../../../src/i18n/server";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { CartaBody } from "./_components/CartaBody";
import { CartaSkeleton } from "./_components/CartaSkeleton";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/menu`;

export const metadata: Metadata = {
  title: "La carta",
  description:
    "Café de especialidad, panadería de masa madre y cocina de mercado en Deriva Coffee Studio. Carta de temporada vigente al servicio en Magnere 1570 Local 105, Providencia, Santiago.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "La carta · Deriva Coffee Studio",
    description:
      "Café de especialidad, panadería de masa madre y cocina de mercado. Carta de temporada vigente al servicio.",
    url: pageUrl,
    type: "website"
  }
};

// Maps one backend menu item to a schema.org MenuItem node. `showPrices`
// mirrors the page's price-reveal gate so structured data never exposes a
// price before it's visible to humans (Google wants markup to match the page).
function menuItemJsonLd(item: PublicMenuItem, showPrices: boolean): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "MenuItem",
    name: item.name,
    description: item.description
  };
  if (showPrices && typeof item.price_clp === "number") {
    node.offers = {
      "@type": "Offer",
      price: item.price_clp,
      priceCurrency: "CLP",
      availability: item.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock"
    };
  }
  return node;
}

function buildMenuJsonLd(menu: PublicMenuView, showPrices: boolean): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${pageUrl}#menu`,
    name: `${menu.name} · ${menu.season}`,
    inLanguage: menu.locale ?? "es-CL",
    url: pageUrl,
    provider: { "@id": `${siteUrl}/#cafe` },
    hasMenuSection: menu.sections.map((section) => ({
      "@type": "MenuSection",
      name: section.title.replace(/\.$/, ""),
      description: section.lede,
      hasMenuItem: [
        ...(section.items ?? []),
        ...(section.subgroups?.flatMap((g) => g.items) ?? [])
      ].map((item) => menuItemJsonLd(item, showPrices))
    }))
  };
}

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildMenuJsonLd(menu, showPrices)) }}
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
