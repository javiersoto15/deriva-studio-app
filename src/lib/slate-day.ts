// Date-aware label for the World Cup predictor slate.
//
// Given a campaign date (YYYY-MM-DD, Santiago-local) it returns a Spanish
// label relative to "today" in America/Santiago:
//   same day  → "hoy"
//   next day  → "mañana"
//   otherwise → "el {weekday}" (lowercase, e.g. "el lunes")
//
// Pure/deterministic given `now`; mirrors src/lib/edition.ts's Santiago-tz
// date derivation so prerender and runtime agree.

const CHILE_TZ = "America/Santiago";

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

/** Santiago-local Spanish weekday for a YYYY-MM-DD date, lowercase. */
function weekdayLong(campaignDate: string): string {
  const [y, m, d] = campaignDate.split("-").map((n) => parseInt(n, 10));
  // Noon UTC keeps the date stable when the formatter shifts to Santiago.
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TZ,
    weekday: "long"
  })
    .format(dt)
    .toLowerCase();
}

/**
 * Label the slate's day relative to today (America/Santiago).
 * @param campaignDate YYYY-MM-DD, Santiago-local.
 */
export function slateDayLabel(campaignDate: string, now: Date = new Date()): string {
  const [ty, tm, td] = chileYmd(now);
  const todayUtc = Date.UTC(ty, tm - 1, td);

  const [cy, cm, cd] = campaignDate.split("-").map((n) => parseInt(n, 10));
  const campaignUtc = Date.UTC(cy, cm - 1, cd);

  const diffDays = Math.round((campaignUtc - todayUtc) / 86400000);

  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  return `el ${weekdayLong(campaignDate)}`;
}
