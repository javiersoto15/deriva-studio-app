import type { Barista, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const SCHEDULE: Record<Weekday, Barista> = {
  mon: {
    name: "Maria",
    turnoUntil: "hasta las 16:30",
    note: "Estoy en barra hoy; te recomiendo partir por el Yirgacheffe si buscas un filtro mas floral."
  },
  tue: {
    name: "Maria",
    turnoUntil: "hasta las 13:30",
    note: "Estoy en barra hoy; te recomiendo partir por el Yirgacheffe si buscas un filtro mas floral."
  },
  wed: {
    name: "Carla",
    turnoUntil: "hasta las 16:30",
    note: "Estoy en barra hoy; si quieres algo sin cafeina, pregunta por Mexico Chiapas."
  },
  thu: {
    name: "Maria",
    turnoUntil: "hasta las 16:30",
    note: "Estoy en barra hoy; te recomiendo partir por el Yirgacheffe si buscas un filtro mas floral."
  },
  fri: {
    name: "Carla",
    turnoUntil: "hasta las 16:30",
    note: "Estoy en barra hoy; si quieres algo sin cafeina, pregunta por Mexico Chiapas."
  },
  sat: {
    name: "Fabian",
    turnoUntil: "hasta las 18:30",
    note: "Estoy en barra hoy; si quieres comparar House Blend y Yirgacheffe, te ayudo a elegir."
  },
  sun: {
    name: "Deriva",
    turnoUntil: "cerrado",
    note: "Mañana abrimos a las 08:00."
  }
};

export function getBarista(weekday: Weekday): Barista {
  return SCHEDULE[weekday];
}
