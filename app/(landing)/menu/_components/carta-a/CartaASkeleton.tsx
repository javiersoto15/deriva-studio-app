import type { CSSProperties } from "react";

import styles from "./carta-a.module.css";

// Prerendered fallback for the /menu Suspense boundary. Server component on
// purpose: it lands in the static PPR shell, so the cream ground and the four
// roast bands paint before the backend menu arrives — no light/dark flash and
// no layout jump when the real doors replace them. Door names are chrome (not
// backend data), so they render verbatim; only counts and photos wait.

const DOORS = [
  ["cafe", "Café"],
  ["comida", "Comida"],
  ["dulce", "Dulce"],
  ["bar", "Bar"]
] as const;

export function CartaASkeleton() {
  return (
    <div className={styles.shell} aria-busy="true">
      <p className={styles.srOnly} role="status">
        Cargando la carta…
      </p>
      <header className={styles.entranceHead}>
        <div className={styles.headRow}>
          <span style={{ width: 34, height: 34 }} />
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.bigTitle}>La carta</h1>
        </div>
      </header>
      <div className={styles.doors} aria-hidden="true">
        {DOORS.map(([id, name]) => (
          <div
            key={id}
            className={styles.door}
            style={{ "--door-bg": `var(--door-${id})`, "--door-fg": `var(--door-${id}-fg)` } as CSSProperties}
          >
            <span className={styles.doorText}>
              <span className={styles.doorName}>{name}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
