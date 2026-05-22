// Day-of-week schedule for the landing menu. Fri/Sat run the full menu
// (Fondos, combined "Desayunos y Once" header). Mon-Thu run a tighter menu
// (no Fondos, separate Desayunos + Onces sections). Sunday the shop is
// closed — we still render the weekday menu so customers can plan ahead,
// but add a "cerrado hoy" banner via `isClosedToday`.

export type Schedule = "weekday" | "weekend";

const CHILE_TZ = "America/Santiago";

function chileWeekday(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CHILE_TZ,
    weekday: "short"
  }).format(now);
}

// One-off override: run the full (Fri/Sat) carta every day from this date
// through WEEKEND_OVERRIDE_UNTIL inclusive (Chile calendar). Set both to the
// same value to disable. Remove after the window passes.
const WEEKEND_OVERRIDE_FROM = "2026-05-21";
const WEEKEND_OVERRIDE_UNTIL = "2026-05-24";

function chileDateISO(now: Date): string {
  // YYYY-MM-DD in Santiago, regardless of server TZ.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  return parts;
}

export function getCurrentSchedule(now: Date): Schedule {
  const today = chileDateISO(now);
  if (today >= WEEKEND_OVERRIDE_FROM && today <= WEEKEND_OVERRIDE_UNTIL) {
    return "weekend";
  }
  // Get the weekday as it is right now in Santiago, regardless of server TZ.
  const weekday = chileWeekday(now);
  return weekday === "Fri" || weekday === "Sat" ? "weekend" : "weekday";
}

// True if the shop is closed on the current Chilean calendar day. Today
// only Sunday is closed; extend here if other days (holidays, vacations)
// are added.
export function isClosedToday(now: Date): boolean {
  return chileWeekday(now) === "Sun";
}

// Used by section/item filters: true if the entry should render today.
// `entrySchedules` undefined = "always show".
export function matchesSchedule(
  current: Schedule,
  entrySchedules: readonly Schedule[] | undefined
): boolean {
  if (!entrySchedules || entrySchedules.length === 0) return true;
  return entrySchedules.includes(current);
}
