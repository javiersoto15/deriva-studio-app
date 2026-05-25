// Shared "edition" numbering for signage pages (/abierto, /menu-display).
// Uses ISO week of the Santiago calendar so both pages always display the
// same edition mark on the same day.

const CHILE_TZ = "America/Santiago";

const SEASON_BY_MONTH: Record<number, string> = {
  0: "Verano",   1: "Verano",   2: "Otoño",
  3: "Otoño",    4: "Otoño",    5: "Invierno",
  6: "Invierno", 7: "Invierno", 8: "Primavera",
  9: "Primavera", 10: "Primavera", 11: "Verano"
};

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
  return `Vol. 001 · Otoño · № ${String(weekNum).padStart(2, "0")}`;
}

// Variant used by /abierto's masthead: uppercase + Roman MMXXVI suffix.
export function getEditionMarkUppercase(now: Date = new Date()): string {
  const [y, m, d] = chileYmd(now);
  const weekNum = isoWeek(y, m, d);
  const season = SEASON_BY_MONTH[m - 1];
  return `VOL. 001 · ${season.toUpperCase()} MMXXVI · № ${String(weekNum).padStart(2, "0")}`;
}

// Split edition info for surfaces that render Vol/№ and Season+Campaign
// in separate visual slots (e.g. /hoy's slim mast).
export type EditionParts = {
  /** "Vol. 001 · № 22" — title-case. */
  volumeAndWeek: string;
  /** "Otoño MMXXVI · Apertura" — title-case. */
  seasonAndCampaign: string;
  /** Title-case Spanish day-and-date label e.g. "Lun 25 May". */
  shortDate: string;
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
  const season = SEASON_BY_MONTH[mo - 1];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const dayIdx = dt.getUTCDay();
  return {
    volumeAndWeek: `Vol. 001 · № ${String(weekNum).padStart(2, "0")}`,
    seasonAndCampaign: `${season} MMXXVI · Apertura`,
    shortDate: `${DAY_SHORT_ES[dayIdx]} ${d} ${MONTH_SHORT_ES[mo - 1]}`,
    weekday: DAY_TO_KEY[dayIdx] as EditionParts["weekday"],
    isoWeek: weekNum
  };
}
