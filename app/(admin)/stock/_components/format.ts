const TIME_ZONE = "America/Santiago";

const dayKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const timeOnly = new Intl.DateTimeFormat("es-CL", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const shortDate = new Intl.DateTimeFormat("es-CL", { timeZone: TIME_ZONE, day: "numeric", month: "short" });
const headerDate = new Intl.DateTimeFormat("es-CL", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short"
});

function daysBetween(a: Date, b: Date): number {
  const toUtcMidnight = (date: Date) => Date.parse(`${dayKey.format(date)}T00:00:00Z`);
  return Math.round((toUtcMidnight(b) - toUtcMidnight(a)) / 86_400_000);
}

/** "08:12" today, "ayer 20:41", otherwise "24 sept". Café time zone, never the device's. */
export function formatUpdated(value: string | undefined, now: Date): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = daysBetween(date, now);
  if (diff <= 0) return timeOnly.format(date);
  if (diff === 1) return `ayer ${timeOnly.format(date)}`;
  return shortDate.format(date);
}

export function formatClock(date: Date): string {
  return timeOnly.format(date);
}

export function formatHeaderDate(now: Date): string {
  const text = headerDate.format(now).replace(/\./g, "").replace(",", "");
  return text.charAt(0).toLocaleUpperCase("es-CL") + text.slice(1);
}

/** History timestamps: "Hoy 18:42", "Ayer 11:05", "24 sept 08:12". */
export function formatHistoryTime(value: string, now: Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = daysBetween(date, now);
  if (diff <= 0) return `Hoy ${timeOnly.format(date)}`;
  if (diff === 1) return `Ayer ${timeOnly.format(date)}`;
  return `${shortDate.format(date)} ${timeOnly.format(date)}`;
}

/** Actors are shown by ID only (founder decision); long IDs are shortened, never renamed. */
export function shortActor(actorId: string): string {
  return actorId.length > 14 ? `${actorId.slice(0, 7)}…${actorId.slice(-4)}` : actorId;
}
