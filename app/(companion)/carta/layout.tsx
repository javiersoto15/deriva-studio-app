import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Carta de hoy"
};

export default function CartaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
