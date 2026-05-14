import type { ReactNode } from "react";

// Landing surface — keeps current root layout's <html>/<body>/fonts in place.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
