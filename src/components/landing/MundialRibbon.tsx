import Link from "next/link";

/**
 * Slim always-visible fixed ribbon pinned to the very top of the homepage,
 * promoting the World Cup pool campaign at /mundial. Sits above the SiteNav
 * (which is offset down by --mundial-ribbon-h via the .has-mundial-ribbon
 * wrapper class on the homepage root).
 */
export function MundialRibbon() {
  return (
    <Link href="/mundial" className="mundial-ribbon" aria-label="La Polla del Mundial — juega en derivastudio.cl/mundial">
      <span className="mundial-ribbon__inner">
        <span className="mundial-ribbon__diamond" aria-hidden="true" />
        <span className="mundial-ribbon__copy">
          <span className="mundial-ribbon__copy--full">
            La Polla del Mundial · predice los marcadores de hoy y gánate un café
          </span>
          <span className="mundial-ribbon__copy--short">
            La Polla del Mundial · predice y gana café
          </span>
        </span>
        <span className="mundial-ribbon__cta">Juega →</span>
      </span>
    </Link>
  );
}
