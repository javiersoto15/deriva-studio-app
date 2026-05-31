// Degraded fallback shapes for the /hoy daily edition.
// Runtime content comes from authenticated GET /me/today. The static modules
// in this folder are retained only for the loading/offline shell.

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Origin = {
  /** Country · region — set as a single editorial line. */
  name: string;
  /** Sourcing lot / farm. */
  finca?: string;
  /** Lavado / Honey / Natural / etc. */
  proceso: string;
  /** Tasting notes, italic. */
  notes: string;
  /** Optional flags surfaced as small chips. */
  flags?: ReadonlyArray<string>;
};

export type DestacadoOrigin = Origin & {
  /** Brew method shown in hero footer (e.g. "Pour over · V60"). */
  brew: string;
};

export type Barista = {
  /** Full first name (avatar shows first letter). */
  name: string;
  /** Shift end label e.g. "hasta las 14:00". */
  turnoUntil: string;
  /** Optional short note in the barista's voice; rendered in italic. */
  note?: string;
};

export type Nota = {
  /** Pull quote body, in Spanish. The em-dash inside renders green. */
  body: string;
  /** Author initials for the signature. */
  initials: string;
};
