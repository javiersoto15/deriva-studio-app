import type { Viewport } from "next";
import type { ReactNode } from "react";
import { derivaColors } from "../../../../src/brand";

// Phase 1D D5 — /canjear/[rewardId] is an espresso surface; match the iOS
// status bar so the seam between OS chrome and the QR card is invisible.
export const viewport: Viewport = {
  themeColor: derivaColors.espresso
};

// Note: a per-reward title would need generateMetadata against the rewards
// repo; leaving the companion template default ("%s · Deriva" with no %s
// resolves to "Tu Deriva") until that wiring lands.

export default function CanjearLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
