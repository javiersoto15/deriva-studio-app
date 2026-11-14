import {
  CATEGORIES,
  type CreatePayload,
  type AdjustmentPayload,
} from "./types";
import { parseQuantity } from "./model";
export type PendingMutation =
  | { kind: "create"; payload: CreatePayload }
  | { kind: "adjust"; id: string; payload: AdjustmentPayload };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (uid: string) => `deriva:kitchen-stock:pending:${uid}`;
export function writePending(
  storage: StorageLike,
  uid: string,
  value: PendingMutation,
) {
  storage.setItem(key(uid), JSON.stringify(value));
}
export function clearPending(storage: StorageLike, uid: string) {
  storage.removeItem(key(uid));
}
export function readPending(
  storage: StorageLike,
  uid: string,
): PendingMutation | null {
  try {
    const raw = storage.getItem(key(uid));
    if (!raw) return null;
    const v = JSON.parse(raw);
    const p = v?.payload;
    if (!p || typeof p.request_id !== "string" || !p.request_id) return null;
    if (
      v.kind === "adjust" &&
      typeof v.id === "string" &&
      /^[A-Za-z0-9_-]{1,100}$/.test(v.id) &&
      ["set", "add", "subtract"].includes(p.mode) &&
      typeof p.amount === "string" &&
      parseQuantity(p.amount) !== null &&
      Number.isSafeInteger(p.expected_revision) &&
      p.expected_revision >= 0 &&
      typeof p.reason === "string"
    )
      return v;
    if (
      v.kind === "create" &&
      typeof p.name === "string" &&
      p.name.trim() &&
      CATEGORIES.some((c) => c.id === p.category) &&
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

/** Auth/transport failures cannot resolve an earlier request. Domain conflicts run after replay lookup. */
export function mutationRecovery(
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
    (failure.code === "revision_conflict" ||
      failure.code === "duplicate_ingredient");
  return {
    keepRequest:
      failure.ambiguous || (previouslyUnconfirmed && !definiteConflict),
    reauthenticate: failure.status === 401 || failure.status === 403,
  };
}
