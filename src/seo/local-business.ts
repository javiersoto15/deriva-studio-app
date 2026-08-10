import { PHOTO_BASE_URL } from "../data/photos";

export const SITE_URL = "https://derivastudio.cl";
export const SITE_NAME = "Deriva Coffee Studio";
export const MENU_URL = `${SITE_URL}/menu`;
export const INSTAGRAM_URL =
  "https://www.instagram.com/deriva.coffee.studio/";
export const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Magnere+1570+Providencia+Santiago";
export const LOCAL_SEO_DESCRIPTION =
  "Deriva Coffee Studio es un café de especialidad en Providencia, Santiago, con desayunos, brunch, almuerzos y Menú Ejecutivo de lunes a viernes, además de espresso, filtrados y cafés de autor.";
export const LOCAL_SEARCH_INTENTS = [
  "café de especialidad en Providencia",
  "cafetería en Providencia",
  "brunch en Providencia",
  "desayuno en Providencia",
  "almuerzo en Providencia",
  "Menú Ejecutivo en Providencia",
  "Menú Ejecutivo de lunes a viernes"
] as const;

export function buildLocalBusinessGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: "Deriva",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brand/isotipo-verde@3x.png`,
          contentUrl: `${SITE_URL}/brand/isotipo-verde@3x.png`,
          width: 1080,
          height: 1080
        },
        sameAs: [INSTAGRAM_URL]
      },
      {
        "@type": "CafeOrCoffeeShop",
        "@id": `${SITE_URL}/#cafe`,
        name: SITE_NAME,
        alternateName: "Deriva",
        url: SITE_URL,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        image: [
          `${PHOTO_BASE_URL}/storefront-1920.jpg`,
          `${PHOTO_BASE_URL}/interior-1920.jpg`,
          `${PHOTO_BASE_URL}/bar-1920.jpg`
        ],
        description: LOCAL_SEO_DESCRIPTION,
        telephone: "+56984520118",
        email: "contacto@derivastudio.cl",
        priceRange: "$$",
        currenciesAccepted: "CLP",
        paymentAccepted: "Efectivo, Débito, Crédito",
        acceptsReservations: false,
        keywords: LOCAL_SEARCH_INTENTS,
        servesCuisine: [
          "Café de especialidad",
          "Desayunos",
          "Brunch",
          "Almuerzos",
          "Menú Ejecutivo",
          "Cocina",
          "Pastelería"
        ],
        hasMenu: MENU_URL,
        areaServed: [
          { "@type": "AdministrativeArea", name: "Providencia" },
          { "@type": "City", name: "Santiago" }
        ],
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
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday"
            ],
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
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "es-CL",
        publisher: { "@id": `${SITE_URL}/#organization` }
      }
    ]
  } as const;
}
