import { Eyebrow } from "../../../src/ui/Eyebrow";

export default function AdminHomePage() {
  return (
    <main style={{ padding: 24 }}>
      <Eyebrow>Admin · Consola</Eyebrow>
      <p style={{ marginTop: 16, fontFamily: "var(--font-mono), monospace" }}>
        Próximamente: socias, staff, menú, reportes.
      </p>
    </main>
  );
}
