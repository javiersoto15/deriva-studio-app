import type { PublicMenuItem, PublicMenuView } from "../api/server";
import { MENU_URL, SITE_URL } from "./local-business";

function menuItemNode(
  item: PublicMenuItem,
  showPrices: boolean
): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "MenuItem",
    "@id": `${MENU_URL}#item-${item.id}`,
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

export function buildMenuGraph(menu: PublicMenuView, showPrices: boolean) {
  const menuId = `${MENU_URL}#menu`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${MENU_URL}#webpage`,
        url: MENU_URL,
        name: "Carta de café de especialidad en Providencia",
        inLanguage: menu.locale ?? "es-CL",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#cafe` },
        mainEntity: { "@id": menuId }
      },
      {
        "@type": "Menu",
        "@id": menuId,
        name: `${menu.name} · ${menu.season}`,
        inLanguage: menu.locale ?? "es-CL",
        url: MENU_URL,
        provider: { "@id": `${SITE_URL}/#cafe` },
        hasMenuSection: menu.sections.map((section) => ({
          "@type": "MenuSection",
          "@id": `${MENU_URL}#section-${section.id}`,
          name: section.title.replace(/\.$/, ""),
          description: section.lede,
          hasMenuItem: [
            ...(section.items ?? []),
            ...(section.subgroups?.flatMap((group) => group.items) ?? [])
          ].map((item) => menuItemNode(item, showPrices))
        }))
      }
    ]
  };
}
