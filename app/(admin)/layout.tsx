import type { ReactNode } from "react";
import "../../src/design/tokens.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div style={{ minHeight: "100vh", backgroundColor: "#FFF9F0" }}>{children}</div>;
}
