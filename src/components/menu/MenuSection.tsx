import { Fragment } from "react";
import type {
  PublicMenuSection,
  PublicMenuAddon,
  ExecutiveMenu
} from "../../api/server";
import { MenuItem } from "./MenuItem";

type Props = {
  section: PublicMenuSection;
  showPrices?: boolean;
};

// Apertura redirect map: section id → ids of sections to recommend instead.
// Triggers when every item in the section is backend-marked unavailable.
const SECTION_REDIRECTS: Record<string, ReadonlyArray<{ id: string; label: string }>> = {
  baguettes: [
    { id: "focaccias", label: "Focaccias" },
    { id: "croissants", label: "Croissants" }
  ]
};

function isFullyUnavailable(section: PublicMenuSection): boolean {
  const items = section.items ?? section.subgroups?.flatMap((g) => g.items) ?? [];
  return items.length > 0 && items.every((i) => i.available === false);
}

export function MenuSection({ section, showPrices = false }: Props) {
  const executive = section.executive_menu;
  const isMenuEjecutivo = executive != null;
  const items = section.items ?? [];
  const subgroups = section.subgroups ?? [];
  const count =
    items.length + subgroups.reduce((acc, g) => acc + g.items.length, 0);
  const emphasisClass = `menu-section menu-section--${section.emphasis}`;
  const redirects = SECTION_REDIRECTS[section.id];
  const showRedirect = redirects && isFullyUnavailable(section);

  return (
    <section id={`section-${section.id}`} className={emphasisClass} aria-labelledby={`heading-${section.id}`}>
      <header className="menu-section__heading">
        <div className="menu-section__numeral-row">
          <span className="menu-section__numeral" aria-hidden="true">
            {section.numeral}
          </span>
          <span className="menu-section__count">
            {isMenuEjecutivo
              ? executive.date_label
              : showRedirect
                ? "vuelve pronto"
                : `${count} ítem${count === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className={isMenuEjecutivo ? "menu-section__title-row" : undefined}>
          <h2 id={`heading-${section.id}`} className="menu-section__title">
            {section.full_italic ? (
              <em>{section.title}</em>
            ) : section.italic_word ? (
              <>
                {section.title} <em>{section.italic_word}</em>
              </>
            ) : (
              section.title
            )}
          </h2>
          {isMenuEjecutivo && showPrices ? (
            <span className="menu-section__title-price">
              {executive.price_label ?? `$ ${executive.price_clp.toLocaleString("es-CL")}`}
            </span>
          ) : null}
        </div>
        {isMenuEjecutivo ? (
          <p className="menu-section__hero-phrase">{executive.hero}</p>
        ) : null}
        <p className={`menu-section__lede ${section.lede_italic ? "menu-section__lede--italic" : ""}`}>
          {section.lede}
        </p>
        {section.service_window ? (
          <p className="menu-section__hours" aria-label="Horario de servicio">
            <span className="menu-section__hours-rule" aria-hidden="true" />
            {section.service_window}
          </p>
        ) : null}
      </header>

      {isMenuEjecutivo ? (
        <ExecutiveCourses executive={executive} />
      ) : showRedirect ? (
        <div className="menu-section__redirect">
          <p className="menu-section__redirect-lede">
            {section.title.replace(/\.$/, "")} llega más adelante. Mientras tanto, prueba nuestras
          </p>
          <ul className="menu-section__redirect-chips">
            {redirects!.map((alt) => (
              <li key={alt.id}>
                <a className="menu-section__redirect-chip" href={`#section-${alt.id}`}>
                  {alt.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : items.length > 0 ? (
        <div className="menu-section__items">
          {items.map((item) => (
            <MenuItem key={item.id} item={item} showPrices={showPrices} />
          ))}
        </div>
      ) : null}

      {subgroups.map((group) => (
        <Fragment key={group.id}>
          {section.addons_before === group.id ? renderSectionAddons(section.addons) : null}
          <div className="menu-subgroup">
            <div className="menu-subgroup__label">
              <span className="menu-diamond menu-diamond--green" aria-hidden="true" />
              <span>{group.label}</span>
            </div>
            <div className="menu-section__items">
              {group.items.map((item) => (
                <MenuItem key={item.id} item={item} showPrices={showPrices} />
              ))}
            </div>
            {group.addons ? renderAddon(group.addons) : null}
          </div>
        </Fragment>
      ))}

      {section.addons_before ? null : renderSectionAddons(section.addons)}
    </section>
  );
}

function ExecutiveCourses({ executive }: { executive: ExecutiveMenu }) {
  return (
    <ol className="menu-ejecutivo-courses">
      {executive.courses.map((course) => (
        <li key={course.id} className="menu-ejecutivo-course">
          <span className="menu-ejecutivo-course__numeral" aria-hidden="true">
            {course.numeral}.
          </span>
          <div className="menu-ejecutivo-course__body">
            <span className="menu-ejecutivo-course__name">{course.name}</span>
            {course.note ? (
              <span className="menu-ejecutivo-course__note">{course.note}</span>
            ) : null}
            <span className="menu-ejecutivo-course__tag">{course.tag}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function renderAddon(addon: PublicMenuAddon) {
  return (
    <aside className="menu-addons" aria-label={addon.label}>
      <div className="menu-addons__label">{addon.label}</div>
      {addon.hint ? <p className="menu-addons__hint">{addon.hint}</p> : null}
      <ul className="menu-addons__chips">
        {addon.chips.map((chip) => (
          <li key={chip} className="menu-addons__chip">
            {chip}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function renderSectionAddons(addons: PublicMenuSection["addons"]) {
  if (!addons || addons.length === 0) return null;
  return (
    <>
      {addons.map((addon) => (
        <aside key={addon.label} className="menu-addons menu-addons--section" aria-label={addon.label}>
          <div className="menu-addons__label">{addon.label}</div>
          {addon.hint ? <p className="menu-addons__hint">{addon.hint}</p> : null}
          <ul className="menu-addons__chips">
            {addon.chips.map((chip) => (
              <li key={chip} className="menu-addons__chip">
                {chip}
              </li>
            ))}
          </ul>
        </aside>
      ))}
    </>
  );
}
