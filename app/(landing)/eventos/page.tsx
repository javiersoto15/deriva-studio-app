import type { Metadata } from "next";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";
import { PHOTO_BASE_URL } from "../../../src/data/photos";
import { QuoteForm } from "./QuoteForm";
import "./eventos.css";

// Deriva On Wheels — the coffee-cart events page. Every printed QR (flyer,
// roll-up, tent card) resolves here, so the URL is load-bearing: keep the
// route at /eventos and keep it in LANDING_PREFIXES (src/middleware/host.ts).
//
// Photo-led, after the Refero + Mobbin board (Paper page "Eventos · Coffee
// Cart"): every section is a full-bleed photo with the type, tickets, ticker
// and inset sitting ON the image.
//   hero    → Escape Cafe "GRAIN" (cropped giant word, outlined tickets + ticker
//             over the photo, side rail)
//   barista → Escape Cafe "When you focus" (headline split diagonally)
//   incluye → Escape Cafe mission (inset photo on photo, corner captions,
//             coordinates) + Monte menu board set in cream on the photo
//   pasos   → Escape single rule-topped band
//
// Copy rule (founder): name the offer, never specific carta-de-autor drinks.

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/eventos`;
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";
const EMAIL = "hola@derivastudio.cl";
const COORDS = "33.4258° S · 70.6187° W";
// Public café line (same number as the JSON-LD `telephone`) — on WhatsApp.
const WHATSAPP_URL = `https://wa.me/56984520118?text=${encodeURIComponent(
  "Hola Deriva, quiero cotizar el carro On Wheels para un evento."
)}`;
const PHONE_LABEL = "+56 9 8452 0118";
// Full-frame transparent cutout of the espresso machine from cart-frente.
// It shares the background photo's object-fit/position, so it always lands
// exactly on top of the machine — and in front of the giant word.
const PHOTO_BASE = process.env.NEXT_PUBLIC_PHOTO_BASE_URL ?? PHOTO_BASE_URL;
const MACHINE_CUTOUT = `${PHOTO_BASE}/cart-frente-maquina-cutout-v2.webp`;
// Founder rule: the price is quoted per event, never a fixed list price.
const PRICE_NOTE = "El valor depende del número de personas y de cafés.";

function quoteHref(kind?: string): string {
  const subject = kind
    ? `Cotización · Deriva On Wheels · ${kind}`
    : "Cotización · Deriva On Wheels";
  const body =
    "Hola Deriva,\n\nQueremos el carro para nuestro evento.\n\nFecha:\nLugar / comuna:\nNúmero de personas:\nHorario:\n\nGracias.";
  return `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const metadata: Metadata = {
  title: { absolute: "Deriva On Wheels — Café de especialidad para tu evento" },
  description:
    "Llevamos el carro, la máquina de espresso y a nuestro barista a tu oficina o celebración. Café de especialidad y cafés de autor, preparados al momento; pastelería y sándwiches como adicional. Cotiza tu evento.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Deriva On Wheels · La barra va a tu evento",
    description:
      "Café de especialidad y cafés de autor en tu oficina o celebración. Barista, montaje y limpieza incluidos.",
    url: pageUrl,
    type: "website"
  }
};

const TICKETS = [
  { title: "Café de especialidad", tipo: "Espresso · americano", extra: "Cappuccino · latte" },
  { title: "Cafés de autor", tipo: "Recetas de la casa", extra: "Al momento" },
  { title: "Para sumar", tipo: "Pastelería", extra: "Sándwiches" }
];

const TICKER = [
  "La barra va a tu evento",
  "Café de especialidad",
  "Cafés de autor",
  "Oficinas",
  "Celebraciones",
  "Montaje y retiro"
];

// What the service includes, regrouped as a café board. Pastelería and
// sándwiches are ADD-ONS (founder, 2026-11-18) — quoted apart, never "incl.".
type BoardItem = { name: string; note: string; addon?: boolean };
const BOARD: { heading: string; items: BoardItem[]; foot?: string }[] = [
  {
    heading: "En la barra",
    items: [
      { name: "Café de especialidad", note: "espresso, americano, cappuccino, latte" },
      { name: "Cafés de autor", note: "recetas de la casa, al momento" },
      { name: "Demostración guiada", note: "para todo el grupo" }
    ]
  },
  {
    heading: "Nos encargamos",
    items: [
      { name: "Carro, máquina y molino", note: "la barra completa" },
      { name: "Barista", note: "todo el servicio" },
      { name: "Vasos y vajilla", note: "hielo e ingredientes" },
      { name: "Montaje y limpieza", note: "antes y al cierre" }
    ]
  },
  {
    heading: "Para sumar",
    items: [
      { name: "Pastelería", note: "dulce, para acompañar", addon: true },
      { name: "Sándwiches", note: "salado, a elección", addon: true }
    ],
    foot: "Se cotizan aparte, según cantidad."
  }
];

const STEPS = [
  { n: "01", label: "Cuéntanos tu evento", body: "Fecha, lugar, horario y cuántas personas vienen." },
  { n: "02", label: "Te enviamos la cotización", body: "Según personas y cafés, más lo que quieras sumar." },
  { n: "03", label: "Llegamos y servimos", body: "Montamos antes, servimos al momento y limpiamos al cierre." }
];

function Ticker() {
  // Duplicated run so the CSS marquee loops seamlessly; the copy is
  // aria-hidden so screen readers hear the list once.
  const run = (hidden: boolean) => (
    <span className="ev-ticker__run" aria-hidden={hidden || undefined}>
      {TICKER.map((t) => (
        <span key={t} className="ev-ticker__item">
          <span aria-hidden="true">↑</span>
          {t}
          <span aria-hidden="true">*</span>
        </span>
      ))}
    </span>
  );
  return (
    <div className="ev-ticker">
      <div className="ev-ticker__track">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}

function Stamp() {
  return (
    <svg className="ev-stamp" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path id="ev-stamp-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="98" className="ev-stamp__disc" />
      <circle cx="100" cy="100" r="88" className="ev-stamp__rule" />
      <circle cx="100" cy="100" r="54" className="ev-stamp__rule" />
      <text className="ev-stamp__ring">
        <textPath href="#ev-stamp-ring">Servicio completo · Montaje y retiro ·</textPath>
      </text>
      <text x="100" y="94" textAnchor="middle" className="ev-stamp__core">On</text>
      <text x="100" y="122" textAnchor="middle" className="ev-stamp__core">Wheels</text>
    </svg>
  );
}

export default function EventosPage() {
  return (
    <div className="ev">
      <SiteNav active="eventos" />
      <main aria-labelledby="ev-title">
        {/* — 1 · Hero: the cart, full-bleed; everything sits on it. ——— */}
        <section className="ev-sheet ev-hero">
          <DerivaImage
            slug="cart-frente"
            alt="El carro de Deriva On Wheels frente a nuestro local en Providencia"
            fill
            priority
            sizes="100vw"
            className="ev-bg ev-bg--hero"
          />
          <div className="ev-tint" aria-hidden="true" />

          <h1 id="ev-title" className="ev-word">
            <span className="ev-sr">Deriva </span>On Wheels
          </h1>

          <img src={MACHINE_CUTOUT} alt="" aria-hidden="true" className="ev-cutout" />

          <aside className="ev-rail" aria-hidden="true">
            Magnere 1570 · Providencia · {COORDS}
          </aside>

          <div className="ev-hero__pitch">
            {/* Seal hangs off the panel's top-right corner, sticker-style. */}
            <Stamp />
            <span className="ev-corner ev-corner--ochre">Qué es On Wheels</span>
            <p className="ev-pitch__body">
              Llevamos el carro, la máquina de espresso y a nuestro barista a tu
              oficina o celebración. Cafés de autor y clásicos, preparados al
              momento.
            </p>
            <p className="ev-pitch__why">
              Lo hacemos para que el mismo sabor y la misma calidad de nuestra
              barra lleguen a todas partes.
            </p>
            <div className="ev-pitch__actions">
              <a className="ev-tag" href="#cotizar">
                Cotiza tu evento →
              </a>
              <a
                className="ev-pitch__wa"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                o por WhatsApp
              </a>
            </div>
          </div>

          <div className="ev-hero__base">
            <div className="ev-tickets">
              <div className="ev-ticket ev-ticket--brand">
                <span className="ev-ticket__lead">
                  <em>Deriva,</em>
                </span>
                <span className="ev-ticket__brand">La barra va a tu evento</span>
              </div>
              {TICKETS.map((t) => (
                <div key={t.title} className="ev-ticket">
                  <span className="ev-ticket__title">{t.title}</span>
                  <span className="ev-ticket__row">
                    <span>Tipo</span>
                    <span>{t.tipo}</span>
                  </span>
                  <span className="ev-ticket__row">
                    <span>Y más</span>
                    <span>{t.extra}</span>
                  </span>
                </div>
              ))}
            </div>
            <Ticker />
          </div>
        </section>

        {/* — 2 · The barista, headline split across the photo. ————— */}
        <section className="ev-sheet ev-split" aria-labelledby="ev-split-title">
          <DerivaImage
            slug="cart-barista"
            alt="Nuestro barista preparando café en el carro"
            fill
            sizes="100vw"
            className="ev-bg ev-bg--barista"
          />
          <div className="ev-tint ev-tint--soft" aria-hidden="true" />
          <h2 id="ev-split-title" className="ev-split__title">
            <span className="ev-split__top">Tú invitas,</span>
            <span className="ev-split__bottom">nosotros servimos.</span>
          </h2>
          <p className="ev-caps ev-split__body">
            Un barista de Deriva durante todo el servicio. Café de especialidad y
            cafés de autor, preparados al momento, frente a tus invitados.
          </p>
        </section>

        {/* — 3 · What's included: the board, on the machine photo. ——— */}
        <section id="carta" className="ev-sheet ev-board" aria-labelledby="ev-board-title">
          <DerivaImage
            slug="cart-maquina"
            alt=""
            fill
            sizes="100vw"
            className="ev-bg ev-bg--machine"
          />
          <div className="ev-tint ev-tint--deep" aria-hidden="true" />

          <div className="ev-board__top">
            <span className="ev-corner">§ La carta rodante</span>
            <h2 id="ev-board-title" className="ev-board__title">
              Lo que trae el carro, <em>y lo que puedes sumar.</em>
            </h2>
          </div>

          <div className="ev-board__mid">
            <div className="ev-board__cols">
              {BOARD.map((col) => (
                <div key={col.heading} className="ev-col">
                  <h3 className="ev-col__head">{col.heading}</h3>
                  <ul className="ev-col__list">
                    {col.items.map((item) => (
                      <li key={item.name} className="ev-item">
                        <span className="ev-item__line">
                          <span className="ev-item__name">{item.name}</span>
                          <span className="ev-item__dots" aria-hidden="true" />
                          <span
                            className={`ev-item__mark${item.addon ? " ev-item__mark--addon" : ""}`}
                          >
                            {item.addon ? "+ adicional" : "incl."}
                          </span>
                        </span>
                        <span className="ev-item__note">{item.note}</span>
                      </li>
                    ))}
                  </ul>
                  {col.foot ? <p className="ev-col__foot">{col.foot}</p> : null}
                </div>
              ))}
            </div>
            <figure className="ev-inset">
              <div className="ev-inset__img">
                <DerivaImage
                  slug="cart-frente"
                  alt="El carro completo, listo para servir"
                  fill
                  sizes="(max-width: 900px) 60vw, 22vw"
                  className="ev-img"
                />
              </div>
            </figure>
          </div>

          <div className="ev-board__foot">
            <span className="ev-corner">La barra completa</span>
            <span className="ev-coords">{COORDS}</span>
            <span className="ev-corner">Valor según personas y cafés</span>
          </div>
        </section>

        {/* — 4 · Steps: one compact rule-topped band. ———————————————— */}
        <ol className="ev-steps" aria-label="Cómo funciona">
          {STEPS.map((s) => (
            <li key={s.n} className="ev-step">
              <span className="ev-step__head">
                <span className="ev-step__n">{s.n}</span>
                <span className="ev-step__label">{s.label}</span>
              </span>
              <span className="ev-step__body">{s.body}</span>
            </li>
          ))}
        </ol>

        {/* — 5 · Coda: price note + quote form + direct channels. ———— */}
        <section id="cotizar" className="ev-coda" aria-labelledby="ev-coda-title">
          <div className="ev-coda__lead">
            <span className="ev-corner ev-corner--ochre">§ Deriva On Wheels</span>
            <h2 id="ev-coda-title" className="ev-coda__title">
              Cotiza <em>tu evento.</em>
            </h2>
            <p className="ev-coda__body">
              {PRICE_NOTE} Cuéntanos cuántos vienen y te enviamos la cotización
              exacta, con pastelería y sándwiches si quieres sumarlos.
            </p>
            <ul className="ev-contact" aria-label="Otras formas de contacto">
              <li>
                <span className="ev-contact__k">Correo</span>
                <a href={quoteHref()}>{EMAIL}</a>
              </li>
              <li>
                <span className="ev-contact__k">WhatsApp</span>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  {PHONE_LABEL} →
                </a>
              </li>
              <li>
                <span className="ev-contact__k">Instagram</span>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  @deriva.coffee.studio
                </a>
              </li>
              <li>
                <span className="ev-contact__k">En persona</span>
                <span>Magnere 1570 Local 105, Providencia</span>
              </li>
            </ul>
          </div>
          <QuoteForm />
        </section>
      </main>
      <footer className="landing-footer">
        <span className="landing-footer__brand">
          <span className="landing-diamond" aria-hidden="true" />
          Deriva Coffee Studio
        </span>
        <span>Deriva On Wheels · MMXXVI</span>
        <span>derivastudio.cl/eventos</span>
      </footer>
    </div>
  );
}
