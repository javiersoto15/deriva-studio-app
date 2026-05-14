import { derivaAssets } from "../../src/brand";
import { WaitlistForm } from "../../src/components/WaitlistForm";

const siteUrl = "https://derivastudio.cl";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": `${siteUrl}/#cafe`,
  name: "Deriva Coffee Studio",
  alternateName: "Deriva",
  url: siteUrl,
  image: [
    `${siteUrl}/brand/logo-con-isotipo@3x.png`,
    `${siteUrl}/brand/isotipo-verde@3x.png`
  ],
  logo: `${siteUrl}/brand/isotipo-verde@3x.png`,
  parentOrganization: { "@id": `${siteUrl}/#organization` },
  description:
    "Café de especialidad, mate y cocina en Magnere 1570 Local 105, Providencia, Santiago. Apertura piloto el lunes 18 de mayo de 2026.",
  slogan: "Servimos el primer café el 18 de mayo.",
  priceRange: "$$",
  servesCuisine: ["Café de especialidad", "Mate", "Cocina"],
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
  hasMap: "https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago",
  areaServed: {
    "@type": "City",
    name: "Santiago"
  },
  sameAs: ["https://www.instagram.com/deriva.coffee.studio/"],
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Deriva Coffee Studio",
  alternateName: "Deriva",
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/brand/isotipo-verde@3x.png`,
    width: 1080,
    height: 1080,
    contentUrl: `${siteUrl}/brand/isotipo-verde@3x.png`
  },
  image: `${siteUrl}/brand/logo-con-isotipo@3x.png`,
  sameAs: ["https://www.instagram.com/deriva.coffee.studio/"]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "Deriva Coffee Studio",
  inLanguage: "es-CL",
  publisher: { "@id": `${siteUrl}/#organization` }
};

export default function HomePage() {
  return (
    <main className="holding-page" aria-labelledby="holding-title">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd, localBusinessJsonLd, websiteJsonLd])
        }}
      />
      <header className="outer-caption" aria-hidden="true">
        <span>Deriva Coffee Studio</span>
        <span className="outer-caption__center">
          <i className="copper-diamond" />
          Apertura piloto
        </span>
        <span>Providencia · Santiago</span>
      </header>

      <section className="holding-shell" aria-label="Deriva Coffee Studio">
        <span className="shell-hairline" aria-hidden="true" />
        <span className="shell-corner shell-corner--tl" aria-hidden="true" />
        <span className="shell-corner shell-corner--tr" aria-hidden="true" />
        <span className="shell-corner shell-corner--bl" aria-hidden="true" />
        <span className="shell-corner shell-corner--br" aria-hidden="true" />

        <div className="shell-inner">
          <img
            className="brand-lockup"
            src={derivaAssets.logoLockup}
            alt="Deriva Coffee Studio"
            width="132"
            height="132"
          />

          <p className="index-meta">
            <span className="index-meta__label">N°</span>
            <span className="index-meta__value">001 / 2026</span>
            <i className="copper-diamond" aria-hidden="true" />
            <span>Apertura · Lun 18 · Mayo 2026</span>
          </p>

          <span className="copper-rule copper-rule--headline" aria-hidden="true" />

          <h1 id="holding-title" className="headline">
            <span className="headline__line headline__line--top">Servimos el</span>
            <span className="headline__line headline__line--accent">primer café</span>
            <span className="headline__line headline__line--bottom">el 18 de mayo.</span>
          </h1>

          <WaitlistForm />

          <p className="object-lane" aria-label="Café, mate y cocina">
            <span>Café</span>
            <i className="copper-diamond" aria-hidden="true" />
            <span>Mate</span>
            <i className="copper-diamond" aria-hidden="true" />
            <span>Cocina</span>
          </p>

          <span className="copper-rule copper-rule--lane" aria-hidden="true" />

          <p className="promo-notice" aria-label="Suscríbete y tu primera taza va por la casa">
            <span>Suscríbete</span>
            <i className="copper-diamond" aria-hidden="true" />
            <span>Primera taza por la casa</span>
          </p>

          <address className="address-line">
            <span>Magnere 1570 Local 105</span>
            <span className="copper-bar" aria-hidden="true" />
            <span>Providencia, Santiago</span>
            <span className="copper-bar" aria-hidden="true" />
            <span className="address-line__cta">Lunes 18 · 08:00</span>
          </address>
        </div>
      </section>

      <footer className="outer-caption outer-caption--bottom" aria-hidden="true">
        <span>Apertura piloto</span>
        <span className="outer-caption__right">
          <i className="copper-diamond" />
          2026
        </span>
      </footer>
    </main>
  );
}
