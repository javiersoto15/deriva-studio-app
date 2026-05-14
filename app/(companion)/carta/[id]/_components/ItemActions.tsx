"use client";

import { Button } from "../../../../../src/ui/Button";

// Phase 2B.5 — Client island for the item detail page.
// Renders the "♡ Guardar" header button and the "Es mi usual" CTA. Wiring to
// the favorites mutation lands in Phase 2C; for now these are visual only,
// matching the original client-page behavior. The `itemId` prop will be the
// cache key for the mutation once it's wired.
export function ItemSaveButton({ itemId: _itemId }: { itemId: string }) {
  return (
    <button
      type="button"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--color-brown-700, #5a3a1e)",
        fontFamily: "var(--font-display), serif",
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: 16
      }}
    >
      ♡ Guardar
    </button>
  );
}

export function ItemUsualCta({ itemId: _itemId }: { itemId: string }) {
  return (
    <Button variant="primary" style={{ width: "100%" }}>
      Es mi usual
    </Button>
  );
}
