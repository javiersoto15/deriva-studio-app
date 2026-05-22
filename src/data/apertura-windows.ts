// Time-bounded apertura availability windows. Separate from the static
// `unavailable: true` flags in `menu.ts` because these flip back on
// automatically once the cutoff passes — no redeploy needed.

// 2026-05-19T07:00:00-04:00 (Santiago / CLT) = 2026-05-19T11:00:00Z.
// Cocina launches in stages: opening day (2026-05-18) only the Sobrecostilla
// Braseada runs on Fondos; the rest of Cocina (Entradas other than the
// already-out Tiradito, plus Ñoquis / Brochetas / Croquetas and Empanadas)
// rejoins the carta the next morning at 07:00 Chile time.
export const COCINA_OPENING_NIGHT_CUTOFF_UTC = new Date("2026-05-19T11:00:00Z");

// Item IDs gated by the opening-night window. Cleared on 2026-05-19 after
// the cutoff passed — the listed Cocina items are now part of the regular
// carta. The set stays here as a primitive for future timed availability
// changes; populate it again when you need another window.
const COCINA_OPENING_NIGHT_GATED_IDS: ReadonlySet<string> = new Set();

// Caller passes `now` explicitly — Next 16 strict mode forbids reading the
// current time inside prerendered Server Components, so we require the value
// to come from a dynamic boundary (after `await connection()`).
export function getTemporarilyUnavailableItemIds(now: Date): ReadonlySet<string> {
  if (now < COCINA_OPENING_NIGHT_CUTOFF_UTC) {
    return COCINA_OPENING_NIGHT_GATED_IDS;
  }
  return new Set();
}
