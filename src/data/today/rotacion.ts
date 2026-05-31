import type { Origin, Weekday } from "./types";

// Degraded fallback only. Authenticated runtime content comes from GET /me/today.
const SCHEDULE: Record<Weekday, ReadonlyArray<Origin>> = {
  mon: [
    {
      name: "Chiapas",
      finca: "Argovia",
      proceso: "Honey",
      notes: "Manzana roja, miel de palma, cuerpo medio."
    },
    {
      name: "Nariño",
      finca: "Granja La Esperanza",
      proceso: "Sugar Cane Process",
      notes: "Chocolate de leche, nuez tostada, dulzor largo.",
      flags: ["sin-cafeina"]
    }
  ],
  tue: [
    {
      name: "Cerrado",
      finca: "Fazenda Ambiental",
      proceso: "Natural",
      notes: "Cacao, almendra tostada."
    },
    {
      name: "Huila",
      finca: "El Mirador",
      proceso: "Honey",
      notes: "Panela, frutos rojos."
    }
  ],
  wed: [
    {
      name: "Yirgacheffe",
      finca: "Konga",
      proceso: "Lavado",
      notes: "Bergamota, jazmín."
    },
    {
      name: "Nariño",
      finca: "Granja La Esperanza",
      proceso: "Sugar Cane Process",
      notes: "Chocolate de leche, nuez tostada.",
      flags: ["sin-cafeina"]
    }
  ],
  thu: [
    {
      name: "Chiapas",
      finca: "Argovia",
      proceso: "Honey",
      notes: "Manzana roja, miel de palma."
    },
    {
      name: "Antigua",
      finca: "San Sebastián",
      proceso: "Lavado",
      notes: "Chocolate negro, naranja."
    }
  ],
  fri: [
    {
      name: "Yirgacheffe",
      finca: "Konga",
      proceso: "Lavado",
      notes: "Bergamota, jazmín."
    },
    {
      name: "Sidamo",
      finca: "Bombe",
      proceso: "Natural",
      notes: "Frutilla madura, vino."
    }
  ],
  sat: [
    {
      name: "Huehuetenango",
      finca: "La Esperanza",
      proceso: "Lavado",
      notes: "Caramelo, mandarina."
    },
    {
      name: "Nariño",
      finca: "Granja La Esperanza",
      proceso: "Sugar Cane Process",
      notes: "Chocolate de leche, nuez tostada.",
      flags: ["sin-cafeina"]
    }
  ],
  sun: [
    {
      name: "Chiapas",
      finca: "Argovia",
      proceso: "Honey",
      notes: "Manzana roja, miel de palma."
    },
    {
      name: "Nariño",
      finca: "Granja La Esperanza",
      proceso: "Sugar Cane Process",
      notes: "Chocolate de leche, nuez tostada.",
      flags: ["sin-cafeina"]
    }
  ]
};

export function getRotacion(weekday: Weekday): ReadonlyArray<Origin> {
  return SCHEDULE[weekday];
}
