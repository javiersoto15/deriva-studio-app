// Typed shapes for the /hoy daily edition. v1 reads from typed configs in
// this folder. The shapes mirror the eventual `/public/today` backend
// response so a future swap is a single fetcher change per module.

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
  flags?: ReadonlyArray<"sin-cafeina">;
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
