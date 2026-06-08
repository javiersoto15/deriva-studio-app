import type { Metadata } from "next";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/deriva-match-up`;
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";
const MAPS_URL = "https://maps.google.com/?q=Magnere+1570+Local+105+Providencia";

export const metadata: Metadata = {
  title: "Deriva Match Up — Trae tu boleta, igualamos tu café",
  description:
    "Trae la boleta del café que tomas siempre en otra cafetería y en Deriva te igualamos el precio. Válido hasta el 30 de junio, una vez por persona. Magnere 1570 Local 105, Providencia.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Deriva Match Up · Trae tu boleta, igualamos tu café",
    description:
      "Igualamos el precio de tu café de siempre. Hasta el 30 de junio, una vez por persona.",
    url: pageUrl,
    type: "website"
  }
};

// Each step mirrors the /resenas numbered-row rhythm: a mono numeral, an
// uppercase label, and a single line of body.
const STEPS = [
  {
    n: "01",
    label: "Trae tu boleta",
    body: "La del café que tomas siempre en otra cafetería."
  },
  {
    n: "02",
    label: "Muéstrala en la barra",
    body: "En Magnere 1570 Local 105, Providencia. Con tu carnet."
  },
  {
    n: "03",
    label: "Igualamos el precio",
    body: "Pagas lo mismo que pagabas allá — precio mínimo Deriva $1.200."
  }
];

export default function DerivaMatchUpPage() {
  return (
    <div className="resenas-shell">
      <SiteNav active="match-up" variant="solid" />
      <main className="resenas-page" aria-labelledby="matchup-title">
        <div className="resenas-spread">
          {/* Left rail — the offer, with edition masthead + colophon. */}
          <aside className="resenas-rail" aria-hidden="true">
            <DerivaImage
              slug="cappuccino"
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className="resenas-rail__photo"
            />
            <div className="resenas-rail__scrim" />
            <div className="resenas-rail__mast">
              <span>Vol. 001</span>
              <span className="resenas-rail__tick" />
              <span className="resenas-rail__ed">Deriva Match Up · MMXXVI</span>
            </div>
            <div className="resenas-rail__foot">
              <p className="resenas-rail__quote">
                Tráenos la boleta de tu café de siempre. Te lo igualamos.
              </p>
              <span className="resenas-rail__colophon">
                Magnere 1570 · Providencia · Hasta el 30 de junio
              </span>
            </div>
          </aside>

          {/* Right column — header, how-it-works, terms, coda. */}
          <div className="resenas-col">
            <header className="resenas-head">
              <div className="landing-slug">
                <span className="landing-slug__rule" aria-hidden="true" />
                <span>§ Deriva Match Up</span>
              </div>
              <h1 id="matchup-title" className="resenas-head__title">
                Trae tu boleta, <em>igualamos tu café.</em>
              </h1>
              <p className="matchup-lede">
                ¿Tomas siempre el mismo café en otra cafetería? Tráenos la boleta
                a la barra y te igualamos el precio.
              </p>
            </header>

            <section className="matchup-steps" aria-label="Cómo funciona">
              {STEPS.map((step) => (
                <div key={step.n} className="resenas-row">
                  <span className="resenas-row__num" aria-hidden="true">
                    {step.n}
                  </span>
                  <div className="resenas-row__body">
                    <span className="resenas-label">{step.label}</span>
                    <span className="matchup-step__body">{step.body}</span>
                  </div>
                </div>
              ))}
            </section>

            <p className="matchup-terms matchup-terms--public">
              Válido hasta el 30 de junio · una vez por RUT · solo café.
              Guardamos tu RUT cifrado para validar una igualación por persona.{" "}
              <a className="matchup-baseslink" href="/deriva-match-up/bases">
                Ver bases →
              </a>
            </p>

            <section className="resenas-coda" aria-label="Visítanos">
              <p className="resenas-coda__title">Crea tu propia Deriva.</p>
              <div className="resenas-coda__links">
                <a
                  className="resenas-coda__cta"
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cómo llegar →
                </a>
                <a
                  className="resenas-coda__ig"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @deriva.coffee.studio →
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <footer className="landing-footer">
        <span className="landing-footer__brand">
          <span className="landing-diamond" aria-hidden="true" />
          Deriva Coffee Studio
        </span>
        <span>Edición continuada · MMXXVI</span>
        <span>derivastudio.cl</span>
      </footer>
    </div>
  );
}
