import type { PublicMenuItem } from "../../api/server";

type Props = {
  item: PublicMenuItem;
  showPrices?: boolean;
};

export function MenuItem({ item, showPrices = false }: Props) {
  const unavailable = item.available === false;
  return (
    <article className={`menu-item ${unavailable ? "menu-item--unavailable" : ""}`}>
      <header className="menu-item__title-row">
        <h3 className={`menu-item__name ${item.signature ? "menu-item__name--signature" : ""}`}>
          {item.name}
        </h3>
        <span className="menu-item__badges">
          {unavailable ? (
            <span className="menu-item__soon">Próximamente</span>
          ) : (
            <>
              {item.meta ? <span className="menu-item__meta">{item.meta}</span> : null}
              {showPrices && typeof item.price_clp === "number" ? (
                <span className="menu-item__price">
                  {item.price_label ?? `$ ${item.price_clp.toLocaleString("es-CL")}`}
                </span>
              ) : null}
            </>
          )}
        </span>
      </header>
      <p className="menu-item__description">{item.description}</p>
      {item.tasting_note && !unavailable ? (
        <aside className="menu-item__note" aria-label="Notas de cata">
          <span className="menu-item__note-bar" aria-hidden="true" />
          <p>{item.tasting_note}</p>
        </aside>
      ) : null}
    </article>
  );
}
