import type {
  CreateRawItemPayload,
  StockAdjustmentMode,
  StockAdjustmentPayload,
  StockApiErrorBody,
  StockHistoryEntry,
  StockHistoryPage,
  StockItem,
  StockItemKind,
  StockLot,
  StockLotAffected,
  StockLotDateResult,
  StockShelfLife,
  StockShelfLifeConfiguration,
  StockShelfLifeGroup,
  StockShelfLifeSummary,
  StockSnapshot
} from "./types";

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Stock response is missing ${field}`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeInteger(value: unknown, field: string): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^-?\d+$/.test(value.trim())
        ? Number(value)
        : NaN;
  if (!Number.isSafeInteger(numberValue)) {
    throw new Error(`Stock response has an invalid ${field}`);
  }
  return numberValue;
}

function nullableNonNegativeInteger(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  const numberValue = safeInteger(value, field);
  if (numberValue < 0) throw new Error(`Stock response has an invalid ${field}`);
  return numberValue;
}

function nonNegativeInteger(value: unknown, field: string): number {
  const numberValue = safeInteger(value, field);
  if (numberValue < 0) throw new Error(`Stock response has an invalid ${field}`);
  return numberValue;
}

function nullableTimestamp(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`Stock response has an invalid ${field}`);
  }
  return value;
}

const LOT_STATES = ["discard", "sell_first", "fresh", "unknown"] as const;

function lotState(value: unknown): StockLot["state"] {
  if (typeof value === "string" && (LOT_STATES as readonly string[]).includes(value)) {
    return value as StockLot["state"];
  }
  throw new Error("Stock response has an invalid lot state");
}

function normalizeLot(value: unknown): StockLot {
  const record = asRecord(value);
  if (!record) throw new Error("Stock lot is not an object");
  return {
    id: requiredString(record.id, "lot id"),
    entered_at: nullableTimestamp(record.entered_at, "lot entered_at"),
    quantity_left: nonNegativeInteger(record.quantity_left, "lot quantity_left"),
    fresh_until: nullableTimestamp(record.fresh_until, "lot fresh_until"),
    discard_at: nullableTimestamp(record.discard_at, "lot discard_at"),
    state: lotState(record.state)
  };
}

/** Lots arrive FIFO (unknown age last); the order is kept as the backend sent it. */
export function normalizeShelfLife(value: unknown): StockShelfLife {
  const record = asRecord(value);
  if (!record) throw new Error("Stock shelf_life is not an object");
  const counts = asRecord(record.counts);
  if (!counts) throw new Error("Stock shelf_life is missing counts");
  if (!Array.isArray(record.lots)) throw new Error("Stock shelf_life is missing lots");
  if (typeof record.last_sale_day !== "boolean") throw new Error("Stock shelf_life is missing last_sale_day");
  return {
    fresh_days: nonNegativeInteger(record.fresh_days, "fresh_days"),
    discard_days: nonNegativeInteger(record.discard_days, "discard_days"),
    worst_state: lotState(record.worst_state),
    last_sale_day: record.last_sale_day,
    counts: {
      discard: nonNegativeInteger(counts.discard, "discard count"),
      sell_first: nonNegativeInteger(counts.sell_first, "sell_first count"),
      fresh: nonNegativeInteger(counts.fresh, "fresh count"),
      unknown: nonNegativeInteger(counts.unknown, "unknown count")
    },
    lots: record.lots.map(normalizeLot)
  };
}

function normalizeShelfLifeSummary(value: unknown): StockShelfLifeSummary {
  const record = asRecord(value);
  // Tolerate a backend that predates shelf life: no summary means nothing to retire.
  if (!record) return { discard_items: 0, sell_first_items: 0 };
  return {
    discard_items: nonNegativeInteger(record.discard_items, "discard_items"),
    sell_first_items: nonNegativeInteger(record.sell_first_items, "sell_first_items")
  };
}

function normalizeLotAffected(value: unknown): StockLotAffected {
  const record = asRecord(value);
  if (!record) throw new Error("Stock lot change is not an object");
  return {
    lot_id: requiredString(record.lot_id, "lot change id"),
    entered_at: nullableTimestamp(record.entered_at, "lot change entered_at"),
    fresh_until: nullableTimestamp(record.fresh_until, "lot change fresh_until"),
    discard_at: nullableTimestamp(record.discard_at, "lot change discard_at"),
    before: nonNegativeInteger(record.before, "lot change before"),
    after: nonNegativeInteger(record.after, "lot change after")
  };
}

function kind(value: unknown): StockItemKind {
  if (value === "menu_item" || value === "raw_item") return value;
  throw new Error("Stock response has an invalid kind");
}

function unit(value: unknown): StockItem["unit"] {
  const allowed = ["unit", "g", "kg", "ml", "l", "portion", "pack", "box"] as const;
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as StockItem["unit"];
  }
  throw new Error("Stock response has an invalid unit");
}

/** Normalize one backend item, including the backend's JSON number fields. */
export function normalizeStockItem(value: unknown): StockItem {
  const record = asRecord(value);
  if (!record) throw new Error("Stock response item is not an object");

  const item: StockItem = {
    id: requiredString(record.id ?? record.stock_id, "item id"),
    kind: kind(record.kind),
    name: requiredString(record.name, "item name"),
    unit: unit(record.unit),
    quantity: nullableNonNegativeInteger(record.quantity, "quantity"),
    revision: safeInteger(record.revision, "revision")
  };
  if (item.revision < 0) throw new Error("Stock response has an invalid revision");

  const menuItemId = optionalString(record.menu_item_id);
  const updatedAt = optionalString(record.updated_at);
  if (menuItemId) item.menu_item_id = menuItemId;
  if (updatedAt) item.updated_at = updatedAt;
  if (typeof record.menu_available === "boolean") item.menu_available = record.menu_available;
  if (record.shelf_life !== undefined && record.shelf_life !== null) {
    item.shelf_life = normalizeShelfLife(record.shelf_life);
  }
  return item;
}

/**
 * Extract an item from both the provisional direct-item response and the
 * backend's item-plus-adjustment response envelope.
 */
export function extractStockItem(value: unknown): StockItem {
  const record = asRecord(value);
  if (!record) return normalizeStockItem(value);
  if (record.item) return extractStockItem(record.item);
  return normalizeStockItem(record);
}

export function normalizeStockSnapshot(value: unknown): StockSnapshot {
  const record = asRecord(value);
  const itemsValue = record?.items;
  if (!Array.isArray(itemsValue)) throw new Error("Stock response is missing items");
  if (typeof record?.stock_visibility_enabled !== "boolean") {
    throw new Error("Stock response is missing stock_visibility_enabled");
  }
  if (typeof record?.can_manage_raw_items !== "boolean") {
    throw new Error("Stock response is missing can_manage_raw_items");
  }

  const items = itemsValue.map(normalizeStockItem);
  const hasTrackedItems = items.some((item) => item.shelf_life !== undefined);
  let serverNow: string | null;
  try {
    serverNow = nullableTimestamp(record.now, "now");
  } catch (error) {
    if (hasTrackedItems) throw new Error("Stock response has an invalid now for tracked inventory");
    throw error;
  }
  if (serverNow === null && hasTrackedItems) {
    throw new Error("Stock response is missing now for tracked inventory");
  }

  return {
    items,
    // `now` is the single instant every shelf-life state was evaluated at.
    now: serverNow ?? new Date().toISOString(),
    shelf_life_summary: normalizeShelfLifeSummary(record.shelf_life_summary),
    stock_visibility_enabled: record.stock_visibility_enabled,
    can_manage_raw_items: record.can_manage_raw_items
  };
}

function historyEntries(value: unknown): unknown[] {
  const record = asRecord(value);
  if (!record) throw new Error("Stock history response is not an object");
  if (Array.isArray(record.entries)) return record.entries;
  throw new Error("Stock history response is missing entries");
}

export function normalizeHistory(value: unknown): StockHistoryEntry[] {
  return historyEntries(value).map((entry) => {
    const record = asRecord(entry);
    if (!record) throw new Error("Stock history entry is not an object");
    const mode = record.mode === "set" || record.mode === "delta" ? record.mode : null;
    if (!mode) throw new Error("Stock history entry has an invalid mode");
    const after = nullableNonNegativeInteger(record.after_quantity, "after_quantity");
    if (after === null) throw new Error("Stock history entry is missing after_quantity");
    const before = nullableNonNegativeInteger(record.before_quantity, "before_quantity");
    const normalized: StockHistoryEntry = {
      id: requiredString(record.id, "history id"),
      stock_id: requiredString(record.stock_id, "history stock id"),
      actor_id: requiredString(record.actor_id, "history actor"),
      before_quantity: before,
      after_quantity: after,
      reason: optionalString(record.reason) ?? "",
      created_at: requiredString(record.created_at, "history timestamp"),
      mode,
      quantity: safeInteger(record.quantity, "history quantity"),
      revision: safeInteger(record.revision, "history revision"),
      request_id: optionalString(record.request_id) ?? ""
    };
    if (Array.isArray(record.lots_affected)) {
      normalized.lots_affected = record.lots_affected.map(normalizeLotAffected);
    }
    return normalized;
  });
}

export function normalizeHistoryPage(value: unknown): StockHistoryPage {
  const record = asRecord(value);
  if (!record) throw new Error("Stock history page response is not an object");
  if (typeof record.has_more !== "boolean") throw new Error("Stock history page is missing has_more");
  const nextBeforeRevision = record.next_before_revision === null
    ? null
    : safeInteger(record.next_before_revision, "next_before_revision");
  if (nextBeforeRevision !== null && nextBeforeRevision < 1) {
    throw new Error("Stock history page has an invalid next_before_revision");
  }
  if (record.has_more !== (nextBeforeRevision !== null)) {
    throw new Error("Stock history page has inconsistent pagination");
  }
  return {
    entries: normalizeHistory(value),
    has_more: record.has_more,
    next_before_revision: nextBeforeRevision
  };
}

function normalizeGroup(value: unknown): StockShelfLifeGroup {
  const record = asRecord(value);
  if (!record) throw new Error("Shelf-life group is not an object");
  if (!Array.isArray(record.menu_item_ids)) throw new Error("Shelf-life group is missing menu_item_ids");
  return {
    id: requiredString(record.id, "group id"),
    name: requiredString(record.name, "group name"),
    fresh_days: nonNegativeInteger(record.fresh_days, "group fresh_days"),
    discard_days: nonNegativeInteger(record.discard_days, "group discard_days"),
    revision: nonNegativeInteger(record.revision, "group revision"),
    menu_item_ids: record.menu_item_ids.map((id) => requiredString(id, "group menu item id")),
    // Direct raw-counter members (backend 2026-10-31). Read-only here: /stock
    // never sends them back, and an omitted field keeps them on the backend.
    stock_item_ids: Array.isArray(record.stock_item_ids)
      ? record.stock_item_ids.map((id) => requiredString(id, "group stock item id"))
      : []
  };
}

export { normalizeGroup as normalizeShelfLifeGroup };

export function normalizeShelfLifeConfiguration(value: unknown): StockShelfLifeConfiguration {
  const record = asRecord(value);
  if (!record) throw new Error("Shelf-life configuration is not an object");
  if (!Array.isArray(record.groups) || !Array.isArray(record.menu_items)) {
    throw new Error("Shelf-life configuration is incomplete");
  }
  return {
    groups: record.groups.map(normalizeGroup),
    menu_items: record.menu_items.map((entry) => {
      const item = asRecord(entry);
      if (!item) throw new Error("Shelf-life menu item is not an object");
      return { id: requiredString(item.id, "menu item id"), name: requiredString(item.name, "menu item name") };
    }),
    stock_items: (Array.isArray(record.stock_items) ? record.stock_items : []).map((entry) => {
      const item = asRecord(entry);
      if (!item) throw new Error("Shelf-life stock item is not an object");
      return {
        id: requiredString(item.id, "stock item id"),
        name: requiredString(item.name, "stock item name"),
        unit: item.unit === "portion" ? ("portion" as const) : ("unit" as const)
      };
    }),
    can_manage_rules: record.can_manage_rules === true
  };
}

export function normalizeLotDateResult(value: unknown): StockLotDateResult {
  const record = asRecord(value);
  if (!record) throw new Error("Lot date response is not an object");
  const required = (field: string) => {
    const timestamp = nullableTimestamp(record[field], field);
    if (timestamp === null) throw new Error(`Lot date response is missing ${field}`);
    return timestamp;
  };
  return {
    id: requiredString(record.id, "lot id"),
    stock_id: requiredString(record.stock_id, "lot stock id"),
    entered_at: required("entered_at"),
    fresh_until: required("fresh_until"),
    discard_at: required("discard_at"),
    quantity_in: nonNegativeInteger(record.quantity_in, "quantity_in"),
    quantity_left: nonNegativeInteger(record.quantity_left, "quantity_left")
  };
}

/** Read a 409 on group writes; `revision_conflict` carries the current group. */
export function parseGroupConflict(body: unknown): {
  code: "revision_conflict" | "request_conflict" | "shelf_life_group_conflict" | "shelf_life_group_orphan" | null;
  current: StockShelfLifeGroup | null;
} {
  const record = asRecord(body);
  const codes = ["revision_conflict", "request_conflict", "shelf_life_group_conflict", "shelf_life_group_orphan"] as const;
  const code = typeof record?.code === "string" && (codes as readonly string[]).includes(record.code)
    ? (record.code as (typeof codes)[number])
    : null;
  let current: StockShelfLifeGroup | null = null;
  if (record?.current) {
    try {
      current = normalizeGroup(record.current);
    } catch {
      current = null;
    }
  }
  return { code, current };
}

export function makeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function validateAdjustmentPayload(payload: StockAdjustmentPayload): string | null {
  if (payload.mode !== "set" && payload.mode !== "delta") return "El tipo de ajuste no es válido.";
  if (!Number.isSafeInteger(payload.quantity)) return "Ingresa una cantidad entera válida.";
  if (payload.mode === "set" && payload.quantity < 0) {
    return "El total no puede ser negativo.";
  }
  if (payload.mode === "delta" && Math.abs(payload.quantity) > MAX_SAFE_INTEGER) {
    return "El ajuste supera el límite permitido.";
  }
  if (!Number.isSafeInteger(payload.expected_revision) || payload.expected_revision < 0) {
    return "La revisión del conteo no es válida.";
  }
  if (typeof payload.request_id !== "string" || payload.request_id.trim().length === 0) {
    return "Falta el identificador de la solicitud.";
  }
  return null;
}

export function buildAdjustmentPayload(args: {
  mode: StockAdjustmentMode;
  amount: number;
  expectedRevision: number;
  requestId?: string;
  reason?: string;
}): StockAdjustmentPayload {
  const quantity = args.mode === "delta" ? args.amount : args.amount;
  const payload: StockAdjustmentPayload = {
    mode: args.mode,
    quantity,
    expected_revision: args.expectedRevision,
    request_id: args.requestId ?? makeRequestId()
  };
  const reason = args.reason?.trim();
  if (reason) payload.reason = reason;
  const error = validateAdjustmentPayload(payload);
  if (error) throw new Error(error);
  return payload;
}

export function buildRawItemPayload(args: {
  name: string;
  unit: CreateRawItemPayload["unit"];
  requestId?: string;
}): CreateRawItemPayload {
  const name = args.name.trim();
  if (!name) throw new Error("Escribe el nombre del insumo.");
  return { name, unit: args.unit, request_id: args.requestId ?? makeRequestId() };
}

export function errorMessageFromBody(body: unknown): string | null {
  const record = asRecord(body) as StockApiErrorBody | null;
  if (!record) return null;
  for (const key of ["message", "error", "detail"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

/**
 * Read a 409 StockConflictResponse. `revision_conflict` carries the current
 * row; `request_conflict` means the request ID was reused with other data.
 */
export function parseStockConflict(body: unknown): {
  code: "revision_conflict" | "request_conflict" | null;
  current: StockItem | null;
} {
  const record = asRecord(body);
  const code =
    record?.code === "revision_conflict" || record?.code === "request_conflict" ? record.code : null;
  let current: StockItem | null = null;
  if (record?.current) {
    try {
      current = normalizeStockItem(record.current);
    } catch {
      current = null;
    }
  }
  return { code, current };
}

export function isAmbiguousStockStatus(status: number): boolean {
  return status >= 500 && status <= 599;
}
