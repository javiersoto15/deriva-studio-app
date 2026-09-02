import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { SiteNav } from "../../src/components/landing/SiteNav";
import { CartaScroller } from "../../src/components/landing/CartaScroller";
import { DerivaImage } from "../../src/components/landing/DerivaImage";
import { AppTeaser } from "../../src/components/landing/AppTeaser";
import { getPublicMenuView } from "../../src/api/server";
import { isOpenNow } from "../../src/lib/open-now";
import { selectLandingCoffeeHighlights } from "../../src/seo/landing-coffee-highlights";
import { EXECUTIVE_MENU_STABLE_HOURS } from "../../src/seo/executive-menu";
import {
  BUSINESS_DESCRIPTOR,
  INSTAGRAM_URL,
  MAPS_URL,
  SITE_NAME,
  buildLocalBusinessGraph
} from "../../src/seo/local-business";

function Hero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <DerivaImage
        slug="storefront"
        alt="Fachada de Deriva Coffee Studio en Magnere 1570, Providencia"
        sizes="100vw"
        priority
        fill
        className="landing-hero__photo"
      />
      <div className="landing-hero__scrim" aria-hidden="true" />
      <div className="landing-hero__content">
        <div className="landing-hero__eyebrow">
          <span className="landing-diamond" aria-hidden="true" />
          <span>Magnere 1570 · Providencia · Santiago</span>
        </div>
        <h1 id="hero-title" className="landing-hero__headline">
          Café, mate
          <br />
          y cocina. <em>Sin atajos.</em>
        </h1>
        <p className="landing-hero__lede">
          Una cafetería de especialidad en Providencia, Santiago, con desayunos, brunch,
          almuerzos y Menú Ejecutivo de lunes a viernes, además de espresso, filtrados y cafés
          de autor.
        </p>
        <div className="landing-hero__ctas">
          <a
            className="landing-cta landing-cta--primary"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar →
          </a>
          <Link className="landing-cta landing-cta--ghost" href="/menu">
            Ver la carta
          </Link>
        </div>
      </div>
      <div className="landing-hero__cue" aria-hidden="true">
        <span>Sigue bajando</span>
        <span className="landing-hero__cue-rule" />
      </div>
    </section>
  );
}

function BarPanel() {
  return (
    <section className="landing-panel landing-panel--bar" aria-labelledby="bar-title">
      <div className="landing-panel__text">
        <div className="landing-panel__text-inner">
          <div className="landing-slug landing-slug--on-dark">
            <span className="landing-slug__rule" aria-hidden="true" />
            <span>§ II · El bar</span>
          </div>
          <h2 id="bar-title" className="landing-display landing-display--on-dark">
            El método
            <br />
            <em>no se apura.</em>
          </h2>
          <p className="landing-panel__body">
            Espresso Dalla Corte, molienda Mahlkönig, agua filtrada. Cada extracción es una decisión:
            tiempo, presión, paciencia.
          </p>
          <ul className="landing-panel__list">
            <li>Espresso · Dalla Corte</li>
            <li>Filtrado · V60 · Chemex</li>
            <li>Origen · rotando con la temporada</li>
          </ul>
        </div>
      </div>
      <div className="landing-panel__photo">
        <DerivaImage
          slug="bar"
          alt="Barra de Deriva: máquina de espresso Dalla Corte, molinos, pastelería"
          sizes="(max-width: 900px) 100vw, 60vw"
          fill
          className="landing-panel__img"
        />
        <span className="landing-panel__caption">
          <span style={{ width: 5, height: 5, background: "#c9a57a", transform: "rotate(45deg)", display: "block" }} />
          Fig. 01 · El bar
        </span>
      </div>
    </section>
  );
}

function CasaPanel() {
  return (
    <section
      className="landing-panel landing-panel--casa"
      aria-labelledby="casa-title"
    >
      <div className="landing-panel__photo">
        <DerivaImage
          slug="interior"
          alt="Interior de Deriva: techos industriales, pendientes de fierro, mesas comunales"
          sizes="(max-width: 900px) 100vw, 60vw"
          fill
          className="landing-panel__img"
        />
        <span className="landing-panel__caption landing-panel__caption--left">
          <span style={{ width: 5, height: 5, background: "#c9a57a", transform: "rotate(45deg)", display: "block" }} />
          Fig. 02 · La casa
        </span>
      </div>
      <div className="landing-panel__text">
        <div className="landing-panel__text-inner">
          <div className="landing-slug landing-slug--on-dark">
            <span className="landing-slug__rule" aria-hidden="true" />
            <span>§ III · La casa</span>
          </div>
          <h2 id="casa-title" className="landing-display landing-display--on-dark">
            Una mesa
            <br />
            <em>y tu tiempo.</em>
          </h2>
          <p className="landing-panel__body">
            Mesas amplias, pared de hormigón con el isotipo, pendientes de fierro. Para quedarse —
            o para una pausa en barra.
          </p>
          <ul className="landing-panel__list">
            <li>Capacidad · 32 puestos</li>
            <li>Lun–Vie · desde las 08:00</li>
            <li>Sáb · desde las 10:00</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function MiddaySection() {
  return (
    <section className="landing-midday" aria-labelledby="midday-title">
      <div className="landing-midday__inner">
        <div className="landing-midday__head">
          <div className="landing-slug landing-slug--on-dark">
            <span className="landing-slug__rule" aria-hidden="true" />
            <span>§ V · El mediodía</span>
          </div>
          <h2 id="midday-title" className="landing-display landing-display--on-dark">
            La pausa
            <br />
            <em>también se cocina.</em>
          </h2>
        </div>
        <div className="landing-midday__copy">
          <span className="landing-midday__hours">{EXECUTIVE_MENU_STABLE_HOURS}</span>
          <p className="landing-midday__body">
            Entre semana, el mediodía tiene su propia edición: una propuesta de cocina pensada
            para sentarse, hacer una pausa y volver al día. Publicamos la selección vigente en su
            página antes de cada servicio.
          </p>
          <Link className="landing-midday__link" href="/menu-ejecutivo">
            Ver el Menú Ejecutivo vigente →
          </Link>
        </div>
      </div>
    </section>
  );
}

function VisitaSection({ openNow }: { openNow: boolean }) {
  return (
    <section id="visita" className="landing-visita" aria-labelledby="visita-title">
      <div className="landing-visita__head">
        <div className="landing-slug">
          <span className="landing-slug__rule" aria-hidden="true" />
          <span>§ VI · Visita · Magnere 1570</span>
        </div>
        <h2 id="visita-title" className="landing-display landing-display--xl">
          Pasa
          <br />
          cuando <em>quieras.</em>
        </h2>
      </div>
      <div className="landing-visita__grid">
        <div className="landing-visita__block">
          <span className="landing-visita__label">Dirección</span>
          <p className="landing-visita__address">
            Magnere 1570 · Local 105
            <br />
            <em>Providencia, Santiago</em>
          </p>
          <a
            className="landing-visita__link"
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar →
          </a>
        </div>
        <div className="landing-visita__block">
          <span className="landing-visita__label">Horario</span>
          <dl className="landing-visita__hours">
            <div>
              <dt>Lun–Vie</dt>
              <dd>08:00 — 21:00</dd>
            </div>
            <div>
              <dt>Sábado</dt>
              <dd>10:00 — 21:00</dd>
            </div>
            <div className="is-muted">
              <dt>Domingo</dt>
              <dd>
                <em>Cerrado</em>
              </dd>
            </div>
          </dl>
          <span
            className={`landing-visita__status ${openNow ? "is-open" : "is-closed"}`}
            aria-live="polite"
          >
            <span className="landing-visita__status-dot" aria-hidden="true" />
            {openNow ? "Abierto ahora" : "Cerrado ahora"}
          </span>
        </div>
        <div className="landing-visita__block">
          <span className="landing-visita__label">Síguenos</span>
          <a
            className="landing-visita__handle"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            @deriva.coffee.studio
          </a>
          <p className="landing-visita__body">
            Carta, eventos y cierres del día en historias. Sin reserva — pasa cuando quieras.
          </p>
          <a
            className="landing-cta landing-cta--dark"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Síguenos en Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}

function AppTeaserSection() {
  return (
    <section className="app-teaser" aria-labelledby="app-teaser-title">
      <AppTeaser headingId="app-teaser-title" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <span className="landing-footer__brand">
        <span className="landing-diamond" aria-hidden="true" />
        {SITE_NAME}
      </span>
      <span>{BUSINESS_DESCRIPTOR}</span>
      <span>Edición continuada · MMXXVI</span>
      <span>derivastudio.cl</span>
    </footer>
  );
}

async function OpenNowStatus() {
  await connection();
  return <VisitaSection openNow={isOpenNow()} />;
}

async function CartaHighlights() {
  const menu = await getPublicMenuView({ locale: "es-CL" });
  if (!menu) {
    return <CartaScroller chips={[]} seasonLabel="Carta vigente" />;
  }

  return (
    <CartaScroller
      chips={selectLandingCoffeeHighlights(menu)}
      seasonLabel={menu.season || "Carta vigente"}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildLocalBusinessGraph())
        }}
      />
      <SiteNav active="inicio" />
      <main className="landing">
        <Hero />
        <BarPanel />
        <CasaPanel />
        <Suspense
          fallback={<CartaScroller chips={[]} seasonLabel="Carta vigente" />}
        >
          <CartaHighlights />
        </Suspense>
        <MiddaySection />
        <Suspense fallback={<VisitaSection openNow={false} />}>
          <OpenNowStatus />
        </Suspense>
        <AppTeaserSection />
        <Footer />
      </main>
    </>
  );
}
