import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Actividad"
};

export default function ActividadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
