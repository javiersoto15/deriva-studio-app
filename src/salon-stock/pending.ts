import {
  EXPECTED_WITHDRAWAL_TAKERS,
  LOCATIONS,
  type CreatePayload,
  type AdjustmentPayload,
  type WithdrawalPayload,
} from "./types";
import { parseQuantity } from "./model";
export type PendingMutation =
  | { kind: "create"; payload: CreatePayload }
  | { kind: "adjust"; id: string; payload: AdjustmentPayload }
  | { kind: "withdrawal"; payload: WithdrawalPayload };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (uid: string) => `deriva:salon-stock:pending:${uid}`;
export function writePending(
  storage: StorageLike,
  uid: string,
  pending: PendingMutation,
) {
  storage.setItem(key(uid), JSON.stringify(pending));
}
export function clearPending(storage: StorageLike, uid: string) {
  storage.removeItem(key(uid));
}
const id = (v: unknown) =>
  typeof v === "string" && /^salon_[A-Za-z0-9_-]{1,100}$/.test(v);
export function readPending(
  storage: StorageLike,
  uid: string,
): PendingMutation | null {
  try {
    const raw = storage.getItem(key(uid));
    if (!raw) return null;
    const v = JSON.parse(raw),
      p = v?.payload;
    if (!p || typeof p.request_id !== "string" || !p.request_id) return null;
    const amount =
      typeof p.amount === "string" ? parseQuantity(p.amount) : null;
    const revision =
      Number.isSafeInteger(p.expected_revision) && p.expected_revision >= 0;
    if (
      v.kind === "withdrawal" &&
      (p.location === "storage" || p.location === "cleaning") &&
      id(p.item_id) &&
      typeof p.taker === "string" &&
      EXPECTED_WITHDRAWAL_TAKERS.some((t) => t === p.taker) &&
      amount !== null &&
      amount !== "0" &&
      revision &&
      typeof p.reason === "string"
    )
      return v;
    if (
      v.kind === "adjust" &&
      id(v.id) &&
      ["set", "add", "subtract"].includes(p.mode) &&
      amount !== null &&
      revision &&
      typeof p.reason === "string"
    )
      return v;
    if (
      v.kind === "create" &&
      typeof p.name === "string" &&
      p.name.trim() &&
      LOCATIONS.some((l) => l.id === p.location) &&
      typeof p.category === "string" &&
      p.category &&
      typeof p.category_label === "string" &&
      p.category_label &&
      (p.unit === null || typeof p.unit === "string") &&
      typeof p.package_note === "string" &&
      (p.quantity === null ||
        (typeof p.quantity === "string" && parseQuantity(p.quantity) !== null))
    )
      return v;
    return null;
  } catch {
    return null;
  }
}
export function recoveryDecision(
  previouslyUnconfirmed: boolean,
  failure: {
    status: number | null;
    ambiguous: boolean;
    code?: string;
    validItem?: boolean;
  },
) {
  const definiteConflict =
    failure.status === 409 &&
    failure.validItem === true &&
    ["revision_conflict", "duplicate_item", "insufficient_stock"].includes(
      failure.code ?? "",
    );
  return {
    keepRequest:
      failure.ambiguous || (previouslyUnconfirmed && !definiteConflict),
    reauthenticate: failure.status === 401 || failure.status === 403,
  };
}
