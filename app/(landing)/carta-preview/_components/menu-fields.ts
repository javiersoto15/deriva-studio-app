// Thin accessors over the generated public-menu types. The backend now serves
// (and the generated schema carries) everything: item.image_url / signature,
// section.banner_image_url / offers. No local type extensions remain.

import type { PublicMenuItem, PublicMenuSection } from "../../../../src/api/server";

export type MenuItemX = PublicMenuItem;
export type MenuSectionX = PublicMenuSection;

// An item's photo (backend `image_url`), if any.
export function itemPhoto(item: PublicMenuItem): string | undefined {
  return item.image_url;
}

// Items with a photo get the highlighted photo-card treatment.
export function isHighlighted(item: PublicMenuItem): boolean {
  return Boolean(item.image_url);
}

export function sectionBanner(section: PublicMenuSection): string | undefined {
  return section.banner_image_url;
}
