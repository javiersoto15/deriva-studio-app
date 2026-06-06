"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { todayHoursLabel } from "../../lib/open-now";

// "match-up" intentionally matches no rendered tab — standalone campaign pages
// (reached via QR / Instagram) keep the nav for orientation but highlight none.
type Tab = "inicio" | "carta" | "resenas" | "visita" | "match-up";

export function SiteNav({
  active = "inicio",
  variant = "translucent"
}: {
  active?: Tab;
  variant?: "translucent" | "solid";
}) {
  const [scrolled, setScrolled] = useState(false);
  // Weekday hours by default for the prerender/SSR pass; the real day is
  // resolved client-side after mount so we never read `new Date()` during
  // static prerender (Next 16 dynamic-IO). Only Sat/Sun differ from default.
  const [hoursLabel, setHoursLabel] = useState("08:00–21:00");

  useEffect(() => {
    setHoursLabel(todayHoursLabel());
  }, []);

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const solid = variant === "solid" || scrolled;

  return (
    <nav
      className={`landing-nav ${solid ? "is-scrolled" : ""}`}
      aria-label="Navegación principal"
    >
      <Link href="/" className="landing-nav__brand">
        <span className="landing-nav__diamond" aria-hidden="true" />
        <span>Deriva Coffee Studio</span>
      </Link>
      <div className="landing-nav__tabs">
        <Link
          href="/"
          className={`landing-nav__tab ${active === "inicio" ? "is-active" : ""}`}
        >
          Inicio
        </Link>
        <Link
          href="/menu"
          className={`landing-nav__tab ${active === "carta" ? "is-active" : ""}`}
        >
          La carta
        </Link>
        <Link
          href="/resenas"
          className={`landing-nav__tab ${active === "resenas" ? "is-active" : ""}`}
        >
          Reseñas
        </Link>
        <Link
          href="/#visita"
          className={`landing-nav__tab ${active === "visita" ? "is-active" : ""}`}
        >
          Visita
        </Link>
      </div>
      <span className="landing-nav__cue">Magnere 1570 · {hoursLabel}</span>
    </nav>
  );
}
