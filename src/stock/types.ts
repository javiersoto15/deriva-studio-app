import type { components } from "../api/schema";

export type StockItem = components["schemas"]["StockItem"];
export type StockItemKind = StockItem["kind"];
export type StockSnapshot = components["schemas"]["StockListResponse"];
export type StockHistoryEntry = components["schemas"]["StockHistoryEntry"];
export type StockAdjustmentPayload = components["schemas"]["StockAdjustmentRequest"];
export type StockAdjustmentMode = StockAdjustmentPayload["mode"];
export type CreateRawItemPayload = components["schemas"]["StockRawItemRequest"];

export type StockApiErrorBody = {
  error?: string;
  code?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};
