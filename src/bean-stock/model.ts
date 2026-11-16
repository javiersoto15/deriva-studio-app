import type {
  AdjustmentPayload,
  AdjustmentResult,
  BeanItem,
  BeanLinks,
  HistoryEntry,
  HistoryPage,
  LinksPayload,
  Mode,
  Snapshot,
} from "./types";
export const MAX_GRAMS = 999999999999;
/** Integer grams stay below Number.MAX_SAFE_INTEGER. Never multiply a parsed float. */
export function parseKilograms(input: string): number | null {
  if (typeof input !== "string" || input.length > 32) return null;
  const value = input.trim();
  if (!/^\d+(?:[.,]\d{1,3})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const grams = Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  return Number.isSafeInteger(grams) && grams <= MAX_GRAMS ? grams : null;
}
export function gramsToKilograms(grams: number): string {
  if (!Number.isSafeInteger(grams) || grams < 0 || grams > MAX_GRAMS)
    throw Error("invalid_quantity");
  return (
    String(Math.floor(grams / 1000)) +
    (grams % 1000
      ? "." +
        String(grams % 1000)
          .padStart(3, "0")
          .replace(/0+$/, "")
      : "")
  );
}
export function normalizeKilograms(input: string): string | null {
  const grams = parseKilograms(input);
  return grams === null ? null : gramsToKilograms(grams);
}
export function previewQuantity(
  current: string | null,
  mode: Mode,
  input: string,
): string | null {
  const amount = parseKilograms(input);
  if (amount === null) return null;
  if (mode === "set") return gramsToKilograms(amount);
  if (current === null) return null;
  const before = parseKilograms(current);
  if (before === null) return null;
  const after =
    mode === "add"
      ? before + amount
      : mode === "subtract"
        ? before - amount
        : NaN;
  return Number.isSafeInteger(after) && after >= 0 && after <= MAX_GRAMS
    ? gramsToKilograms(after)
    : null;
}
export function buildAdjustment(
  item: BeanItem,
  mode: Mode,
  input: string,
  requestId: string,
  reason = "",
): AdjustmentPayload {
  if (previewQuantity(item.quantity_kg, mode, input) === null)
    throw Error("invalid_quantity");
  const amount = normalizeKilograms(input)!;
  const payload: AdjustmentPayload = {
    mode: mode === "set" ? "set" : "delta",
    quantity_kg: mode === "subtract" && amount !== "0" ? "-" + amount : amount,
    expected_revision: item.revision,
    request_id: requestId,
    reason,
  };
  if (!validAdjustmentPayload(payload)) throw Error("invalid_adjustment");
  return payload;
}
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("invalid_response");
  return v as Record<string, unknown>;
}
function text(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) throw Error("invalid_response");
  return v;
}
function time(v: unknown): string {
  const s = text(v);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s) || !Number.isFinite(Date.parse(s)))
    throw Error("invalid_response");
  return s;
}
function integer(v: unknown, min = 0): number {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min)
    throw Error("invalid_response");
  return v;
}
function list<T>(v: unknown, parse: (v: unknown) => T): T[] {
  if (!Array.isArray(v)) throw Error("invalid_response");
  return v.map(parse);
}
function unique<T>(v: T[], key: (v: T) => string): T[] {
  if (new Set(v.map(key)).size !== v.length) throw Error("invalid_response");
  return v;
}
function quantity(v: unknown, nullable = false, signed = false): string | null {
  if (nullable && v === null) return null;
  const s = text(v);
  if (
    !new RegExp(
      signed ? "^-?\\d+(?:\\.\\d{1,3})?$" : "^\\d+(?:\\.\\d{1,3})?$",
    ).test(s) ||
    parseKilograms(s.startsWith("-") ? s.slice(1) : s) === null
  )
    throw Error("invalid_response");
  const grams = parseKilograms(s.startsWith("-") ? s.slice(1) : s)!;
  return (
    (s.startsWith("-") && grams !== 0 ? "-" : "") + gramsToKilograms(grams)
  );
}
export const validBeanId = (v: unknown): v is string =>
  typeof v === "string" && /^bean_[0-9a-f]{32}$/.test(v);
export function normalizeItem(v: unknown): BeanItem {
  const x = object(v);
  if (
    !validBeanId(x.id) ||
    !/^orig_[a-z0-9_]{1,120}$/.test(text(x.origin_id)) ||
    !["regular", "premium"].includes(String(x.tier)) ||
    x.unit !== "kg"
  )
    throw Error("invalid_response");
  return {
    id: x.id,
    name: text(x.name),
    origin_id: x.origin_id as string,
    tier: x.tier as BeanItem["tier"],
    unit: "kg",
    quantity_kg: quantity(x.quantity_kg, true),
    revision: integer(x.revision),
    updated_at: time(x.updated_at),
  };
}
function ids(v: unknown): string[] {
  return unique(list(v, text), (x) => x);
}
export function normalizeLinks(v: unknown): BeanLinks {
  const x = object(v);
  if (!validBeanId(x.bean_id)) throw Error("invalid_response");
  return { bean_id: x.bean_id, menu_item_ids: ids(x.menu_item_ids) };
}
export function normalizeSnapshot(v: unknown): Snapshot {
  const x = object(v);
  if (typeof x.can_manage_beans !== "boolean") throw Error("invalid_response");
  const items = unique(list(x.items, normalizeItem), (i) => i.id);
  const menu_items = unique(
    list(x.menu_items, (v) => {
      const m = object(v);
      if (typeof m.available !== "boolean") throw Error("invalid_response");
      return {
        id: text(m.id),
        name: text(m.name),
        available: m.available,
        origin_ids: ids(m.origin_ids),
      };
    }),
    (i) => i.id,
  );
  const beans = new Set(items.map((i) => i.id)),
    menu = new Set(menu_items.map((i) => i.id));
  const links = unique(
    list(x.links, (v) => {
      const l = object(v),
        bean_id = text(l.bean_id),
        menu_item_id = text(l.menu_item_id);
      if (!beans.has(bean_id) || !menu.has(menu_item_id))
        throw Error("invalid_response");
      return { bean_id, menu_item_id };
    }),
    (l) => l.bean_id + "\0" + l.menu_item_id,
  );
  return {
    items,
    now: time(x.now),
    can_manage_beans: x.can_manage_beans,
    menu_items,
    links,
  };
}
export function normalizeEntry(v: unknown): HistoryEntry {
  const x = object(v);
  if (
    !validBeanId(x.bean_id) ||
    !["set", "delta"].includes(String(x.mode)) ||
    typeof x.reason !== "string"
  )
    throw Error("invalid_response");
  const amount = quantity(x.quantity_kg, false, true)!,
    before = quantity(x.before_kg, true),
    after = quantity(x.after_kg)!;
  if (
    (x.mode === "set" && amount.startsWith("-")) ||
    (x.mode === "delta" && before === null)
  )
    throw Error("invalid_response");
  const delta = amount.startsWith("-")
    ? -parseKilograms(amount.slice(1))!
    : parseKilograms(amount)!;
  if (
    (x.mode === "set" ? delta : parseKilograms(before!)! + delta) !==
    parseKilograms(after)
  )
    throw Error("invalid_response");
  return {
    id: text(x.id),
    bean_id: x.bean_id,
    mode: x.mode as HistoryEntry["mode"],
    quantity_kg: amount,
    before_kg: before,
    after_kg: after,
    revision: integer(x.revision, 1),
    request_id: text(x.request_id),
    actor_id: text(x.actor_id),
    reason: x.reason,
    created_at: time(x.created_at),
  };
}
export function normalizeHistory(v: unknown): HistoryPage {
  const x = object(v);
  if (typeof x.has_more !== "boolean") throw Error("invalid_response");
  const entries = unique(list(x.entries, normalizeEntry), (e) => e.id);
  const cursor =
    x.next_before_revision === null ? null : integer(x.next_before_revision, 1);
  if (
    (x.has_more && (cursor === null || !entries.length)) ||
    (!x.has_more && cursor !== null)
  )
    throw Error("invalid_response");
  return { entries, has_more: x.has_more, next_before_revision: cursor };
}
export function normalizeAdjustment(v: unknown): AdjustmentResult {
  const x = object(v),
    item = normalizeItem(x.item),
    adjustment = normalizeEntry(x.adjustment);
  if (
    item.id !== adjustment.bean_id ||
    item.revision !== adjustment.revision ||
    item.quantity_kg === null ||
    parseKilograms(item.quantity_kg) !== parseKilograms(adjustment.after_kg)
  )
    throw Error("invalid_response");
  return { item, adjustment };
}
function requestId(v: unknown): boolean {
  return (
    typeof v === "string" && v.length >= 1 && v.length <= 128 && v.trim() === v
  );
}
export function validAdjustmentPayload(v: unknown): v is AdjustmentPayload {
  try {
    const p = object(v);
    if (
      Object.keys(p).some(
        (k) =>
          ![
            "mode",
            "quantity_kg",
            "expected_revision",
            "request_id",
            "reason",
          ].includes(k),
      )
    )
      return false;
    quantity(p.quantity_kg, false, p.mode === "delta");
    return (
      ["set", "delta"].includes(String(p.mode)) &&
      integer(p.expected_revision) >= 0 &&
      requestId(p.request_id) &&
      (p.reason === undefined ||
        (typeof p.reason === "string" &&
          new TextEncoder().encode(p.reason).length <= 500))
    );
  } catch {
    return false;
  }
}
export function validLinksPayload(v: unknown): v is LinksPayload {
  try {
    const p = object(v);
    return (
      !Object.keys(p).some(
        (k) =>
          !["menu_item_ids", "expected_menu_item_ids", "request_id"].includes(
            k,
          ),
      ) &&
      [ids(p.menu_item_ids), ids(p.expected_menu_item_ids)].every(
        (a) =>
          a.length <= 200 && a.every((s) => s.trim() === s && s.length <= 160),
      ) &&
      requestId(p.request_id)
    );
  } catch {
    return false;
  }
}
