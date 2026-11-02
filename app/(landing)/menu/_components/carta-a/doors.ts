import type { PublicMenuItem, PublicMenuOffer, PublicMenuSection, PublicMenuView } from "../../../../../src/api/server";

// The carta opens on four "doors" (Café · Comida · Dulce · Bar); each door
// holds one or more backend sections. Everything inside a door — membership,
// door name and blurb, sections, subgroups, items, offers, order — is rendered
// exactly as the backend sends it (`section.group`, live since 2026-10-31).
//
// One guard stays: a section that arrives without a group, or with a group id
// this carta has no door for, joins the door of the section before it, so a
// backend mistake still renders somewhere instead of disappearing.

export type DoorId = "cafe" | "comida" | "dulce" | "bar";
export const DOOR_ORDER: DoorId[] = ["cafe", "comida", "dulce", "bar"];

// The authored-coffee subgroup renders as the photo grid. The backend sends it
// first in Cafetería; this id only picks the grid treatment, never the order.
export const AUTHOR_SUBGROUP_ID = "cafes-autor";

type Subgroup = NonNullable<PublicMenuSection["subgroups"]>[number];

export type Stop = {
  key: string;
  label: string;
  sectionId: string;
  subgroupId?: string;
};

export type Door = {
  id: DoorId;
  /** Localized door name from the backend (`section.group.label`). */
  label: string;
  /** Localized one-line blurb from the backend (`section.group.description`). */
  description: string;
  sections: PublicMenuSection[];
  stops: Stop[];
  itemCount: number;
  photo?: string;
  offers: PublicMenuOffer[];
};

export function isDoorId(value: unknown): value is DoorId {
  return typeof value === "string" && (DOOR_ORDER as string[]).includes(value);
}

// New autor coffees can arrive before their author is set, so the subgroup is
// recognised by its id or by any authored item — never by "every item".
export function isAuthorSubgroup(subgroup: Subgroup): boolean {
  return (
    subgroup.id === AUTHOR_SUBGROUP_ID ||
    subgroup.items.some((item) => Boolean(item.author?.trim()))
  );
}

export function sectionLabel(section: PublicMenuSection): string {
  return section.title.replace(/[.·\s]+$/, "");
}

export function stopAnchor(stop: Pick<Stop, "key">): string {
  return `stop-${stop.key}`;
}

function stopsFor(sections: PublicMenuSection[]): Stop[] {
  const only = sections.length === 1 ? sections[0] : undefined;
  if (only && (only.subgroups?.length ?? 0) >= 2) {
    const stops: Stop[] = [];
    if (only.items?.length) stops.push({ key: only.id, label: sectionLabel(only), sectionId: only.id });
    for (const sg of only.subgroups ?? []) {
      stops.push({ key: `${only.id}--${sg.id}`, label: sg.label, sectionId: only.id, subgroupId: sg.id });
    }
    return stops;
  }
  return sections.map((section) => ({ key: section.id, label: sectionLabel(section), sectionId: section.id }));
}

// Every item a stop holds, in backend order: a subgroup stop is that subgroup;
// a section stop is the section's own items then each of its subgroups'.
export function stopItems(door: Door, stop: Stop): PublicMenuItem[] {
  const section = door.sections.find((s) => s.id === stop.sectionId);
  if (!section) return [];
  if (stop.subgroupId) return section.subgroups?.find((sg) => sg.id === stop.subgroupId)?.items ?? [];
  const own = section.items ?? [];
  // A section stop that sits beside its own subgroup stops holds only its own items.
  if (door.stops.some((s) => s.sectionId === section.id && s.subgroupId)) return own;
  return [...own, ...(section.subgroups ?? []).flatMap((sg) => sg.items)];
}

function countItems(sections: PublicMenuSection[]): number {
  return sections.reduce(
    (sum, s) => sum + (s.items?.length ?? 0) + (s.subgroups ?? []).reduce((n, sg) => n + sg.items.length, 0),
    0
  );
}

function firstPhoto(sections: PublicMenuSection[]): string | undefined {
  for (const s of sections) {
    for (const item of [...(s.items ?? []), ...(s.subgroups ?? []).flatMap((sg) => sg.items)]) {
      if (item.image_url) return item.image_url;
    }
  }
  return sections.find((s) => s.banner_image_url)?.banner_image_url;
}

export function buildDoors(menu: Pick<PublicMenuView, "sections">): Door[] {
  const grouped = new Map<DoorId, PublicMenuSection[]>(DOOR_ORDER.map((id) => [id, []]));
  let previous: DoorId = "comida";
  for (const section of menu.sections) {
    const groupId = section.group?.id;
    const door: DoorId = isDoorId(groupId) ? groupId : previous;
    previous = door;
    grouped.get(door)!.push(section);
  }
  return DOOR_ORDER.map((id) => {
    const sections = grouped.get(id)!;
    const group = sections.find((s) => s.group?.id === id)?.group;
    return {
      id,
      label: group?.label ?? "",
      description: group?.description ?? "",
      sections,
      stops: stopsFor(sections),
      itemCount: countItems(sections),
      photo: firstPhoto(sections),
      offers: sections.flatMap((s) => s.offers ?? [])
    };
  }).filter((door) => door.sections.length > 0);
}

// Which view `?puerta=` asks for. Shared by the server page (first render) and
// the client carta (back/forward), so both read the URL the same way.
export type CartaView = { kind: "entrance" } | { kind: "door"; id: DoorId } | { kind: "combos" };

export function parseView(puerta: string | undefined | null): CartaView {
  if (puerta === "combos") return { kind: "combos" };
  if (isDoorId(puerta)) return { kind: "door", id: puerta };
  return { kind: "entrance" };
}

// Offers sharing a backend `offer.group` (Happy Hour Cervezas + Tragos) present
// as ONE card and ONE sheet with a switch labelled by each offer's `tab_label`.
// An offer without a group is a group of one under its own title.
export type OfferGroup = {
  key: string;
  title: string;
  offers: PublicMenuOffer[];
  /** Switch label per offer (`tab_label`, else the offer's title). */
  labels: string[];
};

export function groupOffers(offers: PublicMenuOffer[]): OfferGroup[] {
  const groups: OfferGroup[] = [];
  const byId = new Map<string, OfferGroup>();
  for (const offer of offers) {
    const gid = offer.group?.id;
    const existing = gid ? byId.get(gid) : undefined;
    if (existing) {
      existing.offers.push(offer);
      existing.labels.push(offer.tab_label ?? offer.title);
      continue;
    }
    const group: OfferGroup = {
      key: gid ?? offer.id,
      title: offer.group?.title ?? offer.title,
      offers: [offer],
      labels: [offer.tab_label ?? offer.title]
    };
    if (gid) byId.set(gid, group);
    groups.push(group);
  }
  // A group of one has no switch, so its sheet shows the offer's own title.
  for (const g of groups) {
    if (g.offers.length === 1) {
      g.title = g.offers[0].title;
      g.labels = [g.offers[0].title];
    }
  }
  return groups;
}

export function groupFloor(group: OfferGroup): number | undefined {
  const floors = group.offers.map(offerFloor).filter((n): n is number => typeof n === "number");
  return floors.length ? Math.min(...floors) : undefined;
}

// Lowest backend price an offer can be had for, for the price on its card.
// Never computed: it is one of the backend's own numbers — the offer's own
// `price_clp`, a variant price, or a fixed pair price.
export function offerFloor(offer: PublicMenuOffer): number | undefined {
  const prices = [
    offer.price_clp,
    ...(offer.variants ?? []).map((v) => v.price_clp),
    ...(offer.detail?.items ?? []).map((row) =>
      row.pricing?.kind === "fixed" ? row.pricing.amount_clp : undefined
    )
  ].filter((n): n is number => typeof n === "number");
  return prices.length ? Math.min(...prices) : undefined;
}
