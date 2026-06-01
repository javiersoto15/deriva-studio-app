import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";
import { LogoLockup } from "../../../src/ui/LogoLockup";
import { menuSections, type MenuAddons } from "../../../src/data/menu";
import { HOURS_LINES, isOpenNow } from "../../../src/lib/open-now";
import { getEditionMarkUppercase } from "../../../src/lib/edition";
import { MENU_EJECUTIVO_FIXED, MENU_EJECUTIVO_TODAY } from "../../../src/data/menu-ejecutivo";
import { CrossfadeRotator } from "../../../src/components/landing/CrossfadeRotator";
import "./abierto.css";

export const metadata: Metadata = {
  title: "Abierto · Deriva Coffee Studio",
  description: "Pantalla vertical de barra — abierto hoy.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#F4EFE6" };

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Noche · live evening view (Deriva Dark Hours), ported from the Sábado night
// IG story but rebuilt as a live component so the masthead day is the real
// weekday — never a stale "Sábado". Runs every open evening from 16:00 until
// close, replacing the Menu Ejecutivo panel. Prices are the already-published
// Dark Hours figures.
const NOCHE = {
  photo: "https://media.derivastudio.cl/promos/fachada-noche.jpg",
  hero: "Quédate hasta el cierre.",
  sub: "Providencia se enciende de noche. La barra de Deriva, también.",
  items: [
    {
      roman: "i.",
      name: "La once",
      note: "Once Deriva · focaccia, un dulce y café",
      price: "desde $10.900"
    },
    {
      roman: "ii.",
      name: "La barra",
      note: "Cervezas heladas · coctelería de café",
      price: "2 × $5.000"
    },
    {
      roman: "iii.",
      name: "El espresso",
      note: "Espresso Tonic · Citrus Soda · ó caliente",
      price: "$4.900"
    }
  ]
} as const;

// Capitalised Spanish weekday in Chilean time — "Lunes", "Martes", … — for
// the night view's day-aware kicker.
function santiagoWeekday(now: Date): string {
  const wd = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long"
  }).format(now);
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}

// Menu Ejecutivo runs Lunes a viernes. This is NOT the carta's
// getCurrentSchedule() (which treats Fri as "weekend" for the full menu) —
// the executive lunch still runs on Fridays, so gate on the real weekday.
function isMenuEjecutivoDay(now: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    weekday: "short"
  }).format(now);
  return weekday !== "Sat" && weekday !== "Sun";
}

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

async function AbiertoEjecutivo() {
  await connection();
  const now = new Date();
  const editionMark = getEditionMarkUppercase(now);
  const { courses: today } = MENU_EJECUTIVO_TODAY;
  const { courseTags } = MENU_EJECUTIVO_FIXED;
  // Spread the course first, then resolve the tag — a per-day `tag` override
  // (e.g. "a elección" for a two-option fondo) wins over the fixed default.
  const courses = [
    { roman: "i.", ...today.bebida, tag: today.bebida.tag ?? courseTags.bebida },
    { roman: "ii.", ...today.entrada, tag: today.entrada.tag ?? courseTags.entrada },
    { roman: "iii.", ...today.fondo, tag: today.fondo.tag ?? courseTags.fondo },
    { roman: "iv.", ...today.queque, tag: today.queque.tag ?? courseTags.queque }
  ];

  return (
    <main className="ab-stage ab-stage--ejec" aria-label="Menu Ejecutivo de hoy">
      <header className="ab-mast">
        <div className="ab-mast__row">
          <LogoLockup
            isotipo={56}
            wordmarkSize={34}
            wordmarkLine={32}
            subSize={10}
            gap={14}
            isotipoColor="#F4EDE6"
            wordmarkColor="#F4EDE6"
          />
          <span className="ab-mast__edition">{editionMark}</span>
        </div>
        <span className="ab-mast__rule" aria-hidden="true" />
      </header>

      <div className="ab-ejec-view">
        <div className="ab-ejec-eyebrow">
          <span className="ab-ejec-eyebrow__l">§ La ronda del mediodía</span>
          <span className="ab-ejec-eyebrow__r">Cuatro momentos · una cuenta</span>
        </div>

        <ul className="ab-ejec-list">
          {courses.map((c) => (
            <li key={c.roman} className="ab-ejec-row">
              <span className="ab-ejec-row__head">
                <span className="ab-ejec-row__num">{c.roman}</span>
                <span className="ab-ejec-row__tag">{c.tag}</span>
              </span>
              <span className="ab-ejec-row__name">{c.name}</span>
              {c.note ? <span className="ab-ejec-row__note">{c.note}</span> : null}
            </li>
          ))}
        </ul>

        <div className="ab-ejec-view__service">
          <div className="ab-ejec-view__service-col">
            <span className="ab-ejec-view__service-label">Servimos</span>
            <span className="ab-ejec-view__window">13:00 — 16:00</span>
            <span className="ab-ejec-view__days">Lunes a viernes</span>
          </div>
          <div className="ab-ejec-puck">
            <span className="ab-ejec-puck__clp">CLP</span>
            <span className="ab-ejec-puck__amount">10.990</span>
          </div>
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
  const showEjecutivo = isMenuEjecutivoDay(now) && santiagoHour < 16;

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

// Noche · live evening view. The storefront-at-night photo runs full-bleed
// under a dark scrim (the brand lives in the lit sign, so no lockup needed);
// cream editorial chrome overlays it. Rebuilt from the baked "Sábado" PNG as
// a live view so the masthead day is the real weekday — correct any night.
async function AbiertoNoche() {
  await connection();
  const now = new Date();
  const weekday = santiagoWeekday(now);
  return (
    <main
      className="ab-stage ab-stage--noche"
      aria-label="La tarde en Deriva — hasta el cierre"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(18,11,6,0.42) 0%, rgba(18,11,6,0.58) 34%, rgba(18,11,6,0.86) 68%, rgba(18,11,6,0.97) 100%), url(${NOCHE.photo})`
      }}
    >
      <header className="ab-noche-mast">
        <div className="ab-noche-mast__place">
          <span className="ab-noche-mast__day">{weekday}</span>
          <span className="ab-noche-mast__loc">Providencia</span>
        </div>
        <span className="ab-noche-mast__ed">Edición de la tarde</span>
      </header>

      <span className="ab-noche-spacer" aria-hidden="true" />

      <div className="ab-noche-view">
        <span className="ab-noche-kicker">§ La tarde en Deriva</span>
        <h1 className="ab-noche-hero">{NOCHE.hero}</h1>
        <p className="ab-noche-sub">{NOCHE.sub}</p>

        <ul className="ab-noche-list">
          {NOCHE.items.map((it) => (
            <li key={it.roman} className="ab-noche-row">
              <span className="ab-noche-row__num">{it.roman}</span>
              <span className="ab-noche-row__body">
                <span className="ab-noche-row__name">{it.name}</span>
                <span className="ab-noche-row__note">{it.note}</span>
              </span>
              <span className="ab-noche-row__price">{it.price}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="ab-noche-foot">
        <div className="ab-noche-foot__col">
          <span>Magnere 1570 · Local 105</span>
          <span>Providencia · Santiago</span>
        </div>
        <div className="ab-noche-foot__col ab-noche-foot__col--right">
          <span>@deriva.coffee.studio</span>
          <span>Hoy hasta las 21 h</span>
        </div>
      </footer>
    </main>
  );
}

async function AbiertoRotator({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await connection();
  // QA hook: `?view=abierto|ejecutivo|noche` renders one view solid (no
  // rotation, no time gating) so a panel can be checked any time of day.
  // Read inside the Suspense boundary so the dynamic access doesn't block
  // the static shell from prerendering.
  const { view: preview } = await searchParams;
  if (preview) {
    const node =
      preview === "ejecutivo" ? <AbiertoEjecutivo /> :
      preview === "noche" ? <AbiertoNoche /> :
      <AbiertoDisplay />;
    return <CrossfadeRotator className="ab-rotator" views={[{ key: preview, node }]} />;
  }
  // The rotation set is time- and weekday-dependent. The page meta-refresh
  // re-evaluates within 10 minutes, and CrossfadeRotator generates keyframes
  // for whatever count is active.
  const now = new Date();
  const santiagoHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hour12: false
    }).format(now)
  );
  // Weekday lunch (until 16:00): a two-view loop — the Abierto splash (20s)
  // and the Menu Ejecutivo panel (30s). The executive menu advertises ahead
  // of + during service.
  const showEjecutivo = isMenuEjecutivoDay(now) && santiagoHour < 16;
  // From 16:00 until close the Menu Ejecutivo drops out and the evening night
  // art (45s) takes the second slot. Gated on open hours so it never runs on
  // Sunday (closed) or after the 21:00 close.
  const showNoche = santiagoHour >= 16 && isOpenNow(now);

  if (showEjecutivo) {
    return (
      <CrossfadeRotator
        className="ab-rotator"
        views={[
          { key: "abierto", node: <AbiertoDisplay />, hold: 20 },
          { key: "ejecutivo", node: <AbiertoEjecutivo />, hold: 30 }
        ]}
      />
    );
  }

  if (showNoche) {
    return (
      <CrossfadeRotator
        className="ab-rotator"
        views={[
          { key: "abierto", node: <AbiertoDisplay />, hold: 20 },
          { key: "noche", node: <AbiertoNoche />, hold: 45 }
        ]}
      />
    );
  }

  // Otherwise (weekend daytime, or weekday evening past close): the Abierto
  // splash alone.
  return (
    <CrossfadeRotator
      className="ab-rotator"
      views={[{ key: "abierto", node: <AbiertoDisplay />, hold: 20 }]}
    />
  );
}

export default function AbiertoPage({
  searchParams
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <>
      {/* TV display: reload every 10 minutes to refresh date + edition number. */}
      <meta httpEquiv="refresh" content="600" />
      <Suspense fallback={<main className="ab-stage" />}>
        <AbiertoRotator searchParams={searchParams} />
      </Suspense>
    </>
  );
}
