import { Fragment } from "react";
import type { MenuSection as MenuSectionType } from "../../data/menu";
import {
  MENU_EJECUTIVO_FIXED,
  MENU_EJECUTIVO_TODAY,
  type MenuEjecutivoCourse
} from "../../data/menu-ejecutivo";
import { matchesSchedule, type Schedule } from "../../data/menu-schedule";
import { MenuItem } from "./MenuItem";

type Props = {
  section: MenuSectionType;
  showPrices?: boolean;
  temporarilyUnavailableIds?: ReadonlySet<string>;
  currentSchedule?: Schedule;
  menuEjecutivoDateLabel?: string;
};


// Apertura redirect map: section id → ids of sections to recommend instead.
// Mirrors the companion app's FRONTEND_REDIRECT_SECTIONS so both surfaces tell
// customers the same story.
const SECTION_REDIRECTS: Record<string, ReadonlyArray<{ id: string; label: string }>> = {
  baguettes: [
    { id: "focaccias", label: "Focaccias" },
    { id: "croissants", label: "Croissants" }
  ]
};

function isFullyUnavailable(section: MenuSectionType): boolean {
  const items = section.items ?? section.subgroups?.flatMap((g) => g.items) ?? [];
  return items.length > 0 && items.every((i) => i.unavailable === true);
}

export function MenuSection({
  section,
  showPrices = false,
  temporarilyUnavailableIds,
  currentSchedule,
  menuEjecutivoDateLabel
}: Props) {
  const isMenuEjecutivo = section.id === "menu-ejecutivo";
  // Filter subgroups + items by day-of-week schedule when one is known.
  const visibleSubgroups = currentSchedule
    ? (section.subgroups ?? [])
        .filter((g) => matchesSchedule(currentSchedule, g.schedule))
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => matchesSchedule(currentSchedule, i.schedule))
        }))
        .filter((g) => g.items.length > 0)
    : section.subgroups;
  const visibleItems = currentSchedule
    ? section.items?.filter((i) => matchesSchedule(currentSchedule, i.schedule))
    : section.items;
  const count =
    (visibleItems?.length ?? 0) +
    (visibleSubgroups?.reduce((acc, g) => acc + g.items.length, 0) ?? 0);
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
            {section.countOverride ??
              (isMenuEjecutivo
                ? menuEjecutivoDateLabel ?? ""
                : showRedirect
                  ? "vuelve pronto"
                  : `${count} ítem${count === 1 ? "" : "s"}`)}
          </span>
        </div>
        <div className={isMenuEjecutivo ? "menu-section__title-row" : undefined}>
          <h2 id={`heading-${section.id}`} className="menu-section__title">
            {section.fullItalic ? (
              <em>{section.title}</em>
            ) : section.italicWord ? (
              <>
                {section.title} <em>{section.italicWord}</em>
              </>
            ) : (
              section.title
            )}
          </h2>
          {isMenuEjecutivo && showPrices ? (
            <span className="menu-section__title-price">
              $ {MENU_EJECUTIVO_FIXED.priceClp.toLocaleString("es-CL")}
            </span>
          ) : null}
        </div>
        {isMenuEjecutivo ? (
          <p className="menu-section__hero-phrase">{MENU_EJECUTIVO_FIXED.hero}</p>
        ) : null}
        <p className={`menu-section__lede ${section.ledeItalic ? "menu-section__lede--italic" : ""}`}>
          {section.lede}
        </p>
        {section.serviceWindow ? (
          <p className="menu-section__hours" aria-label="Horario de servicio">
            <span className="menu-section__hours-rule" aria-hidden="true" />
            {section.serviceWindow}
          </p>
        ) : null}
      </header>

      {isMenuEjecutivo ? (
        <ol className="menu-ejecutivo-courses">
          {(["bebida", "entrada", "fondo", "queque"] as const).map((key, idx) => (
            <EjecutivoCourse
              key={key}
              numeral={["i", "ii", "iii", "iv"][idx]}
              course={MENU_EJECUTIVO_TODAY.courses[key]}
              tag={MENU_EJECUTIVO_FIXED.courseTags[key]}
            />
          ))}
        </ol>
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
      ) : visibleItems && visibleItems.length > 0 ? (
        <div className="menu-section__items">
          {visibleItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              showPrices={showPrices}
              temporarilyUnavailable={temporarilyUnavailableIds?.has(item.id) ?? false}
            />
          ))}
        </div>
      ) : null}

      {visibleSubgroups?.map((group) => (
        <Fragment key={group.id}>
          {section.addonsBefore === group.id ? renderSectionAddons(section.addons) : null}
          <div className="menu-subgroup">
            <div className="menu-subgroup__label">
              <span className="menu-diamond menu-diamond--green" aria-hidden="true" />
              <span>{group.label}</span>
            </div>
            <div className="menu-section__items">
              {group.items.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  showPrices={showPrices}
                  temporarilyUnavailable={temporarilyUnavailableIds?.has(item.id) ?? false}
                />
              ))}
            </div>
            {group.addons ? (
              <aside className="menu-addons" aria-label={group.addons.label}>
                <div className="menu-addons__label">{group.addons.label}</div>
                {group.addons.hint ? <p className="menu-addons__hint">{group.addons.hint}</p> : null}
                <ul className="menu-addons__chips">
                  {group.addons.chips.map((chip) => (
                    <li key={chip} className="menu-addons__chip">
                      {chip}
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </Fragment>
      ))}

      {section.addonsBefore ? null : renderSectionAddons(section.addons)}
    </section>
  );
}

function EjecutivoCourse({
  numeral,
  course,
  tag
}: {
  numeral: string;
  course: MenuEjecutivoCourse;
  tag: string;
}) {
  return (
    <li className="menu-ejecutivo-course">
      <span className="menu-ejecutivo-course__numeral" aria-hidden="true">
        {numeral}.
      </span>
      <div className="menu-ejecutivo-course__body">
        <span className="menu-ejecutivo-course__name">{course.name}</span>
        {course.note ? (
          <span className="menu-ejecutivo-course__note">{course.note}</span>
        ) : null}
        <span className="menu-ejecutivo-course__tag">{tag}</span>
      </div>
    </li>
  );
}

function renderSectionAddons(addons: MenuSectionType["addons"]) {
  const list = Array.isArray(addons) ? addons : addons ? [addons] : [];
  if (list.length === 0) return null;
  return (
    <>
      {list.map((addon) => (
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
