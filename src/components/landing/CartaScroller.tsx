"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DerivaImage } from "./DerivaImage";
import type { PhotoSlug } from "../../data/photos";

export type CartaChip = {
  slug: string;
  section: string;
  index: string;
  name: string;
  italic: string;
  notes: string;
  price?: string;
  href: string;
  /** Photo slug — must exist in src/data/photos.ts (the upload manifest). */
  photo?: PhotoSlug;
  /** CSS object-position for the chip photo. Defaults to "center center". */
  photoPosition?: string;
  /** When set, renders as a dark accent card (e.g. Menú Ejecutivo). */
  accent?: "ejecutivo";
};

export function CartaScroller({ chips }: { chips: CartaChip[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(1);

  // Track the currently-visible chip so the "01 / 06" counter updates as the
  // user scrolls. Uses scrollLeft / chip width — simpler than IntersectionObserver
  // for a uniformly-sized strip.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const chipWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 20
        : 400;
      const i = Math.round(el.scrollLeft / chipWidth) + 1;
      setIndex(Math.min(Math.max(1, i), chips.length));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [chips.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const chipWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20
      : 400;
    el.scrollBy({ left: direction * chipWidth, behavior: "smooth" });
  };

  const total = String(chips.length).padStart(2, "0");
  const current = String(index).padStart(2, "0");

  return (
    <div className="carta-scroller">
      <div className="carta-scroller__head">
        <div className="carta-scroller__heading">
          <div className="landing-slug">
            <span className="landing-slug__rule" aria-hidden="true" />
            <span>§ IV · La carta · Otoño 2026</span>
          </div>
          <h2 className="landing-display">
            Hoy se sirve <em>esto.</em>
          </h2>
        </div>
        <div className="carta-scroller__controls">
          <div className="carta-scroller__arrows">
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollBy(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              onClick={() => scrollBy(1)}
              className="is-primary"
            >
              →
            </button>
          </div>
          <span className="carta-scroller__counter">
            Desliza · {current} / {total}
          </span>
        </div>
      </div>
      <div ref={scrollerRef} className="carta-scroller__strip scrollbar-hide">
        {chips.map((chip) => (
          <Link
            key={chip.slug}
            href={chip.href}
            className={`carta-chip ${chip.accent === "ejecutivo" ? "carta-chip--ejecutivo" : ""}`}
          >
            <div className="carta-chip__photo">
              {chip.photo ? (
                <DerivaImage
                  slug={chip.photo}
                  alt=""
                  sizes="(max-width: 900px) 240px, 320px"
                  fill
                  className="carta-chip__img"
                  style={{ objectPosition: chip.photoPosition ?? "center center" }}
                />
              ) : (
                <span className="carta-chip__placeholder" aria-hidden="true">
                  {chip.italic || chip.name}
                </span>
              )}
              {chip.accent === "ejecutivo" ? (
                <div className="carta-chip__accent-overlay">
                  <span className="carta-chip__accent-eyebrow">Hoy · 13:00–16:00</span>
                  <span className="carta-chip__accent-title">
                    Menú
                    <br />
                    <em>Ejecutivo</em>
                  </span>
                </div>
              ) : null}
            </div>
            <div className="carta-chip__body">
              <span className="carta-chip__section">
                § {chip.section} · {chip.index}
              </span>
              <span className="carta-chip__name">
                {chip.name} <em>{chip.italic}</em>
              </span>
              <span className="carta-chip__notes">{chip.notes}</span>
              <div className="carta-chip__foot">
                {chip.price ? <span className="carta-chip__price">{chip.price}</span> : <span />}
                <span className="carta-chip__cta">Ver →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
