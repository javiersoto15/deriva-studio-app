"use client";

// OfflineStrip — Recipe Rule 19 (Persistent offline strip).
// Geometry: full-width band, 35px tall, beige-100 ground, 1px brown-700 bottom
// border, 8×8 brown-700 dot, Plex Mono 500 / 11px / +0.18em uppercase label.
// Behavior: appears when navigator.onLine flips false; on recovery, animates
// out over 240ms (silent — no green "back online" toast per Rule 19).
//
// Accessibility:
//   - role="status" + aria-live="polite" so screen readers announce changes.
//   - Respects prefers-reduced-motion: reduce (instant appear/disappear).
//
// The dot is brown-700 — NEVER green. Green is reserved for the "earned" moment
// per Rule 5 / Rule 19.

import { useEffect, useState } from "react";
import { colors } from "../design/tokens";

type Phase = "hidden" | "entering" | "shown" | "leaving";

export function OfflineStrip() {
  const [online, setOnline] = useState(true);
  const [phase, setPhase] = useState<Phase>("hidden");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!online && phase !== "shown" && phase !== "entering") {
      setPhase(reducedMotion ? "shown" : "entering");
      if (!reducedMotion) {
        const t = setTimeout(() => setPhase("shown"), 240);
        return () => clearTimeout(t);
      }
    } else if (online && (phase === "shown" || phase === "entering")) {
      if (reducedMotion) {
        setPhase("hidden");
      } else {
        setPhase("leaving");
        const t = setTimeout(() => setPhase("hidden"), 240);
        return () => clearTimeout(t);
      }
    }
  }, [online, phase, reducedMotion]);

  if (phase === "hidden") return null;

  const visible = phase === "shown" || (phase === "entering" && reducedMotion);
  const opacity = visible ? 1 : phase === "entering" ? 0 : 0;
  const translateY = visible ? 0 : -8;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        height: 35,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: colors.beige100,
        borderBottom: `1px solid ${colors.brown700}`,
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: reducedMotion
          ? "none"
          : "opacity 240ms ease, transform 240ms ease",
        pointerEvents: "none"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          backgroundColor: colors.brown700,
          borderRadius: 0
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
          fontWeight: 500,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.brown700
        }}
      >
        Sin conexión · Usando datos locales
      </span>
    </div>
  );
}
