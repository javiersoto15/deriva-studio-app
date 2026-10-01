import type {
  CreateRawItemPayload,
  StockAdjustmentMode,
  StockAdjustmentPayload,
  StockApiErrorBody,
  StockHistoryEntry,
  StockItem,
  StockItemKind,
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

  return {
    items: itemsValue.map(normalizeStockItem),
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
    return {
      id: requiredString(record.id, "history id"),
      stock_id: requiredString(record.stock_id, "history stock id"),
      actor_id: requiredString(record.actor_id, "history actor"),
      before_quantity: before,
      after_quantity: after,
      reason: optionalString(record.reason),
      created_at: requiredString(record.created_at, "history timestamp"),
      mode,
      quantity: safeInteger(record.quantity, "history quantity"),
      revision: safeInteger(record.revision, "history revision")
    };
  });
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
