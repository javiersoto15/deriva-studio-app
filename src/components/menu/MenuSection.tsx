import type { MenuSection as MenuSectionType } from "../../data/menu";
import { MenuItem } from "./MenuItem";

type Props = {
  section: MenuSectionType;
  showPrices?: boolean;
};

function totalItems(section: MenuSectionType): number {
  if (section.items) return section.items.length;
  return section.subgroups?.reduce((acc, g) => acc + g.items.length, 0) ?? 0;
}

export function MenuSection({ section, showPrices = false }: Props) {
  const count = totalItems(section);
  const emphasisClass = `menu-section menu-section--${section.emphasis}`;

  return (
    <section id={`section-${section.id}`} className={emphasisClass} aria-labelledby={`heading-${section.id}`}>
      <header className="menu-section__heading">
        <div className="menu-section__numeral-row">
          <span className="menu-section__numeral" aria-hidden="true">
            {section.numeral}
          </span>
          <span className="menu-section__count">
            {count} ítem{count === 1 ? "" : "s"}
          </span>
        </div>
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
        <p className={`menu-section__lede ${section.ledeItalic ? "menu-section__lede--italic" : ""}`}>
          {section.lede}
        </p>
      </header>

      {section.items ? (
        <div className="menu-section__items">
          {section.items.map((item) => (
            <MenuItem key={item.id} item={item} showPrices={showPrices} />
          ))}
        </div>
      ) : null}

      {section.subgroups?.map((group) => (
        <div key={group.id} className="menu-subgroup">
          <div className="menu-subgroup__label">
            <span className="menu-diamond menu-diamond--green" aria-hidden="true" />
            <span>{group.label}</span>
          </div>
          <div className="menu-section__items">
            {group.items.map((item) => (
              <MenuItem key={item.id} item={item} showPrices={showPrices} />
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
      ))}

      {(Array.isArray(section.addons) ? section.addons : section.addons ? [section.addons] : []).map((addon) => (
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
    </section>
  );
}
