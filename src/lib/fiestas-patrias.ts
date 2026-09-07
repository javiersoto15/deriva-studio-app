// Fiestas Patrias 2026 — festive-brand window.
//
// While this window is open every isotipo on the webapp wears the chupalla
// (see src/brand/isotipo.ts and 09_marketing/brand/fiestas-patrias-2026/).
// Dates are Santiago-local calendar days, inclusive on both ends, so the
// swap flips at local midnight regardless of the server's timezone.
//
// Founder decision 2026-09-07: on from today through the 19th (the Friday
// that closes the long weekend). Edit `end` here to extend; nothing else
// needs touching.

const CHILE_TZ = "America/Santiago";

export const FIESTAS_PATRIAS_WINDOW = {
  start: "2026-09-07",
  end: "2026-09-19"
} as const;

// YYYY-MM-DD for `now` in Santiago. en-CA formats as ISO-like y-m-d.
function santiagoDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function isFiestasPatriasWindow(now: Date = new Date()): boolean {
  const d = santiagoDate(now);
  return d >= FIESTAS_PATRIAS_WINDOW.start && d <= FIESTAS_PATRIAS_WINDOW.end;
}
