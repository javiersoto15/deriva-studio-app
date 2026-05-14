import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mi usual"
};

export default function FavoritosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
