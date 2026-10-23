export type ReceiptErrorKey =
  | "error_empty" | "error_refund" | "error_duplicate" | "error_too_old" | "error_future"
  | "error_not_successful" | "error_currency" | "error_policy" | "error_invalid" | "error_session"
  | "error_not_found" | "error_verifier" | "error_unavailable" | "error_generic";

export function receiptClaimErrorKey(status: number | null, body: unknown): ReceiptErrorKey {
  const detail = bodyErrorText(body);
  // Provider ambiguity means we could not verify refund state; do not tell a
  // member that their purchase was refunded unless SumUp confirmed that fact.
  if (detail.includes("refund") && (detail.includes("unavailable") || detail.includes("unknown"))) {
    return status === 503 ? "error_unavailable" : "error_verifier";
  }
  if (detail.includes("refund") || detail.includes("refunded") || detail.includes("chargeback")) return "error_refund";
  if (detail.includes("claimed") || detail.includes("already used")) return "error_duplicate";
  if (detail.includes("older") || detail.includes("too old") || detail.includes("7 days")) return "error_too_old";
  if (detail.includes("future") || detail.includes("not be in the future")) return "error_future";
  if (detail.includes("not successful") || detail.includes("status is unknown")) return "error_not_successful";
  if (detail.includes("currency") || detail.includes("clp")) return "error_currency";
  if (detail.includes("member submissions are disabled") || detail.includes("policy")) return "error_policy";

  switch (status) {
    case 400: return "error_invalid";
    case 401: return "error_session";
    case 403: return "error_policy";
    case 404: return "error_not_found";
    case 409: return "error_duplicate";
    case 502: return "error_verifier";
    case 503: return "error_unavailable";
    default: return "error_generic";
  }
}

function bodyErrorText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const record = body as { message?: unknown; error?: unknown; code?: unknown };
  return [record.code, record.message, record.error]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}
