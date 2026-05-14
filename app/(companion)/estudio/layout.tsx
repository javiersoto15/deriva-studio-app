import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Studio"
};

export default function EstudioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
