// Thin accessors over the (now complete) generated public-menu types. The
// backend serves image_url / banner_image_url / offers / signature, and
// src/api/schema.ts carries them all after `npm run api:types`, so there are no
// local type extensions anymore — MenuItemX/MenuSectionX are just aliases kept
// so the component imports don't churn.

import type { PublicMenuItem, PublicMenuSection } from "../../../../src/api/server";

export type MenuItemX = PublicMenuItem;

// TODO(backend): `banner_image_url` was added to PublicMenuSectionTemplate /
// PublicMenuSectionPatch but NOT to the public `PublicMenuSection` response
// schema, even though the deployed service returns it. Add it there, regen
// types, then drop this one-field extension.
export type MenuSectionX = PublicMenuSection & { banner_image_url?: string };

// An item's photo (backend `image_url`), if any.
export function itemPhoto(item: PublicMenuItem): string | undefined {
  return item.image_url;
}

// Items with a photo get the highlighted photo-card treatment.
export function isHighlighted(item: PublicMenuItem): boolean {
  return Boolean(item.image_url);
}

export function sectionBanner(section: MenuSectionX): string | undefined {
  return section.banner_image_url;
}

// TEMPORARY: the backend returns TRUNCATED titles for these sections (data bug,
// flagged for backend fix — §01/§09/§10 come back as "Café para" / "Pastelería
// y" / "Cervezas y"). Complete them so the preview doesn't read as broken.
// Remove once the source titles are fixed.
const TITLE_FIX: Record<string, string> = {
  "cafe-para-llevar": "Café para llevar",
  pasteleria: "Pastelería y dulces",
  "cervezas-cocteles": "Cervezas y coctelería"
};

export function displayTitle(section: { id: string; title: string }): string {
  return TITLE_FIX[section.id] ?? section.title;
}
