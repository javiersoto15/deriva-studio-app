import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";
import { LogoLockup } from "../../../src/ui/LogoLockup";
import { menuSections, type MenuAddons } from "../../../src/data/menu";
import { HOURS_LINES, isOpenNow } from "../../../src/lib/open-now";
import { getEditionMarkUppercase } from "../../../src/lib/edition";
import "./abierto.css";

export const metadata: Metadata = {
  title: "Abierto · Deriva Coffee Studio",
  description: "Pantalla vertical de barra — abierto hoy.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#F4EFE6" };

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function getDayLabels(now: Date) {
  const dateFmt = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago"
  });
  const parts = dateFmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthIdx = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(now)
  ).getMonth();
  const roman = ROMAN_MONTHS[monthIdx];
  return { eyebrow: `— Hoy · ${cap(weekday)} ${day} · ${roman} —` };
}

// Canonical cafetería items + addons, sourced from src/data/menu.ts so the
// signage never drifts from the printed/digital carta.
function getCafeteriaData(): { itemNames: string[]; addons: MenuAddons[] } {
  const cafe = menuSections.find((s) => s.id === "cafeteria");
  const espresso = cafe?.subgroups?.find((g) => g.id === "espresso");
  const itemNames = espresso?.items.map((i) => i.name) ?? [];
  const espressoAddons = espresso?.addons ? [espresso.addons] : [];
  const sectionAddons = cafe?.addons
    ? Array.isArray(cafe.addons)
      ? cafe.addons
      : [cafe.addons]
    : [];
  return { itemNames, addons: [...espressoAddons, ...sectionAddons] };
}

async function AbiertoDisplay() {
  await connection();
  const now = new Date();
  const labels = getDayLabels(now);
  const editionMark = getEditionMarkUppercase(now);
  const open = isOpenNow(now);
  const cafeteria = getCafeteriaData();

  return (
    <main className="ab-stage" aria-label="Pantalla abierto">
      {/* Masthead */}
      <header className="ab-mast">
        <div className="ab-mast__row">
          <LogoLockup
            isotipo={56}
            wordmarkSize={34}
            wordmarkLine={32}
            subSize={10}
            gap={14}
            isotipoColor="#241B14"
            wordmarkColor="#241B14"
          />
          <span className="ab-mast__edition">{editionMark}</span>
        </div>
        <span className="ab-mast__rule" aria-hidden="true" />
      </header>

      {/* Hero — asymmetric Abierto./Cerrado. + Latte medallion */}
      <section className="ab-hero">
        <div className="ab-hero__type">
          <div className="ab-hero__eyebrow">{labels.eyebrow}</div>
          <h1 className="ab-hero__word">
            {open ? "Abierto" : "Cerrado"}
            <span className="ab-hero__word-period">.</span>
          </h1>
          <p className="ab-hero__manifesto">
            {open
              ? "Café de especialidad, una pausa sin apuro, un rato a la deriva."
              : "Volvemos mañana. Te esperamos a la deriva."}
          </p>
        </div>
        <div className="ab-feature">
          <div className="ab-feature__med">
            <DerivaImage
              slug="latte"
              alt="Latte servido en taza roja"
              sizes="340px"
              priority
            />
          </div>
          <div className="ab-feature__cap">
            <span className="ab-feature__num">№ 01 · DE LA BARRA</span>
            <span className="ab-feature__name">Latte</span>
          </div>
        </div>
      </section>

      {/* Hours band — canonical schedule from src/lib/open-now.ts */}
      <div className="ab-hours">
        <span className="ab-hours__label">HORARIO</span>
        {HOURS_LINES.map((line, i) => (
          <Fragment key={line}>
            <span>{line}</span>
            {i < HOURS_LINES.length - 1 ? (
              <span className="ab-hours__sep">·</span>
            ) : null}
          </Fragment>
        ))}
      </div>

      {/* Three medallions */}
      <section className="ab-trio" aria-label="Destacados">
        <article className="ab-med">
          <div className="ab-med__circle">
            <DerivaImage slug="pour-over" alt="Pour Over en Chemex" sizes="280px" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 02 · FILTRADO</span>
            <span className="ab-med__name">Pour Over</span>
            <span className="ab-med__note">V60 · Chemex</span>
          </div>
        </article>
        <article className="ab-med">
          <div className="ab-med__circle">
            <DerivaImage slug="croissant-kasler" alt="Croissant Kasler House" sizes="280px" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 03 · A TODA HORA</span>
            <span className="ab-med__name">Kasler House</span>
            <span className="ab-med__note">kasler, hummus, palta, cebolla encurtida</span>
          </div>
        </article>
        <article className="ab-med">
          <div className="ab-med__circle">
            <DerivaImage slug="tostada-italiana" alt="Tostada Italiana" sizes="280px" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 04 · MASA MADRE</span>
            <span className="ab-med__name">Italiana</span>
            <span className="ab-med__note">ricotta, rúcula, tomate cherry, aceituna</span>
          </div>
        </article>
      </section>

      {/* Especialidad: Cafetería (canonical items) + Acompaña (canonical addons) */}
      <section className="ab-esp" aria-label="Cafetería y acompañamientos">
        <div className="ab-esp__col">
          <div className="ab-esp__head">
            <div className="ab-esp__head-left">
              <span className="ab-esp__section">§ 01</span>
              <span className="ab-esp__title">Cafetería</span>
            </div>
            <span className="ab-esp__caption">de la barra</span>
          </div>
          <ul className="ab-esp__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {cafeteria.itemNames.map((name) => (
              <li key={name} className="ab-esp__item">{name}</li>
            ))}
          </ul>
        </div>

        <span className="ab-esp__divider" aria-hidden="true" />

        <div className="ab-esp__col">
          <div className="ab-esp__head">
            <div className="ab-esp__head-left">
              <span className="ab-esp__section">§ 02</span>
              <span className="ab-esp__title">Acompaña</span>
            </div>
            <span className="ab-esp__caption">para tu café</span>
          </div>
          <div className="ab-esp__list-origins">
            {cafeteria.addons.map((addon) => (
              <div key={addon.label} className="ab-esp__origin">
                <span className="ab-esp__origin-name">{addon.label}</span>
                <span className="ab-esp__origin-notes">{addon.chips.join(" · ")}</span>
              </div>
            ))}
            <span className="ab-esp__foot">— pregunta al barista —</span>
          </div>
        </div>
      </section>

      <span className="ab-spacer" aria-hidden="true" />

      {/* Pull quote */}
      <section className="ab-quote" aria-label="En esta edición">
        <div className="ab-quote__rule">
          <span className="ab-quote__rule-line" />
          <span className="ab-quote__edition">— EN ESTA EDICIÓN —</span>
          <span className="ab-quote__rule-line" />
        </div>
        <p className="ab-quote__body">«Pasa, pide, quédate. La carta cambia con la hornada del día.»</p>
        <div className="ab-quote__sign">
          <span className="ab-quote__sign-line" />
          <span className="ab-quote__sign-text">DESDE 2026 · PROVIDENCIA</span>
          <span className="ab-quote__sign-line" />
        </div>
      </section>

      {/* Colophon */}
      <footer className="ab-colophon">
        <span className="ab-colophon__rule" aria-hidden="true" />
        <div className="ab-colophon__row">
          <span>MAGNERE 1570 · LOCAL 105</span>
          <span>@DERIVA.COFFEE.STUDIO</span>
          <span>DERIVASTUDIO.CL</span>
        </div>
      </footer>
    </main>
  );
}

export default function AbiertoPage() {
  return (
    <>
      {/* TV display: reload every 10 minutes to refresh date + edition number. */}
      <meta httpEquiv="refresh" content="600" />
      <Suspense fallback={<main className="ab-stage" />}>
        <AbiertoDisplay />
      </Suspense>
    </>
  );
}
