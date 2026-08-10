import Link from "next/link";

import {
  EXECUTIVE_MENU_STABLE_HOURS,
  type buildExecutiveMenuPresentation
} from "../../../../src/seo/executive-menu";
import { MAPS_URL } from "../../../../src/seo/local-business";
import styles from "../menu-ejecutivo.module.css";

type ExecutiveMenuPresentation = ReturnType<
  typeof buildExecutiveMenuPresentation
>;

export function ExecutiveMenuBody({
  presentation
}: {
  presentation: ExecutiveMenuPresentation;
}) {
  return (
    <div className={styles.body}>
      <header className={styles.hero}>
        <div className={styles.slug}>
          <span className={styles.slugRule} aria-hidden="true" />
          <span>§ Almuerzo de semana · Magnere 1570</span>
        </div>
        <h1 className={styles.title}>Menú Ejecutivo en Providencia</h1>
        <p className={styles.hours}>{EXECUTIVE_MENU_STABLE_HOURS}</p>
        <p className={styles.lede}>
          Una pausa en cuatro tiempos: bebida, entrada, fondo y postre. La
          edición cambia cada jornada y se publica con los datos del servicio.
        </p>
      </header>

      <section
        className={styles.edition}
        aria-labelledby="executive-menu-edition"
      >
        {presentation.availableToday ? (
          <>
            <div className={styles.editionHead}>
              <div>
                <p className={styles.eyebrow}>Edición publicada</p>
                <h2 className={styles.editionTitle} id="executive-menu-edition">
                  {presentation.dateLabel}
                </h2>
              </div>
              <p className={styles.price} aria-label={`Precio ${presentation.priceLabel}`}>
                {presentation.priceLabel}
              </p>
            </div>

            <ol className={styles.courses}>
              {presentation.courses.map((course) => (
                <li className={styles.course} key={course.id}>
                  <span className={styles.numeral} aria-hidden="true">
                    {course.numeral}
                  </span>
                  <span className={styles.courseText}>
                    <span className={styles.courseTag}>{course.tag}</span>
                    <span className={styles.courseName}>{course.name}</span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className={styles.unavailable}>
            <p className={styles.eyebrow}>Edición de hoy</p>
            <h2 className={styles.editionTitle} id="executive-menu-edition">
              Aún no hay una edición publicada.
            </h2>
            <p className={styles.unavailableCopy}>{presentation.subline}</p>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p className={styles.address}>
          Deriva Coffee Studio
          <span>Magnere 1570, Local 105 · Providencia</span>
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/menu">
            Ver la carta completa
          </Link>
          <a
            className={styles.secondaryAction}
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cómo llegar
          </a>
        </div>
      </footer>
    </div>
  );
}
