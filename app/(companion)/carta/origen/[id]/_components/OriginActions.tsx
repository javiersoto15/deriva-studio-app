"use client";

import { Button } from "../../../../../../src/ui/Button";

// Phase 2B.5 — Client island for the origin card page.
// Hosts the favorite/share header buttons and the bottom CTA pair. Wiring to
// real mutations lands in Phase 2C; visuals match the original client page.
export function OriginHeaderActions({ originId: _originId }: { originId: string }) {
  return (
    <div style={{ display: "flex", gap: 16, color: "var(--color-brown-700, #5a3a1e)" }}>
      <button
        type="button"
        aria-label="Guardar"
        style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 18 }}
      >
        ☆
      </button>
      <button
        type="button"
        aria-label="Compartir"
        style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 18 }}
      >
        ↗
      </button>
    </div>
  );
}

export function OriginCtas({ originId: _originId }: { originId: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
      <Button variant="primary" style={{ flex: 1 }}>
        Es mi usual
      </Button>
      <Button variant="secondary">Guardar</Button>
    </div>
  );
}
