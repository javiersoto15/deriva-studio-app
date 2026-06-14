import Link from "next/link";

/**
 * Hero feature band for the World Cup pool campaign. Inserted right after the
 * Hero on the homepage, before the BarPanel. Espresso-ground editorial band:
 * left text column + right CTA, stacking on mobile. Whole CTA links to /mundial.
 */
export function MundialTeaser() {
  return (
    <section className="mundial-teaser" aria-labelledby="mundial-teaser-title">
      <div className="mundial-teaser__inner">
        <div className="mundial-teaser__text">
          <div className="mundial-teaser__slug">
            <span className="mundial-teaser__slug-rule" aria-hidden="true" />
            <span>§ La Polla del Mundial · 2026</span>
          </div>

          <h2 id="mundial-teaser-title" className="mundial-teaser__heading">
            <em>La Polla del</em>
            <br />
            <span className="mundial-teaser__heading-accent">Mundial.</span>
          </h2>

          <p className="mundial-teaser__tiers">
            <span className="mundial-teaser__tier-num">01</span>{" "}
            <span className="mundial-teaser__tier-label">Café simple</span>{" "}
            <span className="mundial-teaser__tier-dot">·</span>{" "}
            <span className="mundial-teaser__tier-num">02</span>{" "}
            <span className="mundial-teaser__tier-label">Campesino</span>{" "}
            <span className="mundial-teaser__tier-dot">·</span>{" "}
            <span className="mundial-teaser__tier-num">03</span>{" "}
            <span className="mundial-teaser__tier-label">Combo para dos</span>
          </p>

          <p className="mundial-teaser__lede">
            Adivina el marcador exacto de los partidos de hoy. Si le achuntas, te llevas café —
            desde un simple hasta un combo para dos Campesinos.
          </p>
        </div>

        <div className="mundial-teaser__action">
          <Link href="/mundial" className="mundial-teaser__cta">
            Juega la polla <span aria-hidden="true">→</span>
          </Link>
          <span className="mundial-teaser__url">derivastudio.cl/mundial</span>
        </div>
      </div>
    </section>
  );
}
