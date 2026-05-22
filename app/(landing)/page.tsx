import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { SiteNav } from "../../src/components/landing/SiteNav";
import { CartaScroller, type CartaChip } from "../../src/components/landing/CartaScroller";
import { DerivaImage } from "../../src/components/landing/DerivaImage";
import { isOpenNow } from "../../src/lib/open-now";
import { PHOTO_BASE_URL } from "../../src/data/photos";

const siteUrl = "https://derivastudio.cl";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago";
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": `${siteUrl}/#cafe`,
  name: "Deriva Coffee Studio",
  alternateName: "Deriva",
  url: siteUrl,
  image: [
    `${PHOTO_BASE_URL}/storefront-1920.jpg`,
    `${PHOTO_BASE_URL}/interior-1920.jpg`,
    `${PHOTO_BASE_URL}/bar-1920.jpg`
  ],
  logo: `${siteUrl}/brand/isotipo-verde@3x.png`,
  description:
    "Café de especialidad, mate, panadería de masa madre y cocina de mercado en Magnere 1570 Local 105, Providencia, Santiago.",
  priceRange: "$$",
  servesCuisine: ["Café de especialidad", "Mate", "Panadería", "Cocina"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Magnere 1570, Local 105",
    addressLocality: "Providencia",
    addressRegion: "Región Metropolitana",
    postalCode: "7500000",
    addressCountry: "CL"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -33.42575151317108,
    longitude: -70.61869843019804
  },
  hasMap: MAPS_URL,
  sameAs: [INSTAGRAM_URL],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "21:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "10:00",
      closes: "21:00"
    }
  ]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Deriva Coffee Studio",
  inLanguage: "es-CL"
};

const cartaChips: CartaChip[] = [
  {
    slug: "filtrado",
    section: "Cafetería",
    index: "01",
    name: "Filtrado",
    italic: "del día",
    notes: "Etiopía Yirgacheffe · floral, cítrico, té negro.",
    price: "$4.500",
    href: "/menu#section-cafeteria",
    photo: "filtrado",
  },
  {
    slug: "cappuccino",
    section: "Cafetería",
    index: "02",
    name: "Cappuccino",
    italic: "de la casa",
    notes: "Espresso doble · microfoam cremoso · canela opcional.",
    price: "$3.900",
    href: "/menu#section-cafeteria",
    photo: "cappuccino",
  },
  {
    slug: "tostada-italiana",
    section: "Cocina",
    index: "03",
    name: "Tostada",
    italic: "Italiana",
    notes: "Tomate confit, ricotta, alcaparrones, rúcula sobre masa madre.",
    price: "$6.500",
    href: "/menu#section-tostadas",
    photo: "tostada-italiana",
  },
  {
    slug: "menu-ejecutivo",
    section: "Prix-fixe",
    index: "diario",
    name: "Menú",
    italic: "Ejecutivo",
    notes: "Bebida · Entrada · Fondo · Queque.",
    price: "$10.990",
    href: "/menu#section-menu-ejecutivo",
    accent: "ejecutivo"
  },
  {
    slug: "pour-over",
    section: "Cafetería",
    index: "04",
    name: "Pour",
    italic: "Over",
    notes: "Filtrado lento en Chemex. Origen único, perfil floral.",
    price: "$5.200",
    href: "/menu#section-cafeteria",
    photo: "pour-over",
  },
  {
    slug: "croissant-kasler",
    section: "Cocina",
    index: "05",
    name: "Croissant",
    italic: "Kasler House",
    notes: "Croissant 72h + pavo Kasler, cebolla encurtida, rúcula.",
    price: "$7.500",
    href: "/menu#section-croissants",
    photo: "croissant-kasler",
  }
];

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
          Una casa abierta en Magnere. Café de especialidad, mate, panadería de masa madre y
          cocina de mercado.
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
            Espresso ICON, molienda Mahlkönig, agua filtrada. Cada extracción es una decisión:
            tiempo, presión, paciencia.
          </p>
          <ul className="landing-panel__list">
            <li>Espresso · La Marzocco ICON</li>
            <li>Filtrado · V60 · Chemex</li>
            <li>Origen · rotando con la temporada</li>
          </ul>
        </div>
      </div>
      <div className="landing-panel__photo">
        <DerivaImage
          slug="bar"
          alt="Barra de Deriva: máquina de espresso ICON, molinos, pastelería"
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
            <li>Lun–Sáb · desde las 08:00</li>
          </ul>
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
          <span>§ V · Visita · Magnere 1570</span>
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

function Footer() {
  return (
    <footer className="landing-footer">
      <span className="landing-footer__brand">
        <span className="landing-diamond" aria-hidden="true" />
        Deriva Coffee Studio
      </span>
      <span>Edición continuada · MMXXVI</span>
      <span>derivastudio.cl</span>
    </footer>
  );
}

async function OpenNowStatus() {
  await connection();
  return <VisitaSection openNow={isOpenNow()} />;
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([localBusinessJsonLd, websiteJsonLd])
        }}
      />
      <SiteNav active="inicio" />
      <main className="landing">
        <Hero />
        <BarPanel />
        <CasaPanel />
        <CartaScroller chips={cartaChips} />
        <Suspense fallback={<VisitaSection openNow={false} />}>
          <OpenNowStatus />
        </Suspense>
        <Footer />
      </main>
    </>
  );
}
