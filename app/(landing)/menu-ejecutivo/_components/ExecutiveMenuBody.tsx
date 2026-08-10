import Link from "next/link";

import {
  EXECUTIVE_MENU_STABLE_HOURS,
  type buildExecutiveMenuPresentation
} from "../../../../src/seo/executive-menu";
import { MAPS_URL } from "../../../../src/seo/local-business";
import cartaStyles from "../../menu/carta.module.css";
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
    <div className={cartaStyles.shell} data-theme="dark">
      <div className={`${cartaStyles.page} ${styles.page}`}>
        <header className={`${cartaStyles.masthead} ${styles.masthead}`}>
          <div className={cartaStyles.editionRow}>
            <span className={cartaStyles.edition}>
              §07 · Almuerzo de semana · Magnere 1570
            </span>
          </div>
          <h1 className={`${cartaStyles.mastTitle} ${styles.mastTitle}`}>
            Menú Ejecutivo en Providencia
          </h1>
          <p className={cartaStyles.mastLede}>
            Una pausa en cuatro tiempos: bebida, entrada, fondo y postre. La
            edición cambia cada jornada y se publica con los datos del servicio.
          </p>
          <div className={cartaStyles.mastNote}>
            <span className={cartaStyles.mastDot} aria-hidden="true" />
            <span className={cartaStyles.mastNoteText}>
              {EXECUTIVE_MENU_STABLE_HOURS}
            </span>
          </div>
        </header>

        <section
          className={`${cartaStyles.insert} ${styles.insert}`}
          aria-labelledby="executive-menu-edition"
        >
          <div className={`${cartaStyles.insertTop} ${styles.insertTop}`}>
            <span className={cartaStyles.insertKicker}>§ Edición del día</span>
            <span className={cartaStyles.insertHours}>
              {EXECUTIVE_MENU_STABLE_HOURS}
            </span>
          </div>

          {presentation.availableToday ? (
            <>
              <div className={cartaStyles.insertHead}>
                <span className={cartaStyles.autorKicker}>Menú Ejecutivo</span>
                <h2
                  className={`${cartaStyles.insertHero} ${styles.editionTitle}`}
                  id="executive-menu-edition"
                >
                  {presentation.dateLabel}
                </h2>
                <span className={cartaStyles.insertSub}>
                  Bebida, entrada, fondo y postre.
                </span>
              </div>

              <div className={cartaStyles.courses}>
                <ol className={styles.courseList}>
                  {presentation.courses.map((course) => (
                    <li className={cartaStyles.course} key={course.id}>
                      <span className={cartaStyles.courseNum} aria-hidden="true">
                        {course.numeral}
                      </span>
                      <span className={cartaStyles.rowMain}>
                        <span className={cartaStyles.courseTag}>{course.tag}</span>
                        <span className={cartaStyles.courseName}>{course.name}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className={cartaStyles.insertPrice}>
                  <span className={cartaStyles.insertPriceLabel}>Precio fijo</span>
                  <span
                    className={cartaStyles.insertPriceValue}
                    aria-label={`Precio ${presentation.priceLabel}`}
                  >
                    {presentation.priceLabel}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className={`${cartaStyles.insertHead} ${styles.unavailable}`}>
              <span className={cartaStyles.autorKicker}>Menú Ejecutivo</span>
              <h2
                className={`${cartaStyles.insertHero} ${styles.editionTitle}`}
                id="executive-menu-edition"
              >
                Aún no hay una edición publicada.
              </h2>
              <span className={cartaStyles.insertSub}>
                {presentation.subline}
              </span>
            </div>
          )}
        </section>

        <footer className={`${cartaStyles.footer} ${styles.footer}`}>
          <p className={cartaStyles.footerText}>
            Deriva Coffee Studio
            <br />
            Magnere 1570, Local 105 · Providencia
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/menu">
              Ver el menú
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
    </div>
  );
}
