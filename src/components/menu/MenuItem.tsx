import type { MenuItem as MenuItemType } from "../../data/menu";

type Props = {
  item: MenuItemType;
  showPrices?: boolean;
  temporarilyUnavailable?: boolean;
};

export function MenuItem({ item, showPrices = false, temporarilyUnavailable = false }: Props) {
  const unavailable = item.unavailable === true || temporarilyUnavailable;
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
              {showPrices && typeof item.priceClp === "number" ? (
                <span className="menu-item__price">$ {item.priceClp.toLocaleString("es-CL")}</span>
              ) : null}
            </>
          )}
        </span>
      </header>
      <p className="menu-item__description">{item.description}</p>
      {item.tastingNote && !unavailable ? (
        <aside className="menu-item__note" aria-label="Notas de cata">
          <span className="menu-item__note-bar" aria-hidden="true" />
          <p>{item.tastingNote}</p>
        </aside>
      ) : null}
    </article>
  );
}
