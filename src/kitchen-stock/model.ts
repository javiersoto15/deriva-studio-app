import {
  CATEGORIES,
  type KitchenItem,
  type Mode,
  type Snapshot,
  type HistoryPage,
} from "./types";
const MAX_MILLI = 999_999_999_999;
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
function singular(value: string): string {
  return value
    .split(" ")
    .map((x) => (x.length > 3 ? x.replace(/es$|s$/, "") : x))
    .join(" ");
}
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = row;
  }
  return prev[b.length];
}
export function ingredientMatches(
  items: KitchenItem[],
  query: string,
): KitchenItem[] {
  const q = normalizeName(query);
  if (!q) return [];
  return items
    .map((item) => {
      const n = normalizeName(item.name);
      const score =
        n === q
          ? 0
          : singular(n) === singular(q)
            ? 1
            : n.includes(q)
              ? 2
              : q.length >= 4 && distance(n, q) <= 2
                ? 3
                : 99;
      return { item, score };
    })
    .filter((x) => x.score < 99)
    .sort(
      (a, b) =>
        a.score - b.score || a.item.name.localeCompare(b.item.name, "es"),
    )
    .slice(0, 6)
    .map((x) => x.item);
}
export function parseQuantity(value: string): string | null {
  const v = value.trim().replace(",", ".");
  if (!/^\d{1,9}(?:\.\d{1,3})?$/.test(v)) return null;
  const [whole, frac = ""] = v.split(".");
  const milli = Number(whole) * 1000 + Number(frac.padEnd(3, "0"));
  if (!Number.isSafeInteger(milli) || milli > MAX_MILLI) return null;
  return fromMilli(milli);
}
function toMilli(value: string): number {
  const [a, b = ""] = value.split(".");
  return Number(a) * 1000 + Number(b.padEnd(3, "0"));
}
function fromMilli(value: number): string {
  return `${Math.floor(value / 1000)}${
    value % 1000
      ? "." +
        String(value % 1000)
          .padStart(3, "0")
          .replace(/0+$/, "")
      : ""
  }`;
}
export function previewCount(
  before: string | null,
  mode: Mode,
  amount: string,
): string | null {
  const v = parseQuantity(amount);
  if (v === null || (mode !== "set" && before === null)) return null;
  const next =
    mode === "set"
      ? toMilli(v)
      : toMilli(before!) + (mode === "add" ? 1 : -1) * toMilli(v);
  return next >= 0 && next <= MAX_MILLI ? fromMilli(next) : null;
}
export function formatAmount(value: string | null): string {
  return value === null ? "Sin contar" : value.replace(".", ",");
}
export function countLabel(item: KitchenItem): string {
  return item.quantity === null
    ? "Sin contar"
    : `${formatAmount(item.quantity)} ${item.unit ?? "(unidad sin indicar)"}`;
}
export function formatMoment(value: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(/-/g, "/");
}
export function formatShare(items: KitchenItem[], readAt: string): string {
  const counted = items.filter((x) => x.quantity !== null);
  const dates = [
    ...new Set(
      counted.map((x) => x.counted_at).filter((x): x is string => !!x),
    ),
  ].sort();
  const lines = ["Inventario cocina", `Consultado: ${formatMoment(readAt)}`];
  if (dates.length === 1) lines.push(`Conteo: ${formatMoment(dates[0])}`);
  else if (dates.length > 1)
    lines.push("Conteos de distintas fechas; fecha junto a cada ingrediente.");
  for (const c of CATEGORIES) {
    const group = counted.filter((x) => x.category === c.id);
    if (!group.length) continue;
    lines.push("", c.label.toUpperCase());
    for (const i of group) {
      lines.push(
        `${i.name} ${countLabel(i)}${i.package_note ? ` (${i.package_note})` : ""}${dates.length > 1 && i.counted_at ? ` · ${formatMoment(i.counted_at)}` : ""}`,
      );
    }
  }
  const missing = items.length - counted.length;
  if (missing)
    lines.push(
      "",
      `Sin contar: ${missing} ingrediente${missing === 1 ? "" : "s"} (no incluidos).`,
    );
  return lines.join("\n");
}
export function whatsappUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid kitchen response");
  return value as Record<string, unknown>;
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
export function normalizeItem(value: unknown): KitchenItem {
  const r = record(value);
  if (
    typeof r.id !== "string" ||
    !r.id ||
    typeof r.name !== "string" ||
    !r.name ||
    !CATEGORIES.some((c) => c.id === r.category) ||
    (r.unit !== null && typeof r.unit !== "string") ||
    typeof r.package_note !== "string" ||
    (r.quantity !== null &&
      (typeof r.quantity !== "string" || parseQuantity(r.quantity) === null)) ||
    !Number.isSafeInteger(r.revision) ||
    (r.revision as number) < 0 ||
    (r.counted_at !== null && !validDate(r.counted_at)) ||
    !validDate(r.updated_at)
  )
    throw Error("Invalid kitchen ingredient");
  return r as KitchenItem;
}
export function normalizeSnapshot(value: unknown): Snapshot {
  const r = record(value);
  if (!Array.isArray(r.items) || !validDate(r.now))
    throw Error("Invalid kitchen snapshot");
  const items = r.items.map(normalizeItem);
  if (new Set(items.map((x) => x.id)).size !== items.length)
    throw Error("Duplicate kitchen id");
  return { items, now: r.now };
}
export function normalizeHistory(value: unknown): HistoryPage {
  const r = record(value);
  if (!Array.isArray(r.entries)) throw Error("Invalid kitchen history");
  for (const v of r.entries) {
    const e = record(v);
    if (
      typeof e.id !== "string" ||
      typeof e.item_id !== "string" ||
      typeof e.actor !== "string" ||
      typeof e.reason !== "string" ||
      !Number.isSafeInteger(e.revision) ||
      !validDate(e.created_at) ||
      (e.before !== null &&
        (typeof e.before !== "string" || parseQuantity(e.before) === null)) ||
      (e.after !== null &&
        (typeof e.after !== "string" || parseQuantity(e.after) === null))
    )
      throw Error("Invalid history entry");
  }
  return r as HistoryPage;
}
