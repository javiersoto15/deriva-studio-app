// Member display helpers. Centralized so the first-name fallback chain stays
// consistent across the home screen and any future personalization surfaces.

import type { Member } from "../api/hooks";

// Member augmented with optional first_name (populated client-side after the
// §3.5 campaign-token reconciliation succeeds). Not in the canonical contract.
export type MemberWithFirstName = Member & { first_name?: string };

/**
 * Returns the best first name we can display for a member, following the chain:
 *   1. `member.first_name` if present (set after reconciliation)
 *   2. first token of `member.name` split on whitespace
 *   3. empty string — caller decides on a generic fallback greeting
 */
export function displayFirstName(member: MemberWithFirstName | null | undefined): string {
  if (!member) return "";
  if (member.first_name && member.first_name.trim().length > 0) {
    return member.first_name.trim();
  }
  const fromName = member.name?.split(/\s+/)[0]?.trim();
  return fromName ?? "";
}
