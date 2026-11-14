export const EXPECTED_WITHDRAWAL_TAKERS = [
  "Benja",
  "Mari",
  "Nacha",
  "Luis",
  "Cristobal",
  "Marvin",
  "Nadia",
  "Cony",
  "Macarena",
  "Paulina",
] as const;
export const LOCATIONS = [
  { id: "fridge", label: "Refrigerador" },
  { id: "storage", label: "Bodega" },
  { id: "cleaning", label: "Limpieza" },
] as const;
export type Location = (typeof LOCATIONS)[number]["id"];
export type WithdrawalLocation = Exclude<Location, "fridge">;
export type Mode = "set" | "add" | "subtract";
export type Observation = {
  observed_at: string | null;
  date: string | null;
  period: "morning" | null;
  precision: "unknown" | "date" | "date_and_period" | "exact";
  source: string | null;
};
export type SalonItem = {
  id: string;
  name: string;
  location: Location;
  category: string;
  category_label: string;
  category_is_inferred: boolean;
  unit: string | null;
  package_note: string;
  source_markers: string[];
  source_notes: string[];
  source_line: string;
  source_row_id: string;
  source_section: string | null;
  observation: Observation;
  quantity: string | null;
  revision: number;
  updated_at: string;
};
export type Snapshot = {
  items: SalonItem[];
  now: string;
  withdrawal_takers: string[];
};
export type CreatePayload = {
  name: string;
  location: Location;
  category: string;
  category_label: string;
  unit: string | null;
  package_note: string;
  quantity: string | null;
  request_id: string;
};
export type AdjustmentPayload = {
  mode: Mode;
  amount: string;
  expected_revision: number;
  request_id: string;
  reason: string;
};
export type WithdrawalPayload = {
  location: WithdrawalLocation;
  item_id: string;
  taker: string;
  amount: string;
  expected_revision: number;
  request_id: string;
  reason: string;
};
export type Movement = {
  id: string;
  sequence: number;
  item_id: string;
  item_name: string;
  location: Location;
  unit: string | null;
  kind: "initial_count" | "receipt" | "count_correction" | "withdrawal";
  mode: Mode;
  amount: string;
  before: string | null;
  after: string;
  revision: number;
  taker: string | null;
  actor: string;
  reason: string;
  created_at: string;
};
export type ItemHistoryPage = {
  entries: Movement[];
  has_more: boolean;
  next_before_revision: number | null;
};
export type WithdrawalPage = {
  entries: Movement[];
  has_more: boolean;
  next_before_sequence: number | null;
};
export type MutationResult = { item: SalonItem; movement: Movement | null };
