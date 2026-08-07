import styles from "../carta.module.css";

// Prerendered fallback for the /menu Suspense boundary.
//
// This is a server component ON PURPOSE: it must land in the static PPR shell,
// which is the whole point. CartaBody is a client component, so nothing of the
// real carta exists in the HTML until its chunk hydrates — previously the
// boundary rendered `null`, leaving a cream .menu-page ground on screen before
// snapping to the carta's nocturno #1a1410. Establishing the dark ground here
// is more important than the placeholder rows.
//
// Anything static in the masthead is rendered VERBATIM (the title, the lede),
// so it paints immediately and never re-flows when the real body arrives. Only
// genuinely backend-derived text (edition number, schedule word, section names,
// item rows) becomes a placeholder bar.
//
// Placeholder bars pulse opacity rather than sweeping a gradient — Deriva uses
// flat grounds, and a shimmer gradient would be off-brand chrome.

const SKELETON_SECTIONS = [
  { rows: 4 },
  { rows: 3 },
  { rows: 4 }
];

export function CartaSkeleton() {
  return (
    <div className={styles.shell} data-theme="dark" aria-busy="true">
      <p className={styles.skSrOnly} role="status">
        Cargando la carta…
      </p>

      <div className={styles.page}>
        {/* The real carta opens on a full-bleed café-de-autor photo, and that
            480px band is what pushes the masthead clear of the fixed SiteNav.
            Reserving it here keeps the masthead at the same Y when the real
            body arrives — without it the skeleton's masthead sits under the
            nav and then jumps down. No background-image: .hero's own
            --panel-2 ground shows through, flat, and the photo fades in. */}
        <div className={styles.hero} aria-hidden="true">
          <div className={styles.heroCaption}>
            <span className={`${styles.skBar} ${styles.skHeroKicker}`} />
            <span className={`${styles.skBar} ${styles.skHeroTitle}`} />
          </div>
        </div>

        <div className={styles.masthead}>
          <div className={styles.editionRow}>
            {/* Edition mark is derived from the payload — placeholder. */}
            <span
              className={`${styles.skBar} ${styles.skEdition}`}
              aria-hidden="true"
            />
            <div className={styles.controls} aria-hidden="true">
              <span className={`${styles.skBar} ${styles.skLang}`} />
              <span className={`${styles.skBar} ${styles.skToggle}`} />
            </div>
          </div>

          {/* Static in CartaBody too — render it for real so it never re-flows. */}
          <h1 className={styles.mastTitle}>La carta</h1>
          <p className={styles.mastLede}>
            Café de especialidad, panadería de masa madre y cocina de mercado. Vigente al servicio en
            Magnere 1570.
          </p>

          <div className={styles.mastNote} aria-hidden="true">
            <span className={styles.mastDot} />
            <span className={`${styles.skBar} ${styles.skNote}`} />
          </div>
        </div>

        <div className={styles.chipNav} aria-hidden="true">
          {[92, 74, 110, 68, 86].map((w, i) => (
            <span
              key={i}
              className={`${styles.skBar} ${styles.skChip}`}
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        <div aria-hidden="true">
          {SKELETON_SECTIONS.map((section, s) => (
            <div key={s} className={styles.skSection}>
              <span className={`${styles.skBar} ${styles.skSecTitle}`} />
              {Array.from({ length: section.rows }, (_, r) => (
                <div key={r} className={styles.skRow}>
                  <span className={`${styles.skBar} ${styles.skRowName}`} />
                  <span className={`${styles.skBar} ${styles.skRowPrice}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
