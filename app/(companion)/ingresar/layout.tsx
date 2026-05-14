import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tu número"
};

export default function IngresarLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
