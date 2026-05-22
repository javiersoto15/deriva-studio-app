import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { menuSections, PRICING_OPEN_AT } from "../../../src/data/menu";
import { getTemporarilyUnavailableItemIds } from "../../../src/data/apertura-windows";
import { getCurrentSchedule, isClosedToday, matchesSchedule, type Schedule } from "../../../src/data/menu-schedule";
import { getMenuEjecutivoDateLabel } from "../../../src/data/menu-ejecutivo";
import { MenuChipNav } from "../../../src/components/menu/MenuChipNav";
import { MenuSection } from "../../../src/components/menu/MenuSection";
import { SiteNav } from "../../../src/components/landing/SiteNav";

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

const menuJsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  "@id": `${pageUrl}#menu`,
  name: "Carta Deriva Coffee Studio · Otoño 2026",
  inLanguage: "es-CL",
  url: pageUrl,
  provider: { "@id": `${siteUrl}/#cafe` },
  hasMenuSection: menuSections.map((section) => ({
    "@type": "MenuSection",
    name: section.title.replace(".", ""),
    description: section.lede,
    hasMenuItem: (section.items ?? section.subgroups?.flatMap((g) => g.items) ?? []).map((item) => ({
      "@type": "MenuItem",
      name: item.name,
      description: item.description
    }))
  }))
};

function MenuSectionsList({
  showPrices,
  temporarilyUnavailableIds,
  currentSchedule,
  closedToday = false,
  menuEjecutivoDateLabel
}: {
  showPrices: boolean;
  temporarilyUnavailableIds: ReadonlySet<string>;
  currentSchedule?: Schedule;
  closedToday?: boolean;
  menuEjecutivoDateLabel?: string;
}) {
  const visibleSections = currentSchedule
    ? menuSections.filter((s) => matchesSchedule(currentSchedule, s.schedule))
    : menuSections;
  return (
    <>
      {closedToday ? (
        <aside className="menu-closed-today" aria-label="Aviso de cierre">
          <span className="menu-closed-today__rule" aria-hidden="true" />
          <span className="menu-closed-today__label">CERRADO HOY · ABRIMOS MAÑANA</span>
        </aside>
      ) : null}
      {visibleSections.map((section) => (
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
          <MenuSection
            section={section}
            showPrices={showPrices}
            temporarilyUnavailableIds={temporarilyUnavailableIds}
            currentSchedule={currentSchedule}
            menuEjecutivoDateLabel={menuEjecutivoDateLabel}
          />
        </div>
      ))}
    </>
  );
}

// Resolves the real price-reveal flag at request time. Wrapped in <Suspense>
// at the call-site so the surrounding shell can prerender; the fallback
// renders the same list with prices hidden, which matches pre-cutoff behavior.
async function PricedMenuSections() {
  await connection();
  // Local override — set DERIVA_SHOW_PRICES=1 in .env.local to preview prices
  // before the apertura cutoff. In production this env var stays unset.
  const forceShow = process.env.DERIVA_SHOW_PRICES === "1";
  const showPrices = forceShow || Date.now() >= PRICING_OPEN_AT.getTime();
  const now = new Date();
  const temporarilyUnavailableIds = getTemporarilyUnavailableItemIds(now);
  const currentSchedule = getCurrentSchedule(now);
  const closedToday = isClosedToday(now);
  const menuEjecutivoDateLabel = getMenuEjecutivoDateLabel(now);
  return (
    <MenuSectionsList
      showPrices={showPrices}
      temporarilyUnavailableIds={temporarilyUnavailableIds}
      currentSchedule={currentSchedule}
      closedToday={closedToday}
      menuEjecutivoDateLabel={menuEjecutivoDateLabel}
    />
  );
}

export default function MenuPage() {
  return (
    <>
      <SiteNav active="carta" variant="solid" />
      <main className="menu-page menu-page--with-nav" aria-labelledby="menu-title">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
        />

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

          <MenuChipNav sections={menuSections} />

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
              <Suspense
                fallback={
                  <MenuSectionsList
                    showPrices={false}
                    temporarilyUnavailableIds={new Set()}
                  />
                }
              >
                <PricedMenuSections />
              </Suspense>
            </div>
          </div>

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
