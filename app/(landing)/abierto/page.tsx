import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";
import { LogoLockup } from "../../../src/ui/LogoLockup";
import { menuSections, type MenuAddons } from "../../../src/data/menu";
import { HOURS_LINES, isOpenNow } from "../../../src/lib/open-now";
import { getEditionMarkUppercase } from "../../../src/lib/edition";
import { getCurrentSchedule } from "../../../src/data/menu-schedule";
import { MENU_EJECUTIVO_FIXED } from "../../../src/data/menu-ejecutivo";
import { CrossfadeRotator } from "../../../src/components/landing/CrossfadeRotator";
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

async function AbiertoPromo() {
  await connection();
  const now = new Date();
  const editionMark = getEditionMarkUppercase(now);
  return (
    <main className="ab-stage ab-stage--promo" aria-label="Promo · Desayuno campesino">
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

      <div className="ab-promo__eyebrow">— Esta semana · Mayo —</div>

      <div className="ab-promo__hero">
        <img
          src="/promo/desayuno-campesino.jpg"
          alt="Dos desayunos campesinos sobre la mesa"
          width={1600}
          height={1600}
          decoding="async"
        />
      </div>

      <div className="ab-promo__stack">
        <span className="ab-promo__mark">§ 01 · Desayuno</span>
        <h1 className="ab-promo__headline">Desayuno campesino · de a dos.</h1>
        <p className="ab-promo__sub">— para compartir entre dos —</p>
        <div className="ab-promo__price">
          <span className="ab-promo__price-label">Promo</span>
          <span className="ab-promo__price-amount">$ 14.500</span>
        </div>
      </div>

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

async function AbiertoTortas() {
  await connection();
  const now = new Date();
  const editionMark = getEditionMarkUppercase(now);
  return (
    <main className="ab-stage ab-stage--promo" aria-label="Promo · Tortas a mitad de precio">
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

      <div className="ab-promo__eyebrow">— Solo hoy · hasta las 14:00 —</div>

      <div className="ab-promo__hero ab-promo__hero--tortas">
        <img
          src="/promo/tortas.jpg"
          alt="Tortas del día sobre la barra"
          width={900}
          height={1600}
          decoding="async"
        />
      </div>

      <div className="ab-promo__stack">
        <span className="ab-promo__mark">§ 02 · Hoy</span>
        <h1 className="ab-promo__headline">Acompaña tu espresso.</h1>
        <p className="ab-promo__sub">— torta del día a mitad de precio —</p>
        <div className="ab-promo__price">
          <span className="ab-promo__price-label">Promo</span>
          <span className="ab-promo__price-amount">–50%</span>
          <span className="ab-promo__condition">al pedir un espresso de la barra</span>
        </div>
      </div>

      <section className="ab-barra" aria-label="De la barra">
        <div className="ab-barra__mark">
          <span className="ab-barra__rule" aria-hidden="true" />
          <span className="ab-barra__label">§ 03 · De la barra</span>
          <span className="ab-barra__rule" aria-hidden="true" />
        </div>
        <div className="ab-barra__medallions">
          <article className="ab-barra__med">
            <div className="ab-barra__circle">
              <DerivaImage slug="cappuccino" alt="Cappuccino en taza" sizes="220px" />
            </div>
            <div className="ab-barra__cap">
              <span className="ab-barra__name">Cappuccino</span>
              <span className="ab-barra__meta">180 ml</span>
            </div>
          </article>
          <article className="ab-barra__med">
            <div className="ab-barra__circle">
              <DerivaImage slug="latte" alt="Latte servido en taza roja" sizes="220px" />
            </div>
            <div className="ab-barra__cap">
              <span className="ab-barra__name">Latte</span>
              <span className="ab-barra__meta">240 ml</span>
            </div>
          </article>
        </div>
        <span className="ab-barra__caption">— vale con cualquier espresso de la barra —</span>
      </section>

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

async function AbiertoDisplay() {
  await connection();
  const now = new Date();
  const labels = getDayLabels(now);
  const editionMark = getEditionMarkUppercase(now);
  const open = isOpenNow(now);
  const cafeteria = getCafeteriaData();
  // Menu Ejecutivo runs weekdays 13:00–16:00. Announce it on the splash
  // only while the window is still ahead (hide once 16:00 passes so the
  // strip never advertises a closed service).
  const santiagoHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false
    }).format(now)
  );
  const showEjecutivo =
    getCurrentSchedule(now) === "weekday" && santiagoHour < 16;

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

      {/* Menu Ejecutivo strip — only while today's window is still open */}
      {showEjecutivo ? (
        <div className="ab-ejec-strip" aria-label="Menu Ejecutivo hoy">
          <span className="ab-ejec-strip__dash" aria-hidden="true">—</span>
          <span className="ab-ejec-strip__eyebrow">Hoy</span>
          <span className="ab-ejec-strip__sep">·</span>
          <span className="ab-ejec-strip__title">Menu Ejecutivo</span>
          <span className="ab-ejec-strip__sep">·</span>
          <span className="ab-ejec-strip__window">13:00 — 16:00</span>
          <span className="ab-ejec-strip__sep">·</span>
          <span className="ab-ejec-strip__price">{MENU_EJECUTIVO_FIXED.priceLabel}</span>
          <span className="ab-ejec-strip__dash" aria-hidden="true">—</span>
        </div>
      ) : null}

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

async function AbiertoRotator() {
  await connection();
  // The Tortas promo expires daily at 14:00. Drop it from the rotator once
  // Santiago time passes 14:00 so the TV never advertises a closed promo;
  // the meta-refresh on the page re-evaluates this within 10 minutes. When
  // hidden, the rotator falls back to a 2-view (Abierto ↔ Campesino) crossfade.
  const santiagoHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false
    }).format(new Date())
  );
  const showTortas = santiagoHour < 14;

  return (
    <CrossfadeRotator
      className={showTortas ? "ab-rotator" : "ab-rotator ab-rotator--2up"}
      views={[
        { key: "abierto", node: <AbiertoDisplay /> },
        { key: "promo", node: <AbiertoPromo /> },
        ...(showTortas ? [{ key: "tortas", node: <AbiertoTortas /> }] : [])
      ]}
    />
  );
}

export default function AbiertoPage() {
  return (
    <>
      {/* TV display: reload every 10 minutes to refresh date + edition number. */}
      <meta httpEquiv="refresh" content="600" />
      <Suspense fallback={<main className="ab-stage" />}>
        <AbiertoRotator />
      </Suspense>
    </>
  );
}
