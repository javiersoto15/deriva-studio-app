// Service-window state for the Menú Ejecutivo, resolved in America/Santiago.
//
// The published edition (dishes, price) is backend-owned; *whether it is being
// served right now* is a clock question, and the clock that matters is the
// shop's, not the visitor's. Chile observes DST (it flips on the first Sunday
// of September), so a hardcoded -04:00/-03:00 offset would be wrong for half
// the year — `Intl.DateTimeFormat` with an IANA zone is the only correct read.

export const SERVICE_TZ = "America/Santiago";
export const SERVICE_START_MINUTES = 13 * 60; // 13:00
export const SERVICE_END_MINUTES = 16 * 60; // 16:00

export type ExecutiveServiceStatus =
  | "before" // weekday, service has not started
  | "now" // weekday, inside 13:00–16:00
  | "after" // weekday, service finished
  | "weekend"; // Sat/Sun — returns next business day

export type ExecutiveService = {
  status: ExecutiveServiceStatus;
  /** True ONLY inside the weekday 13:00–16:00 window. */
  servingNow: boolean;
  /** Whether today is a Mon–Fri service day at all. */
  serviceDay: boolean;
  /** Short uppercase status chip. */
  badge: string;
  /** One-sentence, honest statement of the current state. */
  note: string;
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SERVICE_TZ,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

/** Santiago-local weekday (0=Sun) and minutes-since-midnight for an instant. */
export function santiagoClock(now: Date = new Date()): {
  weekday: number;
  minutes: number;
} {
  const parts = partsFormatter.formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  // Intl renders midnight as "24" under hour12:false in some ICU versions.
  const hour = Number(get("hour")) % 24;
  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    minutes: hour * 60 + Number(get("minute"))
  };
}

export function resolveExecutiveService(now: Date = new Date()): ExecutiveService {
  const { weekday, minutes } = santiagoClock(now);

  if (weekday === 0 || weekday === 6) {
    return {
      status: "weekend",
      servingNow: false,
      serviceDay: false,
      badge: "Vuelve el lunes",
      note: "El Menú Ejecutivo se sirve de lunes a viernes. Vuelve el próximo día hábil."
    };
  }

  if (minutes < SERVICE_START_MINUTES) {
    return {
      status: "before",
      servingNow: false,
      serviceDay: true,
      badge: "Comienza a las 13:00",
      note: "El servicio de hoy comienza a las 13:00."
    };
  }

  if (minutes <= SERVICE_END_MINUTES) {
    return {
      status: "now",
      servingNow: true,
      serviceDay: true,
      badge: "Disponible ahora",
      note: "Se está sirviendo ahora, hasta las 16:00."
    };
  }

  return {
    status: "after",
    servingNow: false,
    serviceDay: true,
    badge: "Servicio terminado",
    note: "El servicio de hoy ya terminó. Vuelve mañana desde las 13:00."
  };
}
