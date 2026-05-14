import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cartera"
};

export default function CarteraLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
