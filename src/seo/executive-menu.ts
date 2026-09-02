import type { ExecutiveMenu } from "../api/server";
import { SITE_NAME, SITE_URL } from "./local-business";
import {
  resolveExecutiveService,
  type ExecutiveService
} from "./executive-service";

export const EXECUTIVE_MENU_URL = `${SITE_URL}/menu-ejecutivo`;
export const EXECUTIVE_MENU_STABLE_HOURS = "Lunes a viernes · 13:00–16:00";

// Honest no-edition state. Never names a dish, a price, or an availability
// claim — the published API response is the only source for those.
export const EXECUTIVE_MENU_FALLBACK_TITLE = "Menú Ejecutivo de lunes a viernes";
export const EXECUTIVE_MENU_FALLBACK_BODY =
  "Preparamos una edición distinta cada jornada de servicio, disponible de 13:00 a 16:00. Si la edición de hoy todavía no está publicada o el servicio ya terminó, puedes revisar nuestra carta completa.";
export const EXECUTIVE_MENU_CARTA_CTA = "Ver la carta completa";
export const EXECUTIVE_MENU_DIRECTIONS_CTA = "Cómo llegar";

// Illustrative only. These are NOT today's edition and must never be rendered
// as one — the UI labels them explicitly and the JSON-LD ignores them entirely.
// They exist so the page explains the shape of the program to a first-time
// visitor (and to a crawler) even on a day with no published edition.
export const EXECUTIVE_MENU_SHAPE = [
  {
    id: "bebida",
    numeral: "i",
    tag: "Una bebida",
    example: "Café de la barra, té o limonada."
  },
  {
    id: "entrada",
    numeral: "ii",
    tag: "Una entrada",
    example: "Una crema de verduras o de zapallo."
  },
  {
    id: "fondo",
    numeral: "iii",
    tag: "Un fondo, con alternativa",
    example:
      "Pollo al curry con arroz al cilantro, lomo saltado con arroz y papas fritas, o ñoquis al pesto con zapallo — siempre con una segunda opción, habitualmente una ensalada proteica."
  },
  {
    id: "postre",
    numeral: "iv",
    tag: "Un postre",
    example: "Queque de la casa o el postre del día."
  }
] as const;

// "Disponible ahora" is a claim about the OFFER, not about the clock. The
// service window being open is necessary but not sufficient: with no published
// edition there is nothing to be available, so the badge must not say there is.
// resolveExecutiveService stays clock-pure; this is the edition-aware layer.
function statusForEdition(
  service: ExecutiveService,
  hasEdition: boolean
): ExecutiveService {
  if (hasEdition || service.status !== "now") return service;
  return {
    ...service,
    servingNow: false,
    badge: "Sin edición publicada",
    note: "Servimos de 13:00 a 16:00, pero la edición de hoy todavía no está publicada."
  };
}

export type ExecutiveMenuPresentation = ReturnType<
  typeof buildExecutiveMenuPresentation
>;

export function buildExecutiveMenuPresentation(
  menu: ExecutiveMenu | null,
  now: Date = new Date()
) {
  const service: ExecutiveService = statusForEdition(
    resolveExecutiveService(now),
    menu !== null
  );

  return menu
    ? {
        availableToday: true,
        service,
        dateLabel: menu.date_label,
        priceLabel: menu.price_label,
        priceClp: menu.price_clp,
        hours: menu.hours,
        hero: menu.hero,
        subline: menu.subline,
        courses: menu.courses
      }
    : {
        availableToday: false,
        service,
        dateLabel: undefined,
        priceLabel: undefined,
        priceClp: undefined,
        hours: EXECUTIVE_MENU_STABLE_HOURS,
        hero: EXECUTIVE_MENU_FALLBACK_TITLE,
        subline: EXECUTIVE_MENU_FALLBACK_BODY,
        courses: []
      };
}

export function buildExecutiveMenuGraph(menu: ExecutiveMenu | null) {
  const menuId = `${EXECUTIVE_MENU_URL}#menu`;
  const offerId = `${EXECUTIVE_MENU_URL}#offer`;
  const courseNodes: Record<string, unknown>[] =
    menu?.courses.map((course) => ({
      "@type": "MenuItem",
      "@id": `${EXECUTIVE_MENU_URL}#course-${course.id}`,
      name: course.name
    })) ?? [];

  const menuNode: Record<string, unknown> = {
    "@type": "Menu",
    "@id": menuId,
    name: "Menú Ejecutivo",
    inLanguage: "es-CL",
    url: EXECUTIVE_MENU_URL,
    provider: { "@id": `${SITE_URL}/#cafe` }
  };

  if (menu) {
    menuNode.offers = { "@id": offerId };
    menuNode.hasMenuItem = courseNodes.map((course) => ({
      "@id": course["@id"]
    }));
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${EXECUTIVE_MENU_URL}#webpage`,
      url: EXECUTIVE_MENU_URL,
      name: `Menú Ejecutivo en Providencia · ${SITE_NAME}`,
      inLanguage: "es-CL",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#cafe` },
      mainEntity: { "@id": menuId }
    },
    menuNode
  ];

  // The Offer node is the "there is something on sale here" claim. It is added
  // ONLY when the backend published an edition — never on the fallback, and
  // never from EXECUTIVE_MENU_SHAPE.
  if (menu) {
    graph.push(
      {
        "@type": "Offer",
        "@id": offerId,
        price: menu.price_clp,
        priceCurrency: "CLP",
        itemOffered: { "@id": menuId }
      },
      ...courseNodes
    );
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
