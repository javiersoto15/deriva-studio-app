import type { components } from "../api/schema";

export type StockItem = components["schemas"]["StockItem"];
export type StockItemKind = StockItem["kind"];
export type StockSnapshot = components["schemas"]["StockListResponse"];
export type StockHistoryEntry = components["schemas"]["StockHistoryEntry"];
export type StockHistoryPage = {
  entries: StockHistoryEntry[];
  has_more: boolean;
  next_before_revision: number | null;
};
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

export type StockShelfLife = components["schemas"]["StockShelfLife"];
export type StockShelfLifeSummary = components["schemas"]["StockShelfLifeSummary"];
export type StockLot = components["schemas"]["StockLot"];
export type StockLotState = StockLot["state"];
export type StockLotAffected = components["schemas"]["StockLotAffected"];
export type StockShelfLifeConfiguration = components["schemas"]["StockShelfLifeConfiguration"];
export type StockShelfLifeGroup = components["schemas"]["StockShelfLifeGroup"];
export type StockShelfLifeGroupCreatePayload = components["schemas"]["StockShelfLifeGroupCreateRequest"];
export type StockShelfLifeGroupUpdatePayload = components["schemas"]["StockShelfLifeGroupUpdateRequest"];
export type StockLotDatePayload = components["schemas"]["StockLotDateRequest"];
export type StockLotDateResult = components["schemas"]["StockLotDateResponse"];
