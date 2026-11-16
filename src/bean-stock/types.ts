export type Mode = "set" | "add" | "subtract";
export type BeanItem = {
  id: string;
  name: string;
  origin_id: string;
  tier: "regular" | "premium";
  unit: "kg";
  quantity_kg: string | null;
  revision: number;
  updated_at: string;
};
export type MenuItem = {
  id: string;
  name: string;
  available: boolean;
  origin_ids: string[];
};
export type Snapshot = {
  items: BeanItem[];
  now: string;
  can_manage_beans: boolean;
  menu_items: MenuItem[];
  links: { bean_id: string; menu_item_id: string }[];
};
export type AdjustmentPayload = {
  mode: "set" | "delta";
  quantity_kg: string;
  expected_revision: number;
  request_id: string;
  reason?: string;
};
export type HistoryEntry = {
  id: string;
  bean_id: string;
  mode: "set" | "delta";
  quantity_kg: string;
  before_kg: string | null;
  after_kg: string;
  revision: number;
  request_id: string;
  actor_id: string;
  reason: string;
  created_at: string;
};
export type HistoryPage = {
  entries: HistoryEntry[];
  has_more: boolean;
  next_before_revision: number | null;
};
export type AdjustmentResult = { item: BeanItem; adjustment: HistoryEntry };
export type LinksPayload = {
  menu_item_ids: string[];
  expected_menu_item_ids: string[];
  request_id: string;
};
export type BeanLinks = { bean_id: string; menu_item_ids: string[] };
export type PendingOperation =
  | { kind: "count"; beanId: string; payload: AdjustmentPayload }
  | { kind: "links"; beanId: string; payload: LinksPayload };
