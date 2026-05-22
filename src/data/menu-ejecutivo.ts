// Menu Ejecutivo daily edition. The four courses rotate every day —
// edit `MENU_EJECUTIVO_TODAY.courses` each morning until the backend takes
// over this content. Fixed program facts (price, hours, hero copy) live in
// MENU_EJECUTIVO_FIXED and don't change without a brand-level decision.

export type MenuEjecutivoCourse = {
  name: string;
  /** Italic line under the dish, e.g. an alternative or pairing note. */
  note?: string;
};

export type MenuEjecutivoEdition = {
  courses: {
    bebida: MenuEjecutivoCourse;
    entrada: MenuEjecutivoCourse;
    fondo: MenuEjecutivoCourse;
    queque: MenuEjecutivoCourse;
  };
};

export const MENU_EJECUTIVO_FIXED = {
  priceClp: 10990,
  priceLabel: "CLP $10.990",
  hours: "13:00 – 16:00",
  hero: "La ronda del mediodía.",
  subline: "Cuatro momentos. Una cuenta. Sólo entre la una y las cuatro.",
  courseTags: {
    bebida: "de la barra",
    entrada: "entrada",
    fondo: "plato del día",
    queque: "del horno"
  }
} as const;

// Today's rotating content. Update once per service day.
export const MENU_EJECUTIVO_TODAY: MenuEjecutivoEdition = {
  courses: {
    bebida: { name: "Una bebida" },
    entrada: { name: "Crema del Día" },
    fondo: {
      name: "Ñoquis al pesto con zapallo",
      note: "ó con salsa de tomate y vacuno"
    },
    queque: { name: "Un queque" }
  }
};

// "HOY · MIÉ 20 MAY" derived from the request date in Chilean time, so the
// label rotates on its own without an edit when the day changes.
export function getMenuEjecutivoDateLabel(now: Date): string {
  const fmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    day: "numeric",
    month: "short"
  });
  const parts = fmt.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  // Spanish abbreviations come out with a trailing period (mié., mar.).
  // Strip it; we want a clean two-or-three-letter token in caps.
  const weekday = get("weekday").replace(/\.$/, "").toUpperCase();
  const day = get("day");
  const month = get("month").replace(/\.$/, "").toUpperCase();
  return `HOY · ${weekday} ${day} ${month}`;
}
