import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { PRICING_OPEN_AT } from "../../../src/data/menu";
import { getPublicMenuView, type PublicMenuView, type PublicMenuItem } from "../../../src/api/server";
import { getActiveBackendLocale } from "../../../src/i18n/server";
import { MenuChipNav } from "../../../src/components/menu/MenuChipNav";
import { MenuSection } from "../../../src/components/menu/MenuSection";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { LocaleSwitcherServer } from "../../../src/ui/LocaleSwitcherServer";

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
function menuItemJsonLd(
  item: PublicMenuItem,
  showPrices: boolean
): Record<string, unknown> {
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

function buildMenuJsonLd(
  menu: PublicMenuView,
  showPrices: boolean
): Record<string, unknown> {
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

// Renders the live menu chrome (chipnav + sections) from the backend
// /public/menu payload. Wrapped in <Suspense> so the marketing shell paints
// while the menu fetch resolves. `connection()` keeps the price-reveal gate
// dynamic — same behavior as before, only the source data swapped.
async function LiveMenu() {
  await connection();
  const locale = await getActiveBackendLocale();
  const [menu, t] = await Promise.all([
    getPublicMenuView({ locale }),
    getTranslations("menu")
  ]);
  if (!menu) {
    return null;
  }
  const forceShow = process.env.DERIVA_SHOW_PRICES === "1";
  const showPrices = forceShow || Date.now() >= PRICING_OPEN_AT.getTime();
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildMenuJsonLd(menu, showPrices)) }}
      />
      <MenuChipNav sections={menu.sections} />
      <div className="menu-content">
        <aside className="menu-sidebar" aria-hidden="true">
          <div className="menu-sidebar__group">
            <p className="menu-sidebar__label">Bebidas</p>
            <ul className="menu-sidebar__list menu-sidebar__list--active">
              <li>
                <a href="#section-cafeteria">
                  <span className="menu-diamond" aria-hidden="true" />
                  Cafetería
                </a>
              </li>
              <li><a href="#section-cafe-para-llevar">Café para llevar</a></li>
            </ul>
          </div>
          <div className="menu-sidebar__group">
            <p className="menu-sidebar__label">Cocina</p>
            <ul className="menu-sidebar__list">
              <li><a href="#section-desayunos">Desayunos y Brunch</a></li>
              <li><a href="#section-croissants">Croissants</a></li>
              <li><a href="#section-baguettes">Baguettes</a></li>
              <li><a href="#section-tostadas">Tostadas Gourmet</a></li>
              <li><a href="#section-focaccias">Focaccias</a></li>
              <li><a href="#section-cocina">Cocina</a></li>
              <li><a href="#section-pasteleria">Pastelería y Dulces</a></li>
            </ul>
          </div>
          <div className="menu-sidebar__group">
            <p className="menu-sidebar__label">Servicio</p>
            <p className="menu-sidebar__service">
              Lun–Vie 08:00–21:00
              <br />
              Sáb 10:00–21:00
              <br />
              Magnere 1570 Local 105
            </p>
          </div>
        </aside>

        <div className="menu-column">
          {menu.closed_today ? (
            <aside className="menu-closed-today" aria-label="Aviso de cierre">
              <span className="menu-closed-today__rule" aria-hidden="true" />
              <span className="menu-closed-today__label">
                CERRADO HOY · TE MOSTRAMOS LA CARTA DEL LUNES
              </span>
              <p className="menu-closed-today__body">
                Hoy descansamos. Esta carta queda visible para que puedas planificar tu visita de mañana.
              </p>
            </aside>
          ) : null}
          {menu.sections.map((section) => (
            <div key={section.id}>
              {section.id === "tostadas" ? (
                <aside className="menu-chapter" aria-label="Pausa editorial">
                  <span className="menu-chapter__rule" aria-hidden="true" />
                  <p className="menu-chapter__quote">
                    «Cuando el pan está bien hecho, el resto de la mesa se ordena solo.»
                  </p>
                  <p className="menu-chapter__caption">Panadería · Cocina</p>
                  <span className="menu-chapter__rule" aria-hidden="true" />
                </aside>
              ) : null}
              <MenuSection section={section} showPrices={showPrices} t={t} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function MenuPage() {
  return (
    <>
      <SiteNav active="carta" variant="solid" />
      <main className="menu-page menu-page--with-nav" aria-labelledby="menu-title">
        <div className="menu-outer">

        <div className="menu-sheet">
          <section className="menu-hero">
            <div className="menu-hero__left">
              <div className="menu-eyebrow">
                <span className="menu-diamond" aria-hidden="true" />
                <span>Carta · La mesa de Deriva</span>
              </div>
              <h1 id="menu-title" className="menu-hero__headline">
                Café de especialidad,
                <br />
                <em>cocina sin atajos.</em>
              </h1>
            </div>
            <div className="menu-hero__right">
              <div className="menu-hero__locale">
                <Suspense fallback={null}>
                  <LocaleSwitcherServer />
                </Suspense>
              </div>
              <p className="menu-hero__lede">
                Una mesa simple para café, mate y cocina. Método, origen y ritual, sin exceso.
              </p>
              <p className="menu-hero__fineprint">
                Carta vigente al servicio. Precios definitivos en local.
              </p>
            </div>
          </section>

          <section className="menu-preamble" aria-label="Nota del equipo">
            <span className="menu-preamble__rule" aria-hidden="true" />
            <p className="menu-preamble__eyebrow">La carta · Otoño 2026</p>
            <p className="menu-preamble__body">
              Esta carta cambia con la temporada. Lo que está aquí es lo que nos parece justo servir hoy:
              café preparado con tiempo, panes de masa madre del día, cocina de mercado.
            </p>
            <p className="menu-preamble__sign">— El equipo de Deriva</p>
          </section>

          <Suspense fallback={null}>
            <LiveMenu />
          </Suspense>

          <section className="menu-closing" aria-label="Estamos abiertos">
            <div className="menu-closing__left">
              <div className="menu-eyebrow">
                <span className="menu-diamond" aria-hidden="true" />
                <span>Abiertos · Magnere 1570</span>
              </div>
              <h2 className="menu-closing__headline">
                Ya estamos
                <br />
                <em>en barra.</em>
              </h2>
              <p className="menu-closing__lede">
                Magnere 1570 Local 105, Providencia. Desde las 08:00.
              </p>
            </div>
            <div className="menu-closing__right">
              <p className="menu-closing__fineprint">
                Carta vigente al servicio. Precios definitivos en local.
              </p>
            </div>
          </section>

          <section className="menu-visit" aria-label="Visítanos">
            <p className="menu-visit__label">Visítanos</p>
            <p className="menu-visit__address">
              Magnere 1570 Local 105
              <br />
              <span>Providencia · Santiago</span>
            </p>
            <p className="menu-visit__hours">
              Lun–Vie · 08:00–21:00
              <br />
              Sáb · 10:00–21:00
            </p>
            <a
              className="menu-visit__link"
              href="https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cómo llegar →
            </a>
          </section>
        </div>

        <footer className="menu-outer__footer">
          <span>derivastudio.cl</span>
          <span>@deriva.coffee.studio</span>
          <span className="menu-outer__center">
            <i className="menu-diamond" />
            2026
          </span>
        </footer>
        </div>
      </main>
    </>
  );
}
