import {
  validAdjustmentPayload,
  validBeanId,
  validLinksPayload,
} from "./model";
import type { PendingOperation } from "./types";
export type { PendingOperation } from "./types";
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const key = (uid: string) => `deriva:bean-stock:pending:${uid}`;
function valid(v: unknown): v is PendingOperation {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return (
    Object.keys(x).every((k) => ["kind", "beanId", "payload"].includes(k)) &&
    validBeanId(x.beanId) &&
    ((x.kind === "count" && validAdjustmentPayload(x.payload)) ||
      (x.kind === "links" && validLinksPayload(x.payload)))
  );
}
export function readPending(
  uid: string,
  storage?: StorageLike,
): PendingOperation | null {
  try {
    if (!uid) return null;
    const raw = (storage ?? sessionStorage).getItem(key(uid));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}
/** Storage failure must block sending: callers cannot safely retry an unrecorded mutation. */
export function savePending(
  uid: string,
  op: PendingOperation,
  storage?: StorageLike,
): void {
  if (!uid || !valid(op)) throw Error("invalid_pending_operation");
  (storage ?? sessionStorage).setItem(key(uid), JSON.stringify(op));
}
export function clearPending(uid: string, storage?: StorageLike): void {
  if (uid) (storage ?? sessionStorage).removeItem(key(uid));
}
