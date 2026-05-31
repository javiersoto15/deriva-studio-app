import type { Barista, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const SCHEDULE: Record<Weekday, Barista> = {
  mon: {
    name: "Martina",
    turnoUntil: "hasta las 14:00",
    note: "Hoy estoy probando un Geisha en frío — si te animas, pregúntame."
  },
  tue: {
    name: "Camila",
    turnoUntil: "hasta las 14:00",
    note: "Recién abrimos el lote de Cerrado. Vengan por un espresso."
  },
  wed: {
    name: "Tomás",
    turnoUntil: "hasta las 16:00",
    note: "Chemex caliente, sin apuros. Pídelo doble si vas con tiempo."
  },
  thu: {
    name: "Martina",
    turnoUntil: "hasta las 14:00",
    note: "El honey de Huila pide leche apenas tibia."
  },
  fri: {
    name: "Camila",
    turnoUntil: "hasta las 16:00",
    note: "Viernes de Antigua. Bien para acompañar masa madre."
  },
  sat: {
    name: "Tomás",
    turnoUntil: "hasta las 15:00",
    note: "Sábado pausado. Pide el filtrado y quédate."
  },
  sun: {
    name: "Martina",
    turnoUntil: "cerrado",
    note: "Mañana abrimos a las 08:00."
  }
};

export function getBarista(weekday: Weekday): Barista {
  return SCHEDULE[weekday];
}
