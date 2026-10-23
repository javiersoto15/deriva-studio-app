// Shared "edition" numbering for signage pages (/abierto, /menu-display).
// Uses ISO week of the Santiago calendar so both pages always display the
// same edition mark on the same day.

const CHILE_TZ = "America/Santiago";

// Southern-hemisphere astronomical seasons, keyed by the Santiago-local
// calendar day each one starts (equinoxes/solstices; stable to ±1 day).
export type Season = "verano" | "otono" | "invierno" | "primavera";

const SEASON_STARTS: ReadonlyArray<[month: number, day: number, season: Season]> = [
  [3, 20, "otono"],
  [6, 21, "invierno"],
  [9, 22, "primavera"],
  [12, 21, "verano"]
];

const SEASON_LABELS: Record<"es-CL" | "en" | "pt-BR", Record<Season, string>> = {
  "es-CL": { verano: "Verano", otono: "Otoño", invierno: "Invierno", primavera: "Primavera" },
  en: { verano: "Summer", otono: "Autumn", invierno: "Winter", primavera: "Spring" },
  "pt-BR": { verano: "Verão", otono: "Outono", invierno: "Inverno", primavera: "Primavera" }
};

function seasonFor(m: number, d: number): Season {
  let season: Season = "verano";
  for (const [sm, sd, s] of SEASON_STARTS) {
    if (m > sm || (m === sm && d >= sd)) season = s;
  }
  return season;
}

function toRoman(n: number): string {
  const numerals: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let out = "";
  for (const [value, glyph] of numerals) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return out;
}

export function getSeason(now: Date = new Date()): Season {
  const [, m, d] = chileYmd(now);
  return seasonFor(m, d);
}

// "Primavera 2026" / "Spring 2026" — replaces the backend's static menu season.
export function getSeasonLabel(
  now: Date = new Date(),
  locale: "es-CL" | "en" | "pt-BR" = "es-CL"
): string {
  const [y, m, d] = chileYmd(now);
  return `${SEASON_LABELS[locale][seasonFor(m, d)]} ${y}`;
}

function chileYmd(now: Date): [number, number, number] {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  return [y, m, d];
}

function isoWeek(y: number, m: number, d: number): number {
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((+dt - +yearStart) / 86400000 + 1) / 7);
}

export function getEditionMark(now: Date = new Date()): string {
  const [y, m, d] = chileYmd(now);
  const weekNum = isoWeek(y, m, d);
  const season = SEASON_LABELS["es-CL"][seasonFor(m, d)];
  return `Vol. 001 · ${season} · № ${String(weekNum).padStart(2, "0")}`;
}

// Variant used by /abierto's masthead: uppercase + Roman MMXXVI suffix.
export function getEditionMarkUppercase(now: Date = new Date()): string {
  const [y, m, d] = chileYmd(now);
  const weekNum = isoWeek(y, m, d);
  const season = SEASON_LABELS["es-CL"][seasonFor(m, d)];
  return `VOL. 001 · ${season.toUpperCase()} ${toRoman(y)} · № ${String(weekNum).padStart(2, "0")}`;
}

// Split edition info for surfaces that render Vol/№ and Season+Campaign
// in separate visual slots (e.g. /hoy's slim mast).
export type EditionParts = {
  /** "Vol. 001 · № 22" — title-case. */
  volumeAndWeek: string;
  /** "Otoño MMXXVI · Apertura" — title-case. */
  seasonAndCampaign: string;
  /** "Primavera" — Spanish season name alone. */
  season: string;
  /** "Primavera MMXXVI" — season + Roman year, for edition rails. */
  seasonAndYear: string;
  /** Title-case Spanish day-and-date label e.g. "Lun 25 May". */
  shortDate: string;
  /** Santiago-local ISO date used for backend date-specific content. */
  date: string;
  /** "mon" | "tue" | ... — for content lookup by weekday. */
  weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  /** Raw ISO-week of the year, useful for rotation indexing. */
  isoWeek: number;
};

const DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
];

export function getEditionParts(now: Date = new Date()): EditionParts {
  const [y, mo, d] = chileYmd(now);
  const weekNum = isoWeek(y, mo, d);
  const season = SEASON_LABELS["es-CL"][seasonFor(mo, d)];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const dayIdx = dt.getUTCDay();
  return {
    volumeAndWeek: `Vol. 001 · № ${String(weekNum).padStart(2, "0")}`,
    seasonAndCampaign: `${season} ${toRoman(y)} · Apertura`,
    season,
    seasonAndYear: `${season} ${toRoman(y)}`,
    shortDate: `${DAY_SHORT_ES[dayIdx]} ${d} ${MONTH_SHORT_ES[mo - 1]}`,
    date: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    weekday: DAY_TO_KEY[dayIdx] as EditionParts["weekday"],
    isoWeek: weekNum
  };
}
