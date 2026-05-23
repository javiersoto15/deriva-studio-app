import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PHOTO_BASE_URL } from "../../../src/data/photos";
import "./abierto.css";

export const metadata: Metadata = {
  title: "Abierto · Deriva Coffee Studio",
  description: "Pantalla vertical de barra — abierto hoy.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#F4EFE6" };

const PHOTOS = {
  latte: `${PHOTO_BASE_URL}/latte-1920.jpg`,
  pourOver: `${PHOTO_BASE_URL}/pour-over-1920.jpg`,
  kasler: `${PHOTO_BASE_URL}/croissant-kasler-1920.jpg`,
  italiana: `${PHOTO_BASE_URL}/tostada-italiana-1920.jpg`
} as const;

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const SEASON_BY_MONTH: Record<number, string> = {
  0: "Verano",  1: "Verano",  2: "Otoño",
  3: "Otoño",   4: "Otoño",   5: "Invierno",
  6: "Invierno",7: "Invierno",8: "Primavera",
  9: "Primavera",10:"Primavera",11:"Verano"
};

const ISSUE_PER_DAY = 1;
const ISSUE_EPOCH = new Date("2026-05-01T00:00:00-04:00");

function getEditionLabels(now: Date) {
  const dateFmt = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago"
  });
  const parts = dateFmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const monthIdx = now.getMonth();
  const season = SEASON_BY_MONTH[monthIdx];
  const roman = ROMAN_MONTHS[monthIdx];

  const issueNum =
    Math.floor((now.getTime() - ISSUE_EPOCH.getTime()) / (1000 * 60 * 60 * 24)) * ISSUE_PER_DAY + 1;

  return {
    eyebrow: `— Hoy · ${cap(weekday)} ${day} · ${roman} —`,
    masthead: {
      brand: "— DERIVA COFFEE STUDIO —",
      edition: `VOL. 001 · ${season.toUpperCase()} MMXXVI · № ${issueNum}`
    },
    cap: cap(`${weekday} ${day} de ${month}`)
  };
}

async function AbiertoDisplay() {
  await connection();
  const labels = getEditionLabels(new Date());

  return (
    <main className="ab-stage" aria-label="Pantalla abierto">
      {/* Masthead */}
      <header className="ab-mast">
        <div className="ab-mast__row">
          <span>{labels.masthead.brand}</span>
          <span>{labels.masthead.edition}</span>
        </div>
        <span className="ab-mast__rule" aria-hidden="true" />
      </header>

      {/* Hero — asymmetric Abierto. + Latte medallion */}
      <section className="ab-hero">
        <div className="ab-hero__type">
          <div className="ab-hero__eyebrow">{labels.eyebrow}</div>
          <h1 className="ab-hero__word">
            Abierto<span className="ab-hero__word-period">.</span>
          </h1>
          <p className="ab-hero__manifesto">
            Café de tueste propio, panes de hornada y sándwiches todo el día.
          </p>
        </div>
        <div className="ab-feature">
          <div className="ab-feature__med">
            <img src={PHOTOS.latte} alt="Latte servido en taza roja" />
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
        <span>LUN–VIE 08:00 → 21:00</span>
        <span className="ab-hours__sep">·</span>
        <span>SÁB 10:00 → 21:00</span>
        <span className="ab-hours__sep">·</span>
        <span>DOM CERRADO</span>
      </div>

      {/* Three medallions */}
      <section className="ab-trio" aria-label="Destacados">
        <article className="ab-med">
          <div className="ab-med__circle">
            <img src={PHOTOS.pourOver} alt="Pour Over en Chemex" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 02 · FILTRADO</span>
            <span className="ab-med__name">Pour Over</span>
            <span className="ab-med__note">V60 · Chemex</span>
          </div>
        </article>
        <article className="ab-med">
          <div className="ab-med__circle">
            <img src={PHOTOS.kasler} alt="Croissant Kasler House" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 03 · A TODA HORA</span>
            <span className="ab-med__name">Kasler House</span>
            <span className="ab-med__note">kasler, hummus, palta, cebolla encurtida</span>
          </div>
        </article>
        <article className="ab-med">
          <div className="ab-med__circle">
            <img src={PHOTOS.italiana} alt="Tostada Italiana" />
          </div>
          <div className="ab-med__cap">
            <span className="ab-med__num">№ 04 · MASA MADRE</span>
            <span className="ab-med__name">Italiana</span>
            <span className="ab-med__note">ricotta, rúcula, tomate cherry, aceituna</span>
          </div>
        </article>
      </section>

      {/* Especialidad: Cafetería + Orígenes */}
      <section className="ab-esp" aria-label="Cafetería y orígenes">
        <div className="ab-esp__col">
          <div className="ab-esp__head">
            <div className="ab-esp__head-left">
              <span className="ab-esp__section">§ 01</span>
              <span className="ab-esp__title">Cafetería</span>
            </div>
            <span className="ab-esp__caption">de la barra</span>
          </div>
          <ul className="ab-esp__list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {["Espresso", "Cortado", "Cappuccino", "Flat White", "Latte", "Mocha", "Pour Over"].map((name) => (
              <li key={name} className="ab-esp__item">{name}</li>
            ))}
          </ul>
        </div>

        <span className="ab-esp__divider" aria-hidden="true" />

        <div className="ab-esp__col">
          <div className="ab-esp__head">
            <div className="ab-esp__head-left">
              <span className="ab-esp__section">§ 02</span>
              <span className="ab-esp__title">Orígenes</span>
            </div>
            <span className="ab-esp__caption">tueste propio</span>
          </div>
          <div className="ab-esp__list-origins">
            {[
              { name: "House Blend", notes: "PANELA · CACAO · NUEZ" },
              { name: "Etiopía Yirgacheffe", notes: "JAZMÍN · DURAZNO · BERGAMOTA" },
              { name: "México Chiapas", notes: "CHOCOLATE · MANDARINA · MIEL" }
            ].map((origin) => (
              <div key={origin.name} className="ab-esp__origin">
                <span className="ab-esp__origin-name">{origin.name}</span>
                <span className="ab-esp__origin-notes">{origin.notes}</span>
              </div>
            ))}
            <span className="ab-esp__foot">— rotación semanal —</span>
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
          <span className="ab-quote__sign-text">DESDE 2026 · CONCEPCIÓN</span>
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
