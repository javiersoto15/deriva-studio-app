import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { derivaColors } from "../../../src/brand";

// Phase 1D D5 / 1E E3 — /codigo is an espresso surface, so the iOS status bar
// should match (Recipe Rule 5: single green moment, espresso background).
export const viewport: Viewport = {
  themeColor: derivaColors.espresso
};

export const metadata: Metadata = {
  title: "Tu código"
};

export default function CodigoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
