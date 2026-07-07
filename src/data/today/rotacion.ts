import type { Origin, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const DACH_ROTACION: ReadonlyArray<Origin> = [
  {
    name: "House Blend by DACH",
    finca: "DACH",
    proceso: "Lavado y natural",
    notes: "Chocolate, fruta tropical, durazno, avellana, caramelo y te negro."
  },
  {
    name: "Mexico Chiapas Descafeinado",
    finca: "DACH",
    proceso: "Lavado - Descafeinado Mountain Water",
    notes: "Canela, tabaco, vainilla, azucar de cana, caramelo claro y especias.",
    flags: ["sin-cafeina"]
  }
];

const SCHEDULE: Record<Weekday, ReadonlyArray<Origin>> = {
  mon: DACH_ROTACION,
  tue: DACH_ROTACION,
  wed: DACH_ROTACION,
  thu: DACH_ROTACION,
  fri: DACH_ROTACION,
  sat: DACH_ROTACION,
  sun: DACH_ROTACION
};

export function getRotacion(weekday: Weekday): ReadonlyArray<Origin> {
  return SCHEDULE[weekday];
}
