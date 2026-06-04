import type { Metadata } from "next";
import { SiteNav } from "../../../src/components/landing/SiteNav";
import { ReviewForm } from "../../../src/components/landing/ReviewForm";
import { DerivaImage } from "../../../src/components/landing/DerivaImage";

const siteUrl = "https://derivastudio.cl";
const pageUrl = `${siteUrl}/resenas`;
const INSTAGRAM_URL = "https://www.instagram.com/deriva.coffee.studio/";

export const metadata: Metadata = {
  title: "Deja tu reseña",
  description:
    "Cuéntanos cómo estuvo tu visita a Deriva Coffee Studio en Magnere 1570 Local 105, Providencia. El café, la atención, el ambiente — leemos cada reseña antes de publicarla.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Deja tu reseña · Deriva Coffee Studio",
    description:
      "Cuéntanos cómo estuvo tu visita. Leemos cada reseña antes de publicarla.",
    url: pageUrl,
    type: "website"
  }
};

export default function ResenasPage() {
  return (
    <>
      <SiteNav active="resenas" variant="solid" />
      <main className="resenas-page" aria-labelledby="resenas-title">
        <div className="resenas-spread">
          {/* Left rail — la casa, with edition masthead + colophon. */}
          <aside className="resenas-rail" aria-hidden="true">
            <DerivaImage
              slug="storefront"
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 46vw"
              className="resenas-rail__photo"
            />
            <div className="resenas-rail__scrim" />
            <div className="resenas-rail__mast">
              <span>Vol. 001</span>
              <span className="resenas-rail__tick" />
              <span className="resenas-rail__ed">№ 23 · Otoño MMXXVI</span>
            </div>
            <div className="resenas-rail__foot">
              <p className="resenas-rail__quote">
                Cada taza se calibra con la visita de quien la bebe.
              </p>
              <span className="resenas-rail__colophon">
                Magnere 1570 · Providencia · La casa
              </span>
            </div>
          </aside>

          {/* Right column — header, form, coda. */}
          <div className="resenas-col">
            <header className="resenas-head">
              <div className="landing-slug">
                <span className="landing-slug__rule" aria-hidden="true" />
                <span>§ Tu visita</span>
              </div>
              <h1 id="resenas-title" className="resenas-head__title">
                ¿Cómo estuvo tu momento en <em>Deriva?</em>
              </h1>
            </header>

            <ReviewForm />

            <section className="resenas-coda" aria-label="Después de tu visita">
              <div className="resenas-coda__app">
                <p className="resenas-coda__title">
                  Crea tu propia Deriva. <span>Tu carta y recompensas, muy pronto.</span>
                </p>
                <a className="resenas-coda__cta" href="/companion">
                  Sumarme a la app →
                </a>
              </div>
              <a
                className="resenas-coda__ig"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="resenas-coda__handle">@deriva.coffee.studio</span>
                <span className="resenas-coda__follow">Síguenos en Instagram →</span>
              </a>
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
    </>
  );
}
