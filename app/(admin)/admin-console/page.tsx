import { Eyebrow } from "../../../src/ui/Eyebrow";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main style={{ padding: 24 }}>
      <Eyebrow>Admin · Consola</Eyebrow>
      <p style={{ marginTop: 16, fontFamily: "var(--font-mono), monospace" }}>
        Próximamente: socias, staff, menú, reportes.
      </p>
      <p style={{ marginTop: 16, fontFamily: "var(--font-mono), monospace" }}>
        <Link href="/stock">Abrir Stock de barra →</Link>
      </p>
    </main>
  );
}
