import type { Nota } from "./types";

// House quote of the week. The em-dash inside renders green per the Paper
// artboard — it's the page's editorial accent.
const NOTAS: ReadonlyArray<Nota> = [
  {
    body: "Una taza a la vez, sin apuro — y la siguiente, cuando a la Deriva.",
    initials: "JS"
  },
  {
    body: "El espresso bien hecho no se apura — espera al que sabe.",
    initials: "JS"
  },
  {
    body: "Tres orígenes en la tolva — uno se queda, dos se van con la semana.",
    initials: "MV"
  }
];

// Pick by ISO-week so the quote rotates predictably across the year.
export function getNota(isoWeek: number): Nota {
  return NOTAS[isoWeek % NOTAS.length];
}
