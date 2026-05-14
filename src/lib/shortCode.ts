// Display helper for reward redemption short codes.
//
// The canonical `RewardRedemptionTokenResponse.short_code` is a 4-character
// Crockford-style code (see migration 007). The UI shows it with a thin space
// in the middle for legibility ("AB CD"). When the token query is still
// loading we render a placeholder so the layout doesn't jump.

export function formatShortCode(code: string | undefined | null): string {
  if (!code) return "···· ····";
  const cleaned = code.trim().toUpperCase();
  if (cleaned.length !== 4) return cleaned;
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)}`;
}
