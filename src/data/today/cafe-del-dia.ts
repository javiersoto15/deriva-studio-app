import type { DestacadoOrigin, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const SCHEDULE: Record<Weekday, DestacadoOrigin> = {
  mon: {
    name: "Huehuetenango",
    finca: "La Esperanza",
    proceso: "Lavado",
    notes: "Caramelo, mandarina, final corto de cacao.",
    brew: "Pour over · V60"
  },
  tue: {
    name: "Yirgacheffe",
    finca: "Konga",
    proceso: "Lavado",
    notes: "Bergamota, jazmín, panela.",
    brew: "Pour over · V60"
  },
  wed: {
    name: "Cerrado",
    finca: "Fazenda Ambiental",
    proceso: "Natural",
    notes: "Cacao, almendra tostada, cuerpo medio.",
    brew: "Espresso · doble"
  },
  thu: {
    name: "Huila",
    finca: "El Mirador",
    proceso: "Honey",
    notes: "Panela, frutos rojos, dulzor largo.",
    brew: "Chemex"
  },
  fri: {
    name: "Antigua",
    finca: "San Sebastián",
    proceso: "Lavado",
    notes: "Chocolate negro, naranja, especias.",
    brew: "Pour over · V60"
  },
  sat: {
    name: "Sidamo",
    finca: "Bombe",
    proceso: "Natural",
    notes: "Frutilla madura, vino, miel.",
    brew: "Chemex"
  },
  sun: {
    name: "Huehuetenango",
    finca: "La Esperanza",
    proceso: "Lavado",
    notes: "Caramelo, mandarina, final corto de cacao.",
    brew: "Pour over · V60"
  }
};

export function getCafeDelDia(weekday: Weekday): DestacadoOrigin {
  return SCHEDULE[weekday];
}
