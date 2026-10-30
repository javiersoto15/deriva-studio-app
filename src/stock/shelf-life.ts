import type { StockItem, StockLot, StockShelfLife } from "./types";
import { formatCount, unitShort } from "./editor";

/**
 * Pastry shelf life lives behind the count (design: docs/plans/2026-10-24-
 * pastry-shelf-life-design.md). The backend owns lots and states; this module
 * only words them and previews what a draft adjustment will do to them.
 */

const TIME_ZONE = "America/Santiago";
const DAY_MS = 86_400_000;
const NANOS_PER_MILLISECOND = 1_000_000n;
const NANOS_PER_MINUTE = 60_000_000_000n;
const NANOS_PER_HOUR = 60n * NANOS_PER_MINUTE;
const NANOS_PER_DAY = 24n * NANOS_PER_HOUR;

export const EXPIRED_REASON = "Merma · vencido";

const weekdayTime = new Intl.DateTimeFormat("es-CL", {
  timeZone: TIME_ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});
const weekdayDay = new Intl.DateTimeFormat("es-CL", { timeZone: TIME_ZONE, weekday: "short", day: "numeric" });
const expiryMomentFormat = new Intl.DateTimeFormat("es-CL", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});
const expiryYearFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric" });

function clean(text: string): string {
  return text.replace(/\./g, "").replace(",", "");
}

/** "mié 08:40" — when a lot entered the barra. */
export function formatLotMoment(value: string | Date): string {
  return clean(weekdayTime.format(typeof value === "string" ? new Date(value) : value));
}

/** "lun 26" — a deadline day. */
export function formatLotDay(value: string | Date): string {
  return clean(weekdayDay.format(typeof value === "string" ? new Date(value) : value));
}

export type ShelfTone = "discard" | "sell_first" | "unknown" | "fresh";

export type ShelfStatus = { tone: ShelfTone; text: string };

export type ExpiryBreakdownTone = "expired" | "upcoming" | "unknown" | "unavailable";

export type ExpiryBreakdownEntry = {
  key: string;
  quantity: number;
  detail: string;
  action: string | null;
  tone: ExpiryBreakdownTone;
};

function earliest(lots: readonly StockLot[], state: StockLot["state"], field: "entered_at" | "fresh_until" | "discard_at") {
  return lots
    .filter((lot) => lot.state === state && lot[field])
    .map((lot) => lot[field] as string)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
}

/**
 * The single line a pastry row shows under its name, worst state first:
 * "Retirar 2 · entró mié 08:40", "Vender primero 2 · retirar lun 26",
 * "Último día de venta", "3 sin fecha de entrada", "Fresca · vender antes lun 26".
 * Returns null when nothing is in the barra.
 */
export function shelfStatus(shelf: StockShelfLife): ShelfStatus | null {
  const { counts, lots } = shelf;
  if (counts.discard > 0) {
    const entered = earliest(lots, "discard", "entered_at");
    return { tone: "discard", text: `Retirar ${counts.discard}${entered ? ` · entró ${formatLotMoment(entered)}` : ""}` };
  }
  if (counts.sell_first > 0) {
    const discardAt = earliest(lots, "sell_first", "discard_at");
    const lead = shelf.last_sale_day ? "Vender hoy" : "Vender primero";
    return { tone: "sell_first", text: `${lead} ${counts.sell_first}${discardAt ? ` · retirar ${formatLotDay(discardAt)}` : ""}` };
  }
  if (shelf.last_sale_day && counts.fresh > 0) {
    return { tone: "sell_first", text: "Último día de venta" };
  }
  if (counts.unknown > 0) {
    return { tone: "unknown", text: `${counts.unknown} sin fecha de entrada` };
  }
  if (counts.fresh > 0) {
    const freshUntil = earliest(lots, "fresh", "fresh_until");
    return { tone: "fresh", text: `Fresca${freshUntil ? ` · vender antes ${formatLotDay(freshUntil)}` : ""}` };
  }
  return null;
}

type ExactInstant = {
  epochMilliseconds: number;
  subMillisecondNanoseconds: bigint;
  date: Date;
};

function parseExactInstant(value: string | Date | null | undefined): ExactInstant | null {
  if (value instanceof Date) {
    const epochMilliseconds = value.getTime();
    return Number.isFinite(epochMilliseconds)
      ? { epochMilliseconds, subMillisecondNanoseconds: 0n, date: value }
      : null;
  }
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/i.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, fraction = "", offset] = match;
  if (fraction.length > 9) return null;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);
  const secondNumber = Number(second);
  const offsetMatch = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  const offsetHour = offsetMatch ? Number(offsetMatch[2]) : 0;
  const offsetMinute = offsetMatch ? Number(offsetMatch[3]) : 0;
  const daysInMonth = new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();
  if (
    monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > daysInMonth ||
    hourNumber > 23 || minuteNumber > 59 || secondNumber > 59 ||
    (offsetMatch !== null && (offsetHour > 23 || offsetMinute > 59))
  ) return null;

  const epochMilliseconds = Date.parse(value);
  if (!Number.isFinite(epochMilliseconds)) return null;
  const normalizedFraction = fraction.padEnd(9, "0");
  const subMillisecondNanoseconds = BigInt(normalizedFraction.slice(3) || "0");
  return {
    epochMilliseconds,
    subMillisecondNanoseconds,
    date: new Date(epochMilliseconds)
  };
}

function instantNanoseconds(instant: ExactInstant): bigint {
  return BigInt(instant.epochMilliseconds) * NANOS_PER_MILLISECOND + instant.subMillisecondNanoseconds;
}

function formatExpiryMoment(deadline: Date, snapshotNow: Date): string {
  const parts = Object.fromEntries(expiryMomentFormat.formatToParts(deadline).map((part) => [part.type, part.value]));
  const snapshotYear = expiryYearFormat.format(snapshotNow);
  const year = parts.year === snapshotYear ? "" : ` ${parts.year}`;
  return `${clean(parts.weekday)} ${parts.day} ${clean(parts.month)}${year}, ${parts.hour}:${parts.minute}`;
}

function formatRemaining(remainingNanoseconds: bigint): { text: string; verb: "queda" | "quedan" } {
  if (remainingNanoseconds < NANOS_PER_MINUTE) return { text: "menos de 1 min", verb: "queda" };
  if (remainingNanoseconds < NANOS_PER_HOUR) {
    const minutes = remainingNanoseconds / NANOS_PER_MINUTE;
    return { text: `${minutes} min`, verb: minutes === 1n ? "queda" : "quedan" };
  }
  if (remainingNanoseconds < NANOS_PER_DAY) {
    const hours = remainingNanoseconds / NANOS_PER_HOUR;
    const minutes = (remainingNanoseconds % NANOS_PER_HOUR) / NANOS_PER_MINUTE;
    return {
      text: `${hours} h${minutes > 0n ? ` ${minutes} min` : ""}`,
      verb: hours === 1n ? "queda" : "quedan"
    };
  }
  const days = remainingNanoseconds / NANOS_PER_DAY;
  const hours = (remainingNanoseconds % NANOS_PER_DAY) / NANOS_PER_HOUR;
  return {
    text: `${days} d${hours > 0n ? ` ${hours} h` : ""}`,
    verb: days === 1n ? "queda" : "quedan"
  };
}

/**
 * Details every positive open lot by its exact discard instant. Unknown-age
 * lots stay undated, and no client clock is substituted for a missing snapshot
 * timestamp.
 */
export function expiryBreakdown(
  shelf: StockShelfLife,
  snapshotNow: string | Date | null | undefined,
  unit: StockItem["unit"] = "unit"
): ExpiryBreakdownEntry[] {
  const parsedNow = parseExactInstant(snapshotNow);
  const known = new Map<string, { deadline: ExactInstant; quantity: number; hasDiscardState: boolean }>();
  let unknownQuantity = 0;
  let unavailableQuantity = 0;

  for (const lot of shelf.lots) {
    if (lot.quantity_left <= 0) continue;
    const enteredAt = parseExactInstant(lot.entered_at);
    if (lot.state === "unknown" || !enteredAt) {
      unknownQuantity += lot.quantity_left;
      continue;
    }
    const deadline = parseExactInstant(lot.discard_at);
    if (!deadline) {
      unavailableQuantity += lot.quantity_left;
      continue;
    }
    const key = `${deadline.epochMilliseconds}:${deadline.subMillisecondNanoseconds}`;
    const previous = known.get(key);
    if (previous) {
      previous.quantity += lot.quantity_left;
      previous.hasDiscardState ||= lot.state === "discard";
    } else {
      known.set(key, { deadline, quantity: lot.quantity_left, hasDiscardState: lot.state === "discard" });
    }
  }

  const entries: ExpiryBreakdownEntry[] = [];
  if (parsedNow) {
    const nowNanoseconds = instantNanoseconds(parsedNow);
    const ordered = [...known.entries()].sort(([, a], [, b]) => {
      if (a.deadline.epochMilliseconds !== b.deadline.epochMilliseconds) {
        return a.deadline.epochMilliseconds - b.deadline.epochMilliseconds;
      }
      if (a.deadline.subMillisecondNanoseconds < b.deadline.subMillisecondNanoseconds) return -1;
      if (a.deadline.subMillisecondNanoseconds > b.deadline.subMillisecondNanoseconds) return 1;
      return 0;
    });

    for (const [key, bucket] of ordered) {
      const remainingNanoseconds = instantNanoseconds(bucket.deadline) - nowNanoseconds;
      const deadlinePassed = remainingNanoseconds <= 0n;
      const past = bucket.hasDiscardState || deadlinePassed;
      const quantityText = `${formatCount(bucket.quantity)} ${unitShort(unit)} · `;
      const remaining = past ? null : formatRemaining(remainingNanoseconds);
      const deadlineText = formatExpiryMoment(bucket.deadline.date, parsedNow.date);
      entries.push({
        key: `deadline:${key}`,
        quantity: bucket.quantity,
        detail: past
          ? `${quantityText}${bucket.quantity === 1 ? "vencida" : "vencidas"}, retirar ahora`
          : `${quantityText}${remaining?.verb} ${remaining?.text}`,
        action: bucket.hasDiscardState && !deadlinePassed
          ? `Plazo registrado: ${deadlineText}`
          : `${past ? "Venció" : "Retirar"} ${deadlineText}`,
        tone: past ? "expired" : "upcoming"
      });
    }
  } else {
    for (const [key, bucket] of known) {
      entries.push({
        key: `deadline:${key}`,
        quantity: bucket.quantity,
        detail: `${formatCount(bucket.quantity)} ${unitShort(unit)} · plazo no disponible`,
        action: null,
        tone: "unavailable"
      });
    }
  }

  if (unknownQuantity > 0) {
    entries.push({
      key: "unknown-age",
      quantity: unknownQuantity,
      detail: `${formatCount(unknownQuantity)} ${unitShort(unit)} · sin fecha de entrada`,
      action: null,
      tone: "unknown"
    });
  }
  if (unavailableQuantity > 0) {
    entries.push({
      key: "unavailable-deadline",
      quantity: unavailableQuantity,
      detail: `${formatCount(unavailableQuantity)} ${unitShort(unit)} · plazo no disponible`,
      action: null,
      tone: "unavailable"
    });
  }
  return entries;
}

/**
 * Whether a row belongs in "Solo por vencer".
 *
 * TODO(founder): decide what "por vencer" means for the barra. Available
 * signals on `shelf`: counts.discard (past retirar), counts.sell_first (past
 * fresca, before retirar), last_sale_day (closed until after a deadline, so
 * today is the last sale day), counts.unknown (backfilled stock with no
 * entry date yet). Today only must-retire stock is included.
 */
export function needsAttention(shelf: StockShelfLife): boolean {
  return shelf.counts.discard > 0;
}

export function filterExpiring(items: readonly StockItem[]): StockItem[] {
  return items.filter((item) => item.shelf_life !== undefined && needsAttention(item.shelf_life));
}

export function countExpiring(items: readonly StockItem[]): number {
  return filterExpiring(items).length;
}

export type LotTake = { lot: StockLot; take: number; left: number };

export type LotPreview =
  | { kind: "none" }
  | { kind: "enter"; quantity: number; freshUntil: Date; discardAt: Date }
  | { kind: "consume"; takes: LotTake[]; expiredTaken: number };

/**
 * What saving a draft does to the lots, computed the way the backend does it:
 * an increase is one new lot dated now with the group's current days (elapsed
 * 24-hour days); a decrease consumes lots in the order the backend sent them
 * (FIFO by entry, unknown age last).
 */
export function previewLots(
  shelf: StockShelfLife,
  before: number | null,
  after: number,
  now: Date
): LotPreview {
  const delta = after - (before ?? 0);
  if (delta > 0) {
    return {
      kind: "enter",
      quantity: delta,
      freshUntil: new Date(now.getTime() + shelf.fresh_days * DAY_MS),
      discardAt: new Date(now.getTime() + shelf.discard_days * DAY_MS)
    };
  }
  if (delta < 0) {
    let remaining = -delta;
    let expiredTaken = 0;
    const takes: LotTake[] = [];
    for (const lot of shelf.lots) {
      if (remaining === 0) break;
      const take = Math.min(remaining, lot.quantity_left);
      if (take === 0) continue;
      remaining -= take;
      if (lot.state === "discard") expiredTaken += take;
      takes.push({ lot, take, left: lot.quantity_left - take });
    }
    return { kind: "consume", takes, expiredTaken };
  }
  return { kind: "none" };
}

/** Restar draft that retires exactly the expired units. */
export function retireExpiredDraft(shelf: StockShelfLife): { mode: "subtract"; amount: string; reason: string } | null {
  if (shelf.counts.discard === 0) return null;
  return { mode: "subtract", amount: String(shelf.counts.discard), reason: EXPIRED_REASON };
}

/** `datetime-local` value in the café's zone, e.g. "2026-10-24T08:40". */
export function toLocalInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Read a `datetime-local` value as café time (not the device's zone) and
 * return the UTC instant. Santiago's offset is found by round-tripping, so
 * daylight-saving changes are handled without a time-zone library.
 */
export function fromLocalInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  let guess = asUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const shown = toLocalInputValue(new Date(guess));
    const [, sy, smo, sd, sh, smi] = (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(shown) ?? []).map(Number);
    const offset = Date.UTC(sy, smo - 1, sd, sh, smi) - guess;
    guess = asUtc - offset;
  }
  return new Date(guess);
}
