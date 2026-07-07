import type { DestacadoOrigin, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const ETIOPIA_YIRGACHEFFE_DACH: DestacadoOrigin = {
  name: "Etiopia Yirgacheffe",
  finca: "DACH",
  proceso: "Lavado",
  notes: "Chocolate negro, jazmin y te negro.",
  brew: "Pour over y Coffee Flight",
  flags: ["rotacion"]
};

const SCHEDULE: Record<Weekday, DestacadoOrigin> = {
  mon: ETIOPIA_YIRGACHEFFE_DACH,
  tue: ETIOPIA_YIRGACHEFFE_DACH,
  wed: ETIOPIA_YIRGACHEFFE_DACH,
  thu: ETIOPIA_YIRGACHEFFE_DACH,
  fri: ETIOPIA_YIRGACHEFFE_DACH,
  sat: ETIOPIA_YIRGACHEFFE_DACH,
  sun: ETIOPIA_YIRGACHEFFE_DACH
};

export function getCafeDelDia(weekday: Weekday): DestacadoOrigin {
  return SCHEDULE[weekday];
}
