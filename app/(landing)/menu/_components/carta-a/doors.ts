import type { PublicMenuOffer, PublicMenuSection, PublicMenuView } from "../../../../../src/api/server";

// The carta opens on four "doors" (Café · Comida · Dulce · Bar); each door
// holds one or more backend sections. Everything inside a door — sections,
// subgroups, items, offers, order — is rendered exactly as the backend sends it.
//
// The door a section belongs to is NOT in the payload yet. Until the backend
// ships `section.group` (requested in the menu-service-hours prompt), the
// mapping lives in DOOR_BY_SECTION below. A section the map doesn't know joins
// the door of the section before it, so a new backend section still renders
// somewhere sensible instead of disappearing.

export type DoorId = "cafe" | "comida" | "dulce" | "bar";
export const DOOR_ORDER: DoorId[] = ["cafe", "comida", "dulce", "bar"];

const DOOR_BY_SECTION: Array<[RegExp, DoorId]> = [
  [/^cafeteria$/, "cafe"],
  [/^(desayunos|tostadas|croissants|bagels|focaccias|cocina|onces|fondos|brunch|almuerzo|menu-ejecutivo)/, "comida"],
  [/^pasteleria/, "dulce"],
  [/^(cervezas|cocteles|bar)/, "bar"]
];

// The authored-coffee subgroup leads the Café door: it is the first thing a
// guest sees after tapping Café (founder call, 2026-10-31).
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
  sections: PublicMenuSection[];
  stops: Stop[];
  itemCount: number;
  photo?: string;
  offers: PublicMenuOffer[];
};

function knownDoor(sectionId: string): DoorId | undefined {
  return DOOR_BY_SECTION.find(([pattern]) => pattern.test(sectionId))?.[1];
}

// New autor coffees can arrive before their author is set, so the subgroup is
// recognised by its id or by any authored item — never by "every item".
export function isAuthorSubgroup(subgroup: Subgroup): boolean {
  return (
    subgroup.id === AUTHOR_SUBGROUP_ID ||
    subgroup.items.some((item) => Boolean(item.author?.trim()))
  );
}

function leadWithAuthors(section: PublicMenuSection): PublicMenuSection {
  const subgroups = section.subgroups ?? [];
  const authored = subgroups.filter(isAuthorSubgroup);
  if (!authored.length) return section;
  return { ...section, subgroups: [...authored, ...subgroups.filter((sg) => !isAuthorSubgroup(sg))] };
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
    const door: DoorId = knownDoor(section.id) ?? previous;
    previous = door;
    grouped.get(door)!.push(door === "cafe" ? leadWithAuthors(section) : section);
  }
  return DOOR_ORDER.map((id) => {
    const sections = grouped.get(id)!;
    return {
      id,
      sections,
      stops: stopsFor(sections),
      itemCount: countItems(sections),
      photo: firstPhoto(sections),
      offers: sections.flatMap((s) => s.offers ?? [])
    };
  }).filter((door) => door.sections.length > 0);
}

export function isDoorId(value: unknown): value is DoorId {
  return typeof value === "string" && (DOOR_ORDER as string[]).includes(value);
}

// Which view `?puerta=` asks for. Shared by the server page (first render) and
// the client carta (back/forward), so both read the URL the same way.
export type CartaView = { kind: "entrance" } | { kind: "door"; id: DoorId } | { kind: "combos" };

export function parseView(puerta: string | undefined | null): CartaView {
  if (puerta === "combos") return { kind: "combos" };
  if (isDoorId(puerta)) return { kind: "door", id: puerta };
  return { kind: "entrance" };
}

// Lowest backend price an offer can be had for, for the "desde" cue on a card.
// Never computed: it is one of the backend's own numbers (a variant price or a
// fixed pair price). Offers whose price lives only in prose return undefined.
export function offerFloor(offer: PublicMenuOffer): number | undefined {
  const prices = [
    ...(offer.variants ?? []).map((v) => v.price_clp),
    ...(offer.detail?.items ?? []).map((row) =>
      row.pricing?.kind === "fixed" ? row.pricing.amount_clp : undefined
    )
  ].filter((n): n is number => typeof n === "number");
  return prices.length ? Math.min(...prices) : undefined;
}
