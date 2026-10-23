export type MemberSubmissionOutcome =
  | { ok: true }
  | { ok: false; error: unknown };

/** Preserve the onboarding draft and stay on consent unless account creation succeeds. */
export async function submitMemberAccount(
  createMember: () => Promise<void>,
  clearDraft: () => void,
  advance: () => void
): Promise<MemberSubmissionOutcome> {
  try {
    await createMember();
  } catch (error) {
    return { ok: false, error };
  }

  clearDraft();
  advance();
  return { ok: true };
}
