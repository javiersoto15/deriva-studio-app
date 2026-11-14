"use client";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  LOCATIONS,
  type Location,
  type WithdrawalLocation,
  type SalonItem,
  type Mode,
  type Movement,
  type Snapshot,
} from "../../../../src/salon-stock/types";
import {
  adjustmentModes,
  countLabel,
  findMatches,
  formatAmount,
  formatMoment,
  formatObservation,
  formatShare,
  locationLabel,
  normalizeName,
  operatorNotes,
  parseQuantity,
  prepareWithdrawal,
  previewCount,
  whatsappUrl,
} from "../../../../src/salon-stock/model";
export type CreateDraft = {
  name: string;
  location: Location;
  category: string;
  categoryLabel: string;
  unit: string;
  packageNote: string;
  quantity: string;
};
export type CountDraft = { mode: Mode; amount: string; reason: string };
export type WithdrawalDraft = {
  location: WithdrawalLocation;
  itemId: string;
  query: string;
  taker: string;
  amount: string;
  reason: string;
};
export function SourceNotes({ item }: { item: SalonItem }) {
  const notes = operatorNotes(item);
  return (
    <>
      {item.package_note && <p className="salon-help">{item.package_note}</p>}
      {notes.map((n, i) => (
        <p key={i} className="salon-source-note">
          {n}
        </p>
      ))}
      {item.source_markers.some((m) => !item.name.includes(m)) && (
        <p className="salon-help">
          Marca del original: {item.source_markers.join(" ")} · significado por
          confirmar.
        </p>
      )}
    </>
  );
}
function Options({
  id,
  items,
  active,
  disabled,
  onSelect,
}: {
  id: string;
  items: SalonItem[];
  active: number;
  disabled: boolean;
  onSelect: (i: SalonItem) => void;
}) {
  return (
    <ul
      id={id}
      className="salon-options"
      role="listbox"
      aria-label="Artículos existentes"
    >
      {items.map((item, index) => (
        <li
          id={`${id}-${index}`}
          key={item.id}
          role="option"
          aria-selected={index === active}
          aria-disabled={disabled || undefined}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!disabled) onSelect(item);
          }}
        >
          <span>
            <strong>{item.name}</strong>
            <small>
              {locationLabel(item.location)} · {countLabel(item)}
            </small>
            {item.package_note && <small>{item.package_note}</small>}
          </span>
          <span>Seleccionar</span>
        </li>
      ))}
    </ul>
  );
}
function useOptionKeys(matches: SalonItem[], onSelect: (i: SalonItem) => void) {
  const [active, setActive] = useState(-1);
  const [expanded, setExpanded] = useState(true);
  function keyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setExpanded(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setExpanded(true);
      setActive((i) => Math.max(i - 1, 0));
    } else if (
      e.key === "Enter" &&
      expanded &&
      active >= 0 &&
      matches[active]
    ) {
      e.preventDefault();
      onSelect(matches[active]);
      setActive(-1);
      setExpanded(false);
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(false);
      setActive(-1);
    }
  }
  return {
    active,
    expanded,
    keyDown,
    reset: () => {
      setActive(-1);
      setExpanded(true);
    },
  };
}
export function CreateEditor({
  draft,
  items,
  locked,
  onChange,
  onExisting,
  onSubmit,
}: {
  draft: CreateDraft;
  items: SalonItem[];
  locked: boolean;
  onChange: (patch: Partial<CreateDraft>) => void;
  onExisting: (item: SalonItem) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const scoped = items.filter((x) => x.location === draft.location);
  const matches = findMatches(items, draft.location, draft.name);
  const options = useOptionKeys(matches, onExisting);
  const exact = scoped.some(
    (i) => normalizeName(i.name) === normalizeName(draft.name),
  );
  const categories = Array.from(
    new Map(scoped.map((i) => [i.category, i.category_label])).entries(),
  );
  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={locked}>
        <p className="salon-help">
          Ubicación: <strong>{locationLabel(draft.location)}</strong>. Cada
          ubicación conserva su propio saldo.
        </p>
        <label htmlFor="salon-create-name">Nombre del artículo</label>
        <input
          id="salon-create-name"
          className="salon-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={options.expanded && matches.length > 0}
          aria-controls="salon-create-options"
          aria-activedescendant={
            options.expanded && options.active >= 0
              ? `salon-create-options-${options.active}`
              : undefined
          }
          value={draft.name}
          maxLength={120}
          autoComplete="off"
          required
          onKeyDown={options.keyDown}
          onFocus={options.reset}
          onChange={(e) => {
            onChange({ name: e.target.value });
            options.reset();
          }}
        />
        {options.expanded && matches.length > 0 ? (
          <Options
            id="salon-create-options"
            items={matches}
            active={options.active}
            disabled={locked}
            onSelect={onExisting}
          />
        ) : draft.name.trim() && !matches.length ? (
          <p className="salon-help" role="status">
            Sin coincidencias en {locationLabel(draft.location)}.
          </p>
        ) : null}
        {exact && (
          <p className="salon-source-note">
            Ya existe este artículo en esta ubicación. Selecciónalo para ver o
            corregir su conteo.
          </p>
        )}
        <label htmlFor="salon-category">Categoría</label>
        <input
          id="salon-category"
          className="salon-input"
          list="salon-category-options"
          value={draft.categoryLabel}
          maxLength={80}
          onChange={(e) => {
            const label = e.target.value;
            const known = categories.find(
              ([, v]) => normalizeName(v) === normalizeName(label),
            );
            onChange({
              category: known?.[0] ?? (normalizeName(label) || "otros"),
              categoryLabel: label,
            });
          }}
        />
        <datalist id="salon-category-options">
          {categories.map(([id, label]) => (
            <option key={id} value={label} />
          ))}
        </datalist>
        <label htmlFor="salon-create-unit">Unidad de conteo (opcional)</label>
        <input
          id="salon-create-unit"
          className="salon-input"
          value={draft.unit}
          maxLength={40}
          placeholder="Ej. unidades, cajas o pack"
          onChange={(e) => onChange({ unit: e.target.value })}
        />
        <p className="salon-help">Déjala vacía si no está indicada.</p>
        <label htmlFor="salon-create-package">
          Presentación o condición (opcional)
        </label>
        <input
          id="salon-create-package"
          className="salon-input"
          value={draft.packageNote}
          maxLength={500}
          placeholder="Ej. 100 unidades por pack"
          onChange={(e) => onChange({ packageNote: e.target.value })}
        />
        <label htmlFor="salon-create-quantity">Conteo inicial (opcional)</label>
        <input
          id="salon-create-quantity"
          className="salon-input"
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
        />
        <p className="salon-help">Vacío: sin contar. Cero: no queda stock.</p>
        <button
          className="stock-button salon-submit"
          disabled={exact || !draft.name.trim()}
        >
          Crear artículo
        </button>
      </fieldset>
    </form>
  );
}
export function CountEditor({
  item,
  draft,
  locked,
  onChange,
  onSubmit,
  onHistory,
}: {
  item: SalonItem;
  draft: CountDraft;
  locked: boolean;
  onChange: (p: Partial<CountDraft>) => void;
  onSubmit: (e: FormEvent) => void;
  onHistory: () => void;
}) {
  const modes = adjustmentModes(item.location);
  const after = previewCount(item.quantity, draft.mode, draft.amount);
  const reasonRequired = item.location !== "fridge" && draft.mode === "set";
  const labels: Record<Mode, string> = {
    set: "Corregir conteo",
    add: "Agregar ingreso",
    subtract: "Restar conteo",
  };
  return (
    <>
      <p className="salon-current">
        {locationLabel(item.location)} · Saldo guardado:{" "}
        <strong>{countLabel(item)}</strong>
      </p>
      <SourceNotes item={item} />
      <p className="salon-help">
        Conteo físico: {formatObservation(item.observation)}
      </p>
      <form onSubmit={onSubmit}>
        <fieldset disabled={locked}>
          <div
            className="salon-modes"
            role="group"
            aria-label="Operación de conteo"
          >
            {modes.map((mode) => (
              <button
                type="button"
                key={mode}
                aria-pressed={draft.mode === mode}
                disabled={item.quantity === null && mode !== "set"}
                onClick={() => onChange({ mode, amount: "" })}
              >
                {labels[mode]}
              </button>
            ))}
          </div>
          <label htmlFor="salon-adjust-amount">
            {draft.mode === "set"
              ? "Cantidad total contada"
              : draft.mode === "add"
                ? "Cantidad que ingresó"
                : "Cantidad a descontar"}
            {item.unit ? " (" + item.unit + ")" : ""}
          </label>
          <input
            id="salon-adjust-amount"
            className="salon-input"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
          />
          {item.unit === null && (
            <p className="salon-help">
              Usa la misma base del conteo original; no se convierten
              presentaciones.
            </p>
          )}
          <Balance before={item.quantity} after={after} unit={item.unit} />
          <label htmlFor="salon-adjust-reason">
            {reasonRequired ? "Motivo de la corrección" : "Nota (opcional)"}
          </label>
          <input
            id="salon-adjust-reason"
            className="salon-input"
            value={draft.reason}
            maxLength={500}
            required={reasonRequired}
            placeholder={
              reasonRequired ? "Ej. Recuento físico" : "Ej. Llegó pedido"
            }
            onChange={(e) => onChange({ reason: e.target.value })}
          />
          {item.location !== "fridge" && (
            <p className="salon-help">
              Los retiros se registran desde Registrar retiro, con el nombre de
              quien retiró. Una corrección no registra un retiro.
            </p>
          )}
          <button
            className="stock-button salon-submit"
            disabled={
              after === null ||
              parseQuantity(draft.amount) === null ||
              (reasonRequired && !draft.reason.trim())
            }
          >
            Guardar conteo
          </button>
        </fieldset>
      </form>
      <button
        className="stock-text-button"
        disabled={locked}
        onClick={onHistory}
      >
        Ver historial del artículo
      </button>
    </>
  );
}
export function Balance({
  before,
  after,
  unit,
}: {
  before: string | null;
  after: string | null;
  unit: string | null;
}) {
  return (
    <div className="salon-balance" aria-live="polite">
      <div>
        <span>Stock actual</span>
        <strong>{formatAmount(before)}</strong>
      </div>
      <span aria-hidden="true">→</span>
      <div>
        <span>Quedará</span>
        <strong>{after === null ? "—" : formatAmount(after)}</strong>
      </div>
      {unit && <small>{unit}</small>}
    </div>
  );
}
export function WithdrawalEditor({
  draft,
  snapshot,
  locked,
  onChange,
  onSubmit,
}: {
  draft: WithdrawalDraft;
  snapshot: Snapshot;
  locked: boolean;
  onChange: (p: Partial<WithdrawalDraft>) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const selected = snapshot.items.find(
    (i) => i.id === draft.itemId && i.location === draft.location,
  );
  const scoped = snapshot.items.filter((i) => i.location === draft.location);
  const matches = draft.query.trim()
    ? findMatches(snapshot.items, draft.location, draft.query)
    : scoped.slice(0, 8);
  function choose(item: SalonItem) {
    onChange({ itemId: item.id, query: item.name, amount: "" });
  }
  const options = useOptionKeys(matches, choose);
  const prepared = prepareWithdrawal({
    items: snapshot.items,
    location: draft.location,
    itemId: draft.itemId,
    taker: draft.taker,
    amount: draft.amount,
    takers: snapshot.withdrawal_takers,
  });
  const amount = parseQuantity(draft.amount);
  const after =
    selected && amount !== null
      ? previewCount(selected.quantity, "subtract", amount)
      : null;
  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={locked}>
        <p className="salon-help">El retiro descuenta un artículo del stock.</p>
        <label htmlFor="withdraw-location">¿De dónde?</label>
        <select
          id="withdraw-location"
          className="salon-input"
          value={draft.location}
          onChange={(e) => {
            onChange({
              location: e.target.value as WithdrawalLocation,
              itemId: "",
              query: "",
              amount: "",
            });
            options.reset();
          }}
        >
          <option value="storage">Bodega</option>
          <option value="cleaning">Limpieza</option>
        </select>
        <label htmlFor="withdraw-taker">¿Quién retiró?</label>
        <select
          id="withdraw-taker"
          className="salon-input"
          value={draft.taker}
          required
          onChange={(e) => onChange({ taker: e.target.value })}
        >
          <option value="">Seleccionar persona</option>
          {snapshot.withdrawal_takers.map((n) => (
            <option value={n} key={n}>
              {n}
            </option>
          ))}
        </select>
        <label htmlFor="withdraw-item-search">Artículo</label>
        <input
          id="withdraw-item-search"
          className="salon-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!selected && options.expanded && matches.length > 0}
          aria-controls="salon-withdraw-options"
          aria-activedescendant={
            !selected && options.expanded && options.active >= 0
              ? `salon-withdraw-options-${options.active}`
              : undefined
          }
          value={draft.query || selected?.name || ""}
          autoComplete="off"
          placeholder={`Buscar en ${locationLabel(draft.location)}…`}
          onFocus={options.reset}
          onKeyDown={options.keyDown}
          onChange={(e) => {
            onChange({ query: e.target.value, itemId: "", amount: "" });
            options.reset();
          }}
        />
        {selected ? (
          <div className="salon-selection">
            <div className="salon-selection-heading">
              <p>
                Disponible: <strong>{formatAmount(selected.quantity)}</strong>
                {selected.unit ? " " + selected.unit : ""}
              </p>
              <button
                type="button"
                className="stock-text-button"
                onClick={() => {
                  onChange({ itemId: "", query: "", amount: "" });
                  document.getElementById("withdraw-item-search")?.focus();
                }}
              >
                Cambiar artículo
              </button>
            </div>
            <SourceNotes item={selected} />
          </div>
        ) : options.expanded && matches.length ? (
          <Options
            id="salon-withdraw-options"
            items={matches}
            active={options.active}
            disabled={locked}
            onSelect={choose}
          />
        ) : (
          <p className="salon-help" role="status">
            Sin artículos que coincidan en esta ubicación.
          </p>
        )}
        {!selected && (
          <p className="salon-help">
            Selecciona un resultado. Escribir el nombre no selecciona el
            artículo.
          </p>
        )}
        <label htmlFor="withdraw-amount">
          Cantidad a retirar
          {selected?.unit
            ? " (" + selected.unit + ")"
            : selected
              ? " · base original"
              : ""}
        </label>
        <input
          id="withdraw-amount"
          className="salon-input"
          inputMode="decimal"
          value={draft.amount}
          disabled={!selected}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
        {selected ? (
          <>
            <Balance
              before={selected.quantity}
              after={after}
              unit={selected.unit}
            />
            {selected.quantity === null ? (
              <p className="salon-validation" role="status">
                Primero registra un conteo para este artículo.
              </p>
            ) : amount !== null && after === null ? (
              <p className="salon-validation" role="status">
                No hay stock suficiente. Disponible: {countLabel(selected)}.
              </p>
            ) : amount === "0" ? (
              <p className="salon-validation" role="status">
                La cantidad debe ser mayor que cero.
              </p>
            ) : null}
          </>
        ) : (
          <p className="salon-current">
            Selecciona un artículo para ver el saldo.
          </p>
        )}
        <button className="stock-button salon-submit" disabled={!prepared}>
          Confirmar retiro
        </button>
      </fieldset>
    </form>
  );
}
const KIND_LABELS: Record<Movement["kind"], string> = {
  initial_count: "Conteo inicial",
  receipt: "Ingreso",
  count_correction: "Corrección de conteo",
  withdrawal: "Retiro",
};
export function MovementList({ entries }: { entries: Movement[] }) {
  return (
    <ol className="salon-movements">
      {entries.map((m) => (
        <li key={m.id}>
          <div className="salon-event-type">
            {KIND_LABELS[m.kind]}
            {m.taker && (
              <>
                {" "}
                · <strong>{m.taker}</strong>
              </>
            )}
          </div>
          <strong className="salon-event-name">{m.item_name}</strong>
          <p>
            {locationLabel(m.location)} ·{" "}
            {m.kind === "withdrawal"
              ? "Retiró"
              : m.kind === "receipt"
                ? "Ingresó"
                : "Cantidad"}{" "}
            {formatAmount(m.amount)}
            {m.unit ? " " + m.unit : ""}
          </p>
          <p className="salon-event-balance">
            {formatAmount(m.before)} → {formatAmount(m.after)}
            {m.unit ? " " + m.unit : ""}
          </p>
          <small>
            {formatMoment(m.created_at)}
            <br />
            Registrado por {m.actor}
          </small>
          {m.reason && <p>{m.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
export function SharePanel({
  snapshot,
  busy,
  error,
  copied,
  onRefresh,
  onCopy,
}: {
  snapshot: Snapshot | null;
  busy: boolean;
  error: boolean;
  copied: boolean;
  onRefresh: () => void;
  onCopy: () => void;
}) {
  const text = snapshot ? formatShare(snapshot) : "";
  return (
    <>
      <p className="salon-help">
        Inventario guardado completo, agrupado por ubicación. Revisa el mensaje
        y después elige el chat en WhatsApp.
      </p>
      {busy ? (
        <p role="status">Actualizando el inventario guardado…</p>
      ) : snapshot ? (
        <>
          <pre
            className="salon-share-preview"
            tabIndex={0}
            aria-label="Mensaje completo de stock Salón"
          >
            {text}
          </pre>
          <div className="salon-share-actions">
            <button
              className="stock-button"
              disabled={!snapshot.items.length}
              onClick={onCopy}
            >
              Copiar mensaje
            </button>
            {snapshot.items.length > 0 && (
              <a
                className="stock-button stock-button--outline"
                href={whatsappUrl(text)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir WhatsApp
              </a>
            )}
          </div>
          {copied && (
            <p className="salon-success" role="status">
              Mensaje copiado.
            </p>
          )}
        </>
      ) : error ? (
        <button
          className="stock-button stock-button--outline"
          onClick={onRefresh}
        >
          Volver a intentar
        </button>
      ) : null}
    </>
  );
}
