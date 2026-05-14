import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Estado de tu solicitud"
};

export default function EstadoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
