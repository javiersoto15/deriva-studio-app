import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Verifica con código"
};

export default function VerificarLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
