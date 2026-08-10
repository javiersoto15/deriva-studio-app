import type { ExecutiveMenu } from "../api/server";
import { SITE_URL } from "./local-business";

export const EXECUTIVE_MENU_URL = `${SITE_URL}/menu-ejecutivo`;
export const EXECUTIVE_MENU_STABLE_HOURS =
  "Lunes a viernes · 13:00–16:00";

export function buildExecutiveMenuPresentation(menu: ExecutiveMenu | null) {
  return menu
    ? {
        availableToday: true,
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
        dateLabel: undefined,
        priceLabel: undefined,
        priceClp: undefined,
        hours: EXECUTIVE_MENU_STABLE_HOURS,
        hero: "Menú Ejecutivo en Providencia",
        subline: "La edición del día se publica cada jornada de servicio.",
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
      name: "Menú Ejecutivo en Providencia",
      inLanguage: "es-CL",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#cafe` },
      mainEntity: { "@id": menuId }
    },
    menuNode
  ];

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
