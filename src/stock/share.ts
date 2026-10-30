import type { StockHistoryPage, StockItem } from "./types";
import { expiryBreakdown } from "./shelf-life";

const STOCK_TIME_ZONE = "America/Santiago";
const stockCount = new Intl.NumberFormat("es-CL");
const stockDate = new Intl.DateTimeFormat("en-US", {
  timeZone: STOCK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const HISTORY_PAGE_LIMIT = 100;
const MAX_HISTORY_PAGES = 10;
const MAX_HISTORY_CONCURRENCY = 4;
const headingParts = new Intl.DateTimeFormat("en-US", {
  timeZone: STOCK_TIME_ZONE,
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

function formatHeading(date: Date): string {
  const parts = Object.fromEntries(headingParts.formatToParts(date).map((part) => [part.type, part.value]));
  const hour = Number(parts.hour);
  const period = hour < 12 ? "AM" : "PM";
  return `Inventario ${period} ${parts.day}/${parts.month} · ${parts.hour}:${parts.minute}`;
}

function formatKnownItem(item: StockItem): string | null {
  if (item.quantity === null || item.quantity === 0) return null;
  const quantity = stockCount.format(item.quantity);

  switch (item.unit) {
    case "unit":
      return `${quantity} × ${item.name}`;
    case "portion":
      return `${quantity} ${item.quantity === 1 ? "porción" : "porciones"} de ${item.name}`;
    case "pack":
      return `${quantity} ${item.quantity === 1 ? "paquete" : "paquetes"} de ${item.name}`;
    case "box":
      return `${quantity} ${item.quantity === 1 ? "caja" : "cajas"} de ${item.name}`;
    case "g":
    case "kg":
    case "ml":
    case "l":
      return `${quantity} ${item.unit} de ${item.name}`;
  }
}

function missingItemsLine(count: number): string | null {
  if (count === 0) return null;
  return count === 1
    ? "1 artículo sin contar, no incluido."
    : `${stockCount.format(count)} artículos sin contar, no incluidos.`;
}

export type StockSharePreview = {
  heading: string;
  lines: string[];
  knownCount: number;
  uncountedCount: number;
  message: string;
};

export type StockHistoryPageRequest = { limit: number; beforeRevision: number };
export type StockHistoryPageReader = (
  stockId: string,
  request: StockHistoryPageRequest
) => Promise<StockHistoryPage>;

function santiagoDateKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) throw new Error("Stock history has an invalid timestamp");
  const parts = Object.fromEntries(stockDate.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function validateHistoryPage(
  page: StockHistoryPage,
  stockId: string,
  itemRevision: number,
  beforeRevision: number
): void {
  if (!page || !Array.isArray(page.entries) || typeof page.has_more !== "boolean") {
    throw new Error("Stock history page is invalid");
  }
  if (page.entries.length > HISTORY_PAGE_LIMIT) throw new Error("Stock history page exceeded its limit");
  let previousRevision = beforeRevision;
  for (const entry of page.entries) {
    if (
      entry.stock_id !== stockId ||
      !Number.isSafeInteger(entry.revision) ||
      entry.revision < 1 ||
      entry.revision >= beforeRevision ||
      entry.revision > itemRevision ||
      entry.revision >= previousRevision
    ) {
      throw new Error("Stock history page has invalid revisions");
    }
    previousRevision = entry.revision;
  }

  if (!page.has_more) {
    if (page.next_before_revision !== null) throw new Error("Stock history cursor is invalid");
    return;
  }
  const last = page.entries.at(-1);
  if (
    !last ||
    !Number.isSafeInteger(page.next_before_revision) ||
    page.next_before_revision !== last.revision ||
    page.next_before_revision >= beforeRevision
  ) {
    throw new Error("Stock history pagination did not make progress");
  }
}

async function hasSameDayDepletion(
  item: StockItem,
  readAt: Date,
  readPage: StockHistoryPageReader
): Promise<boolean> {
  const snapshotDate = santiagoDateKey(readAt);
  let beforeRevision = item.revision + 1;
  if (!Number.isSafeInteger(beforeRevision)) throw new Error("Stock snapshot revision is invalid");

  for (let pageNumber = 0; pageNumber < MAX_HISTORY_PAGES; pageNumber += 1) {
    const page = await readPage(item.id, { limit: HISTORY_PAGE_LIMIT, beforeRevision });
    validateHistoryPage(page, item.id, item.revision, beforeRevision);
    for (const entry of page.entries) {
      const createdAt = new Date(entry.created_at);
      const createdTime = createdAt.getTime();
      if (!Number.isFinite(createdTime)) throw new Error("Stock history has an invalid timestamp");
      if (createdTime > readAt.getTime()) continue;
      const entryDate = santiagoDateKey(createdAt);
      if (entryDate < snapshotDate) return false;
      if (entryDate === snapshotDate && entry.before_quantity !== null && entry.before_quantity > 0 && entry.after_quantity === 0) {
        return true;
      }
    }
    if (!page.has_more) return false;
    if (pageNumber === MAX_HISTORY_PAGES - 1) throw new Error("Stock history exceeded the scan limit");
    beforeRevision = page.next_before_revision as number;
  }
  return false;
}

/** Scans saved history only for current zero counts and fails closed on incomplete pages. */
export async function findSameDayDepletionIds(
  items: readonly StockItem[],
  readAt: Date,
  readPage: StockHistoryPageReader
): Promise<Set<string>> {
  const candidates = items.filter((item) => item.quantity === 0);
  const depletedIds = new Set<string>();
  let nextCandidate = 0;
  let failure: unknown;

  const worker = async () => {
    while (failure === undefined) {
      const index = nextCandidate++;
      const item = candidates[index];
      if (!item) return;
      try {
        if (await hasSameDayDepletion(item, readAt, readPage)) depletedIds.add(item.id);
      } catch (error) {
        failure = error;
        return;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(MAX_HISTORY_CONCURRENCY, candidates.length) }, () => worker()));
  if (failure !== undefined) throw failure;
  return depletedIds;
}

/** Builds the staff message from an unfiltered, newly read stock snapshot. */
export function formatStockShare(
  items: readonly StockItem[],
  readAt: Date,
  depletedIds: ReadonlySet<string> = new Set(),
  expiryNow: string | Date = readAt
): StockSharePreview {
  const positiveItems = items.flatMap((item) => {
    if (item.quantity === null || item.quantity === 0) return [];
    const line = formatKnownItem(item);
    if (line === null) return [];
    const details = item.shelf_life
      ? expiryBreakdown(item.shelf_life, expiryNow, item.unit).flatMap((entry) => [
          `  ${entry.detail}`,
          ...(entry.action ? [`  ${entry.action}`] : [])
        ])
      : [];
    return [{ line, details }];
  });
  const depletedLines = items.flatMap((item) =>
    item.quantity === 0 && depletedIds.has(item.id) ? [`Se acabó ${item.name}`] : []
  );
  const lines = [
    ...positiveItems.flatMap(({ line, details }) => [line, ...details]),
    ...depletedLines
  ];
  const uncountedCount = items.filter((item) => item.quantity === null).length;
  const heading = formatHeading(readAt);
  const missingLine = missingItemsLine(uncountedCount);

  // Ordinary zero counts stay omitted; only evidence-backed depletion is shareable.
  const message = lines.length === 0
    ? ""
    : [heading, "", ...lines, ...(missingLine ? ["", missingLine] : [])].join("\n");

  return {
    heading,
    lines,
    knownCount: positiveItems.length + depletedLines.length,
    uncountedCount,
    message
  };
}

/** WhatsApp opens recipient selection; staff review and send the message themselves. */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
