import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sumar visita"
};

export default function SumarVisitaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
