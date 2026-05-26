"use client";

import { usePointsBalance } from "../../../../src/api/hooks";
import { colors } from "../../../../src/design/tokens";

// Three mini-tiles: estado / tu cartera / última.
// Cartera is the second contrast moment on the page (espresso vs beige).
// Última is hidden when the user has no order history.
export function MetricStrip({
  openLabel,
  closesAt,
  isOpen,
  lastOrder
}: {
  openLabel: string;
  closesAt: string;
  isOpen: boolean;
  lastOrder?: { name: string; when: string } | null;
}) {
  const { data: balance } = usePointsBalance();
  // Defensive — backend may not expose progress fields; fall back gracefully.
  const visits =
    (balance as { visits_to_next_reward?: number } | undefined)
      ?.visits_to_next_reward ?? null;
  const threshold =
    (balance as { next_reward_threshold?: number } | undefined)
      ?.next_reward_threshold ?? 8;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 8,
        padding: "10px 14px 0"
      }}
    >
      <EstadoTile openLabel={openLabel} closesAt={closesAt} isOpen={isOpen} />
      <CarteraTile current={visits} threshold={threshold} />
      {lastOrder ? <UltimaTile lastOrder={lastOrder} /> : null}
    </div>
  );
}

function EstadoTile({
  openLabel,
  closesAt,
  isOpen
}: {
  openLabel: string;
  closesAt: string;
  isOpen: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colors.beige50,
        padding: "10px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: isOpen ? colors.green : colors.inkMuted
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: colors.ink900
          }}
        >
          {openLabel}
        </span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: colors.inkMuted,
          textTransform: "uppercase"
        }}
      >
        {isOpen ? "cierra" : "abre"}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: colors.ink900
        }}
      >
        {closesAt}
      </span>
    </div>
  );
}

function CarteraTile({
  current,
  threshold
}: {
  current: number | null;
  threshold: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colors.brown900,
        color: colors.beige100,
        padding: "10px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.beige100
        }}
      >
        Tu cartera
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 22,
            fontWeight: 600,
            color: colors.beige100
          }}
        >
          {current ?? "—"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
            fontSize: 12,
            fontWeight: 400,
            color: "rgba(244, 237, 230, 0.66)"
          }}
        >
          / {threshold}
        </span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 11,
          lineHeight: "14px",
          color: "rgba(244, 237, 230, 0.76)"
        }}
      >
        cafés para tu próximo
      </span>
    </div>
  );
}

function UltimaTile({
  lastOrder
}: {
  lastOrder: { name: string; when: string };
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colors.beige50,
        padding: "10px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: colors.inkMuted
        }}
      >
        Última
      </span>
      <span
        style={{
          fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 17,
          lineHeight: "20px",
          color: colors.ink900
        }}
      >
        {lastOrder.name}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: "0.10em",
          color: colors.inkMuted,
          textTransform: "uppercase"
        }}
      >
        {lastOrder.when}
      </span>
    </div>
  );
}
