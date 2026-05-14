import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bienvenida"
};

export default function InicioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
