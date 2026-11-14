import {
  normalizeName,
  parseQuantity,
  previewCount,
  formatAmount,
  formatMoment,
} from "../kitchen-stock/model";
import {
  EXPECTED_WITHDRAWAL_TAKERS,
  LOCATIONS,
  type SalonItem,
  type Location,
  type Mode,
  type Observation,
  type Snapshot,
  type Movement,
  type ItemHistoryPage,
  type WithdrawalPage,
  type MutationResult,
} from "./types";
export {
  normalizeName,
  parseQuantity,
  previewCount,
  formatAmount,
  formatMoment,
};
export const locationLabel = (id: Location) =>
  LOCATIONS.find((x) => x.id === id)!.label;
export function adjustmentModes(location: Location): Mode[] {
  return location === "fridge" ? ["set", "add", "subtract"] : ["add", "set"];
}
export function countLabel(item: SalonItem): string {
  return item.quantity === null
    ? "Sin contar"
    : `${formatAmount(item.quantity)}${item.unit ? " " + item.unit : " · base de conteo sin unidad indicada"}`;
}
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        row[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    previous = row;
  }
  return previous[b.length];
}
export function findMatches(
  items: SalonItem[],
  location: Location,
  query: string,
): SalonItem[] {
  const q = normalizeName(query);
  if (!q) return [];
  return items
    .filter((x) => x.location === location)
    .map((item) => {
      const n = normalizeName(item.name);
      return {
        item,
        rank:
          n === q
            ? 0
            : n.includes(q)
              ? 1
              : q.length >= 4 && distance(n, q) <= 2
                ? 2
                : 99,
      };
    })
    .filter((x) => x.rank < 99)
    .sort(
      (a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name, "es"),
    )
    .slice(0, 8)
    .map((x) => x.item);
}
export function prepareWithdrawal(input: {
  items: SalonItem[];
  location: string;
  itemId: string;
  taker: string;
  amount: string;
  takers: string[];
}): { item: SalonItem; amount: string; after: string } | null {
  if (
    (input.location !== "storage" && input.location !== "cleaning") ||
    !input.itemId ||
    !input.takers.includes(input.taker)
  )
    return null;
  const item = input.items.find(
    (x) => x.id === input.itemId && x.location === input.location,
  );
  const amount = parseQuantity(input.amount);
  if (!item || item.quantity === null || amount === null || amount === "0")
    return null;
  const after = previewCount(item.quantity, "subtract", amount);
  return after === null ? null : { item, amount, after };
}
export function formatObservation(observation: Observation): string {
  if (observation.precision === "exact" && observation.observed_at)
    return formatMoment(observation.observed_at);
  if (observation.date) {
    const date = observation.date.split("-").reverse().join("/");
    return observation.period === "morning"
      ? `${date} · mañana (sin hora exacta)`
      : `${date} (sin hora exacta)`;
  }
  return "Fecha de conteo no informada";
}
export function operatorNotes(item: SalonItem): string[] {
  return item.source_notes.filter(
    (note) =>
      !/(?:\bnull\b|source_(?:section|row)|relayed|no (?:inferir|inventar|convertir)|categoría propuesta|se normaliza)/i.test(
        note,
      ),
  );
}
export function formatShare(snapshot: Snapshot): string {
  const lines = [
    "Stock Salón",
    `Consultado: ${formatMoment(snapshot.now)}`,
    "Saldos guardados; conteos físicos indicados por separado.",
  ];
  if (snapshot.items.some((x) => x.unit === null))
    lines.push("Cantidades sin unidad: base del conteo original.");
  for (const loc of LOCATIONS) {
    const items = snapshot.items.filter((x) => x.location === loc.id);
    if (!items.length) continue;
    lines.push("", loc.label.toUpperCase());
    const observations = new Set(
      items.map((x) => formatObservation(x.observation)),
    );
    if (observations.size === 1)
      lines.push(`Conteo físico: ${formatObservation(items[0].observation)}`);
    const categories = [...new Set(items.map((x) => x.category))];
    for (const category of categories) {
      const group = items.filter((x) => x.category === category);
      lines.push("", group[0].category_label.toUpperCase());
      for (const item of group) {
        lines.push(
          `${item.name}: ${item.quantity === null ? "Sin contar" : formatAmount(item.quantity) + (item.unit ? " " + item.unit : "")}${item.package_note ? " (" + item.package_note + ")" : ""}${observations.size > 1 ? " · Conteo físico: " + formatObservation(item.observation) : ""}`,
        );
        for (const note of operatorNotes(item))
          if (note.trim() && !item.package_note.includes(note))
            lines.push(`  Nota: ${note}`);
        const unseen = item.source_markers.filter(
          (m) => !item.name.includes(m),
        );
        if (unseen.length)
          lines.push(
            `  Marca del original: ${unseen.join(" ")} (significado no confirmado)`,
          );
      }
    }
  }
  return lines.join("\n");
}
export const whatsappUrl = (message: string) =>
  `https://wa.me/?text=${encodeURIComponent(message)}`;
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Invalid salon response");
  return v as Record<string, unknown>;
}
const dateTime = (v: unknown): v is string =>
  typeof v === "string" && Number.isFinite(Date.parse(v));
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const nullableString = (v: unknown) => v === null || typeof v === "string";
const quantity = (v: unknown) =>
  typeof v === "string" && parseQuantity(v) !== null;
function dateOnly(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(v + "T00:00:00Z");
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}
export function normalizeObservation(v: unknown): Observation {
  const x = object(v);
  if (
    !["unknown", "date", "date_and_period", "exact"].includes(
      String(x.precision),
    ) ||
    !nullableString(x.source) ||
    (x.observed_at !== null && !dateTime(x.observed_at)) ||
    (x.date !== null && !dateOnly(x.date)) ||
    (x.period !== null && x.period !== "morning") ||
    (x.precision === "exact" && !dateTime(x.observed_at)) ||
    (x.precision === "date" && !dateOnly(x.date)) ||
    (x.precision === "date_and_period" &&
      (!dateOnly(x.date) || x.period !== "morning")) ||
    (x.precision === "unknown" &&
      (x.observed_at !== null || x.date !== null || x.period !== null))
  )
    throw Error("Invalid source observation");
  return x as Observation;
}
export function normalizeItem(v: unknown): SalonItem {
  const x = object(v);
  if (
    typeof x.id !== "string" ||
    !/^salon_[A-Za-z0-9_-]+$/.test(x.id) ||
    typeof x.name !== "string" ||
    !x.name.trim() ||
    !LOCATIONS.some((l) => l.id === x.location) ||
    typeof x.category !== "string" ||
    !x.category ||
    typeof x.category_label !== "string" ||
    !x.category_label ||
    typeof x.category_is_inferred !== "boolean" ||
    !nullableString(x.unit) ||
    typeof x.package_note !== "string" ||
    !strings(x.source_markers) ||
    !strings(x.source_notes) ||
    typeof x.source_line !== "string" ||
    typeof x.source_row_id !== "string" ||
    !nullableString(x.source_section) ||
    (x.quantity !== null && !quantity(x.quantity)) ||
    !Number.isSafeInteger(x.revision) ||
    (x.revision as number) < 0 ||
    !dateTime(x.updated_at)
  )
    throw Error("Invalid salon item");
  normalizeObservation(x.observation);
  return x as SalonItem;
}
export function normalizeSnapshot(v: unknown): Snapshot {
  const x = object(v);
  if (
    !Array.isArray(x.items) ||
    !dateTime(x.now) ||
    !strings(x.withdrawal_takers) ||
    x.withdrawal_takers.length !== 10 ||
    new Set(x.withdrawal_takers).size !== 10 ||
    x.withdrawal_takers.some((n, i) => n !== EXPECTED_WITHDRAWAL_TAKERS[i])
  )
    throw Error("Invalid salon snapshot");
  const items = x.items.map(normalizeItem);
  if (new Set(items.map((i) => i.id)).size !== items.length)
    throw Error("Duplicate salon item id");
  return { items, now: x.now, withdrawal_takers: x.withdrawal_takers };
}
export function normalizeMovement(v: unknown): Movement {
  const x = object(v);
  if (
    typeof x.id !== "string" ||
    !x.id ||
    !Number.isSafeInteger(x.sequence) ||
    (x.sequence as number) < 1 ||
    typeof x.item_id !== "string" ||
    !/^salon_[A-Za-z0-9_-]+$/.test(x.item_id) ||
    typeof x.item_name !== "string" ||
    !x.item_name ||
    !LOCATIONS.some((l) => l.id === x.location) ||
    !nullableString(x.unit) ||
    !["initial_count", "receipt", "count_correction", "withdrawal"].includes(
      String(x.kind),
    ) ||
    !["set", "add", "subtract"].includes(String(x.mode)) ||
    !quantity(x.amount) ||
    (x.before !== null && !quantity(x.before)) ||
    !quantity(x.after) ||
    !Number.isSafeInteger(x.revision) ||
    (x.revision as number) < 1 ||
    !nullableString(x.taker) ||
    typeof x.actor !== "string" ||
    !x.actor ||
    typeof x.reason !== "string" ||
    !dateTime(x.created_at) ||
    (x.kind === "withdrawal" &&
      (x.location === "fridge" ||
        x.mode !== "subtract" ||
        typeof x.taker !== "string" ||
        !x.taker)) ||
    (x.kind !== "withdrawal" && x.taker !== null)
  )
    throw Error("Invalid salon movement");
  return x as Movement;
}
export function normalizeMovementPage(
  v: unknown,
  kind: "item",
): ItemHistoryPage;
export function normalizeMovementPage(
  v: unknown,
  kind: "withdrawals",
): WithdrawalPage;
export function normalizeMovementPage(
  v: unknown,
  kind: "item" | "withdrawals",
): ItemHistoryPage | WithdrawalPage {
  const x = object(v);
  if (!Array.isArray(x.entries) || typeof x.has_more !== "boolean")
    throw Error("Invalid salon history");
  const entries = x.entries.map(normalizeMovement);
  const key = kind === "item" ? "next_before_revision" : "next_before_sequence";
  const cursor = x[key];
  if (
    (cursor !== null &&
      (!Number.isSafeInteger(cursor) || (cursor as number) < 1)) ||
    (x.has_more && (entries.length === 0 || cursor === null)) ||
    (!x.has_more && cursor !== null)
  )
    throw Error("Invalid salon history cursor");
  for (let i = 0; i < entries.length; i++) {
    if (kind === "withdrawals" && entries[i].kind !== "withdrawal")
      throw Error("Unexpected non-withdrawal event");
    if (
      i &&
      entries[i][kind === "item" ? "revision" : "sequence"] >=
        entries[i - 1][kind === "item" ? "revision" : "sequence"]
    )
      throw Error("Unordered salon history");
  }
  if (
    x.has_more &&
    cursor !== entries.at(-1)![kind === "item" ? "revision" : "sequence"]
  )
    throw Error("Invalid next history cursor");
  return { ...x, entries } as ItemHistoryPage | WithdrawalPage;
}
export function normalizeMutation(v: unknown): MutationResult {
  const x = object(v);
  const item = normalizeItem(x.item);
  const movement = x.movement === null ? null : normalizeMovement(x.movement);
  if (
    movement &&
    (movement.item_id !== item.id ||
      movement.revision !== item.revision ||
      movement.after !== item.quantity)
  )
    throw Error("Inconsistent salon mutation");
  return { item, movement };
}
