import Link from "next/link";

import {
  EXECUTIVE_MENU_CARTA_CTA,
  EXECUTIVE_MENU_DIRECTIONS_CTA,
  EXECUTIVE_MENU_FALLBACK_BODY,
  EXECUTIVE_MENU_FALLBACK_TITLE,
  EXECUTIVE_MENU_SHAPE,
  EXECUTIVE_MENU_STABLE_HOURS,
  type ExecutiveMenuPresentation
} from "../../../../src/seo/executive-menu";
import {
  BUSINESS_DESCRIPTOR,
  MAPS_URL,
  SITE_NAME
} from "../../../../src/seo/local-business";
import cartaStyles from "../../menu/carta.module.css";
import styles from "../menu-ejecutivo.module.css";

function ServiceStatus({
  service
}: {
  service: ExecutiveMenuPresentation["service"];
}) {
  return (
    <p
      className={styles.status}
      data-state={service.status}
      role="status"
      aria-live="polite"
    >
      <span className={styles.statusMark} aria-hidden="true" />
      <span className={styles.statusBadge}>{service.badge}</span>
      <span className={styles.statusNote}>{service.note}</span>
    </p>
  );
}

function Actions() {
  return (
    <div className={styles.actions}>
      <Link className={styles.primaryAction} href="/menu">
        {EXECUTIVE_MENU_CARTA_CTA}
      </Link>
      <a
        className={styles.secondaryAction}
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {EXECUTIVE_MENU_DIRECTIONS_CTA}
      </a>
    </div>
  );
}

export function ExecutiveMenuBody({
  presentation
}: {
  presentation: ExecutiveMenuPresentation;
}) {
  const { service } = presentation;

  return (
    <div className={cartaStyles.shell} data-theme="dark">
      <div className={`${cartaStyles.page} ${styles.page}`}>
        <header className={`${cartaStyles.masthead} ${styles.masthead}`}>
          <div className={cartaStyles.editionRow}>
            <span className={`${cartaStyles.edition} ${styles.editionLine}`}>
              §07 · Almuerzo de semana · Magnere 1570
            </span>
          </div>
          {/* The umbrella business name, rendered as visible text directly under
              the masthead — this is a paid Google Ads landing destination and
              the Business Information asset is reviewed against what a human
              can actually read here. */}
          <p className={styles.brandLine}>
            <span className={styles.brandName}>{SITE_NAME}</span>
            <span className={styles.brandDescriptor}>{BUSINESS_DESCRIPTOR}</span>
          </p>
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
          <ServiceStatus service={service} />
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
                  {presentation.subline}
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
                        {course.note ? (
                          <span className={styles.courseNote}>{course.note}</span>
                        ) : null}
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
            /* No published edition for today's Chilean service date. Honest
               state only: no price, no dish, no availability claim. */
            <div className={`${cartaStyles.insertHead} ${styles.unavailable}`}>
              <span className={cartaStyles.autorKicker}>Menú Ejecutivo</span>
              <h2
                className={`${cartaStyles.insertHero} ${styles.editionTitle}`}
                id="executive-menu-edition"
              >
                {EXECUTIVE_MENU_FALLBACK_TITLE}
              </h2>
              <p className={styles.fallbackBody}>{EXECUTIVE_MENU_FALLBACK_BODY}</p>
              <Actions />
            </div>
          )}
        </section>

        <section
          className={styles.shape}
          aria-labelledby="executive-menu-shape-title"
        >
          <div className={`${cartaStyles.insertTop} ${styles.insertTop}`}>
            <span className={cartaStyles.insertKicker}>§ Cómo funciona</span>
            <span className={cartaStyles.insertHours}>
              Ejemplos, no la edición de hoy
            </span>
          </div>
          <h2 className={styles.shapeTitle} id="executive-menu-shape-title">
            La edición rota cada jornada de servicio.
          </h2>
          <p className={styles.shapeLede}>
            Cada día publicamos una edición distinta con cuatro partes. Los
            platos que aparecen abajo son <em>sólo ejemplos ilustrativos</em> de
            lo que suele salir de la cocina — para ver lo de hoy, mira la
            edición del día más arriba.
          </p>
          <ol className={styles.shapeList}>
            {EXECUTIVE_MENU_SHAPE.map((part) => (
              <li className={styles.shapeItem} key={part.id}>
                <span className={styles.shapeNum} aria-hidden="true">
                  {part.numeral}
                </span>
                <span className={styles.shapeMain}>
                  <span className={styles.shapeTag}>{part.tag}</span>
                  <span className={styles.shapeExample}>
                    <span className={styles.shapeExampleLabel}>Por ejemplo:</span>{" "}
                    {part.example}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <footer className={`${cartaStyles.footer} ${styles.footer}`}>
          <p className={cartaStyles.footerText}>
            <strong className={styles.footerBrand}>{SITE_NAME}</strong>
            <br />
            {BUSINESS_DESCRIPTOR}
            <br />
            Magnere 1570, Local 105 · Providencia
          </p>
          <Actions />
        </footer>
      </div>
    </div>
  );
}
