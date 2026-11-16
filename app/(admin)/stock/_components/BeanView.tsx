"use client";
import type { BeanItem, Mode } from "../../../../src/bean-stock/types";
import {
  parseKilograms,
  previewQuantity,
} from "../../../../src/bean-stock/model";

type MenuItem = {
  id: string;
  name: string;
  available: boolean;
  origin_ids: string[];
};
export const kgLabel = (kg: string | null) =>
  kg === null ? "Sin contar" : `${kg.replace(".", ",")} kg`;
export function StockSections({
  active,
  locked = false,
  onProducts,
  onBeans,
}: {
  active: "products" | "beans";
  locked?: boolean;
  onProducts: () => void;
  onBeans: () => void;
}) {
  return (
    <div
      className="stock-segmented bean-sections"
      role="group"
      aria-label="Sección de stock"
    >
      <button
        type="button"
        aria-pressed={active === "products"}
        disabled={locked}
        onClick={onProducts}
      >
        Productos
      </button>
      <button
        type="button"
        aria-pressed={active === "beans"}
        disabled={locked}
        onClick={onBeans}
      >
        Granos
      </button>
    </div>
  );
}
export function BeanList({
  items,
  menuItems,
  links,
  locked,
  onOpen,
  selected,
}: {
  items: BeanItem[];
  menuItems: MenuItem[];
  links: { bean_id: string; menu_item_id: string }[];
  locked: boolean;
  onOpen: (item: BeanItem) => void;
  selected?: string;
}) {
  return (
    <div className="bean-table">
      <div className="bean-table__head stock-mono" aria-hidden="true">
        <span>Grano / Carta</span>
        <span>Existencia · kg</span>
      </div>
      <ul className="stock-list" aria-label="Granos de barra">
        {items.map((item) => {
          const linked = links
            .filter((l) => l.bean_id === item.id)
            .map((l) => menuItems.find((m) => m.id === l.menu_item_id))
            .filter((m): m is MenuItem => !!m);
          return (
            <li
              key={item.id}
              className={`bean-row${selected === item.id ? " is-selected" : ""}`}
            >
              <div className="bean-row__name">
                <span className="stock-row__title">{item.name}</span>
                <span className="stock-row__meta">
                  {item.tier === "premium" ? "Premium · " : ""}
                  {linked.length
                    ? linked
                        .map(
                          (m) =>
                            `${m.name} · ${m.origin_ids.includes(item.origin_id) ? "Configurado" : "Por configurar"}${m.available ? "" : " · Pausado"}`,
                        )
                        .join(" / ")
                    : "Sin vínculos con carta"}
                </span>
              </div>
              <button
                id={`bean-count-${item.id}`}
                type="button"
                className={`stock-count${item.quantity_kg === null ? " is-unknown" : ""}`}
                disabled={locked}
                onClick={() => onOpen(item)}
                aria-haspopup="dialog"
                aria-label={`${item.name}, ${kgLabel(item.quantity_kg)}, editar conteo`}
              >
                {item.quantity_kg === null ? (
                  <span className="stock-count__unknown">Sin contar</span>
                ) : (
                  <>
                    <span className="stock-count__value">
                      {item.quantity_kg.replace(".", ",")}
                    </span>
                    <span className="stock-count__unit">kg</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
export function BeanCountForm({
  item,
  mode,
  amount,
  reason,
  locked,
  onChange,
  onSave,
  hasNext = false,
}: {
  item: BeanItem;
  mode: Mode;
  amount: string;
  reason: string;
  locked: boolean;
  onChange: (patch: { mode?: Mode; amount?: string; reason?: string }) => void;
  onSave: (next: boolean) => void;
  hasNext?: boolean;
}) {
  const grams = parseKilograms(amount),
    preview = previewQuantity(item.quantity_kg, mode, amount);
  const valid =
    grams !== null && preview !== null && (mode === "set" || grams > 0);
  return (
    <form
      className="stock-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !locked) onSave(false);
      }}
    >
      <p className="stock-mono bean-current">
        EXISTENCIA ACTUAL · {kgLabel(item.quantity_kg)}
      </p>
      <div className="stock-segmented" role="group" aria-label="Tipo de conteo">
        {(
          [
            ["set", "Fijar total"],
            ["add", "Sumar"],
            ["subtract", "Restar"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={locked || (item.quantity_kg === null && value !== "set")}
            onClick={() => onChange({ mode: value })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="stock-field">
        <label htmlFor="bean-amount">
          {mode === "set"
            ? "Total contado"
            : mode === "add"
              ? "Cantidad a sumar"
              : "Cantidad a restar"}
        </label>
        <div className="bean-amount">
          <input
            id="bean-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            disabled={locked}
            onChange={(e) => onChange({ amount: e.target.value })}
            aria-describedby="bean-amount-help"
          />
          <span>kg</span>
        </div>
        <span id="bean-amount-help" className="stock-mono bean-help">
          {grams === null
            ? "Usa kg, hasta 3 decimales."
            : `${amount} kg = ${grams.toLocaleString("es-CL")} g · Máximo 3 decimales`}
        </span>
      </div>
      {amount && !valid && (
        <p className="stock-inline-error" role="alert">
          {grams === null
            ? "Ingresa una cantidad válida, con hasta 3 decimales."
            : "El resultado no puede ser negativo ni superar el máximo permitido."}
        </p>
      )}
      {valid && (
        <div className="bean-preview stock-mono">
          {kgLabel(item.quantity_kg)} → {kgLabel(preview)}
        </div>
      )}
      <div className="stock-field">
        <label htmlFor="bean-reason">Motivo (opcional)</label>
        <input
          id="bean-reason"
          value={reason}
          maxLength={500}
          disabled={locked}
          onChange={(e) => onChange({ reason: e.target.value })}
        />
      </div>
      <p className="bean-help">
        El primer conteo fija el total. Con 0 kg, el grano deja de estar
        disponible en los productos vinculados.
      </p>
      <div className="stock-editor__actions">
        <button
          className="stock-button"
          type="submit"
          disabled={locked || !valid}
        >
          Guardar conteo
        </button>
        {hasNext && (
          <button
            className="stock-button stock-button--outline"
            type="button"
            disabled={locked || !valid}
            onClick={() => onSave(true)}
          >
            Guardar y siguiente
          </button>
        )}
      </div>
    </form>
  );
}
