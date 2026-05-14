import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Antes de empezar"
};

export default function ConsentimientoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
