/** A submitted review is complete only after the server returns a persisted pending review. */
export function isPersistedPendingReview(value: unknown): value is { id: string; status: "pending" } {
  if (!value || typeof value !== "object") return false;
  const review = value as { id?: unknown; status?: unknown };
  return typeof review.id === "string" && review.id.trim().length > 0 && review.status === "pending";
}
