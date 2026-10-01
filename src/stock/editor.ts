import type { StockItem, StockItemKind } from "./types";

/** UI-level adjustment modes. `add`/`subtract` both become a backend `delta`. */
export type EditMode = "set" | "add" | "subtract";

export type KindFilter = "all" | StockItemKind;

export type PreviewResult =
  | { ok: true; before: number | null; after: number; delta: number | null }
  | { ok: false; reason: "empty" | "needs_initial" | "zero_delta" | "below_zero"; before: number | null };

const UNIT_SHORT: Record<StockItem["unit"], string> = {
  unit: "unid.",
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  portion: "porc.",
  pack: "pack",
  box: "caja"
};

const UNIT_LONG: Record<StockItem["unit"], string> = {
  unit: "unidad",
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  portion: "porción",
  pack: "pack",
  box: "caja"
};

/** Count-type units first, then weight and volume — the order the create form shows. */
export const RAW_UNIT_GROUPS: ReadonlyArray<ReadonlyArray<StockItem["unit"]>> = [
  ["unit", "portion", "pack", "box"],
  ["g", "kg", "ml", "l"]
];

export const REASON_SUGGESTIONS: Record<EditMode, readonly string[]> = {
  set: ["Conteo de apertura", "Cierre de turno", "Corrección"],
  add: ["Recepción", "Corrección"],
  subtract: ["Vendido", "Merma", "Consumo interno"]
};

export function unitShort(unit: StockItem["unit"]): string {
  return UNIT_SHORT[unit] ?? unit;
}

export function unitLong(unit: StockItem["unit"]): string {
  return UNIT_LONG[unit] ?? unit;
}

export function formatCount(quantity: number): string {
  return new Intl.NumberFormat("es-CL").format(quantity);
}

/** Digits only; anything else (sign, decimal, blank) is not a valid amount. */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * The resulting count for a draft, or the reason it cannot be saved.
 * Counts never go below zero and add/subtract need a known starting count.
 */
export function previewAdjustment(quantity: number | null, mode: EditMode, amountText: string): PreviewResult {
  const amount = parseAmount(amountText);
  if (amount === null) return { ok: false, reason: "empty", before: quantity };
  if (mode === "set") return { ok: true, before: quantity, after: amount, delta: null };
  if (quantity === null) return { ok: false, reason: "needs_initial", before: quantity };
  if (amount === 0) return { ok: false, reason: "zero_delta", before: quantity };
  const delta = mode === "subtract" ? -amount : amount;
  const after = quantity + delta;
  if (after < 0) return { ok: false, reason: "below_zero", before: quantity };
  if (!Number.isSafeInteger(after)) return { ok: false, reason: "empty", before: quantity };
  return { ok: true, before: quantity, after, delta };
}

/** Signed quantity sent to the backend for a valid draft. */
export function payloadQuantity(mode: EditMode, amount: number): number {
  return mode === "subtract" ? -amount : amount;
}

export function filterStockItems(
  items: readonly StockItem[],
  options: { kind: KindFilter; search: string; uncountedOnly: boolean }
): StockItem[] {
  const needle = options.search.trim().toLocaleLowerCase("es-CL");
  return items.filter((item) => {
    if (options.kind !== "all" && item.kind !== options.kind) return false;
    if (options.uncountedOnly && item.quantity !== null) return false;
    return !needle || item.name.toLocaleLowerCase("es-CL").includes(needle);
  });
}

export function countSummary(items: readonly StockItem[]) {
  let menu = 0;
  let raw = 0;
  let uncounted = 0;
  for (const item of items) {
    if (item.kind === "menu_item") menu += 1;
    else raw += 1;
    if (item.quantity === null) uncounted += 1;
  }
  return { total: items.length, menu, raw, uncounted };
}

/**
 * The next item still "Sin contar" after `currentId`, in the order the staff
 * member is looking at, wrapping around. Used by "Guardar · siguiente sin contar".
 */
export function nextUncounted(visible: readonly StockItem[], currentId: string): StockItem | null {
  const start = visible.findIndex((item) => item.id === currentId);
  for (let offset = 1; offset <= visible.length; offset += 1) {
    const candidate = visible[(start + offset + visible.length) % visible.length];
    if (candidate && candidate.id !== currentId && candidate.quantity === null) return candidate;
  }
  return null;
}

/**
 * The editor always opens in "Fijar total": the barra counts what is physically
 * there (founder decision, 28 Sep 2026). Sumar/Restar stay one tap away.
 */
export function defaultEditMode(): EditMode {
  return "set";
}
