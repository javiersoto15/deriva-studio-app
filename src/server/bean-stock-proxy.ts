/** Canonical opaque IDs only; never let browser input select a backend path. */
export function beanIdSegment(id: string): string | null {
  return /^bean_[0-9a-f]{32}$/.test(id) ? id : null;
}
export function beanHistoryQuery(params: URLSearchParams): string | null {
  const query = new URLSearchParams();
  for (const key of params.keys()) {
    if (
      !["limit", "before_revision"].includes(key) ||
      params.getAll(key).length !== 1
    )
      return null;
    const value = params.get(key)!;
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
      return null;
    if (key === "limit" && Number(value) > 100) return null;
    query.set(key, value);
  }
  return query.size ? `?${query}` : "";
}
