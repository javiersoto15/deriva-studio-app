export const CATEGORIES = [
  { id: "verduras", label: "Verduras" },
  { id: "frutas", label: "Frutas" },
  { id: "otros", label: "Otros" },
  { id: "carnes", label: "Carnes" },
  { id: "bolleria", label: "Bollería" },
  { id: "pan", label: "Pan" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export type KitchenItem = {
  id: string;
  name: string;
  category: Category;
  unit: string | null;
  package_note: string;
  quantity: string | null;
  revision: number;
  counted_at: string | null;
  updated_at: string;
};
export type Snapshot = { items: KitchenItem[]; now: string };
export type Mode = "set" | "add" | "subtract";
export type CreatePayload = {
  name: string;
  category: Category;
  unit: string | null;
  package_note: string;
  quantity: string | null;
  counted_at?: string | null;
  request_id: string;
};
export type AdjustmentPayload = {
  mode: Mode;
  amount: string;
  expected_revision: number;
  request_id: string;
  reason: string;
};
export type HistoryEntry = {
  id: string;
  item_id: string;
  mode: Mode | "create";
  amount: string;
  before: string | null;
  after: string | null;
  revision: number;
  reason: string;
  actor: string;
  created_at: string;
};
export type HistoryPage = {
  entries: HistoryEntry[];
  has_more?: boolean;
  next_before_revision?: number | null;
};
