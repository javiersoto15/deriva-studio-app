"use client";

import { FormEvent, useId } from "react";
import {
  formatCount,
  isMenuLinked,
  menuZeroWarning,
  parseAmount,
  previewAdjustment,
  RAW_UNIT_GROUPS,
  REASON_SUGGESTIONS,
  unitLong,
  unitShort,
  type EditMode
} from "../../../../src/stock/editor";
import {
  EXPIRED_REASON,
  formatLotDay,
  formatLotMoment,
  previewLots,
  retireExpiredDraft
} from "../../../../src/stock/shelf-life";
import type { StockHistoryEntry, StockItem } from "../../../../src/stock/types";
import { formatHistoryTime, shortActor } from "./format";
import { LotPreview, UnknownLots } from "./StockShelfLife";

export type EditorNotice =
  | { kind: "conflict"; before: number | null }
  | { kind: "error"; message: string }
  | { kind: "gone" };

export type AdjustPanel = {
  type: "adjust";
  itemId: string;
  mode: EditMode;
  amount: string;
  reason: string;
  view: "edit" | "history";
  notice: EditorNotice | null;
};

export type CreatePanel = {
  type: "create";
  name: string;
  unit: StockItem["unit"];
  error: string;
};

export type SharePanel = { type: "share" };

export type PlazosPanel = { type: "plazos" };

export type Panel = AdjustPanel | CreatePanel | SharePanel | PlazosPanel;

export type HistoryState =
  | { status: "loading" }
  | { status: "ready"; entries: StockHistoryEntry[] }
  | { status: "error"; message: string };

/** An unconfirmed (ambiguous) mutation shown read-only until it is retried. */
export type PendingView = {
  label: string;
  before: number | null;
  after: number | null;
};

const MODE_LABEL: Record<EditMode, string> = { set: "Fijar total", add: "Sumar", subtract: "Restar" };
const MODE_HELP: Record<EditMode, string> = {
  set: "Escribe cuántas hay ahora.",
  add: "Suma lo que llegó o se repuso.",
  subtract: "Descuenta lo vendido o usado."
};

function countText(quantity: number | null, unit: StockItem["unit"]): string {
  return quantity === null ? "Sin contar" : `${formatCount(quantity)} ${unitShort(unit)}`;
}

function CloseButton({ onClose, disabled }: { onClose: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="stock-icon-button" onClick={onClose} disabled={disabled} aria-label="Cerrar">
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}

export function AdjustEditor(props: {
  item: StockItem;
  panel: AdjustPanel;
  titleId: string;
  busy: boolean;
  pending: PendingView | null;
  /** Confirmation of the previous save, shown when the editor chains to the next item. */
  savedNote: string | null;
  visibilityEnabled: boolean;
  hasNextUncounted: boolean;
  history?: HistoryState;
  /** Client clock for the lot preview; null until mounted. */
  now: Date | null;
  onDateLot: (lotId: string, enteredAt: string, requestId: string) => Promise<string | null>;
  onChange: (patch: Partial<AdjustPanel>) => void;
  onSave: (chain: boolean) => void;
  onRetry: () => void;
  onShowHistory: () => void;
  onClose: () => void;
}) {
  const { item, panel, pending, busy } = props;
  const baseId = useId();
  const amountId = `${baseId}-amount`;
  const reasonId = `${baseId}-reason`;
  const messageId = `${baseId}-message`;

  if (panel.view === "history") {
    return (
      <HistoryView
        item={item}
        titleId={props.titleId}
        state={props.history}
        onBack={() => props.onChange({ view: "edit" })}
        onClose={props.onClose}
      />
    );
  }

  const menuLinked = isMenuLinked(item);
  const kindLabel = menuLinked ? "Producto de carta" : "Insumo";
  const locked = busy || pending !== null;
  const preview = previewAdjustment(item.quantity, panel.mode, panel.amount);
  const amount = parseAmount(panel.amount);
  const unit = unitShort(item.unit);
  const conflict = panel.notice?.kind === "conflict" ? panel.notice : null;
  const firstCount = item.quantity === null;
  const chain = firstCount && props.hasNextUncounted && pending === null;
  const shelf = item.shelf_life;
  const expired = shelf?.counts.discard ?? 0;
  const retireDraft = shelf ? retireExpiredDraft(shelf) : null;
  const retiring =
    expired > 0 && panel.mode === "subtract" && panel.reason === EXPIRED_REASON && amount === expired;
  const lots = shelf && preview.ok && props.now ? previewLots(shelf, item.quantity, preview.after, props.now) : null;
  const reasons = shelf && panel.mode === "subtract"
    ? [EXPIRED_REASON, ...REASON_SUGGESTIONS.subtract]
    : REASON_SUGGESTIONS[panel.mode];

  let validation = "";
  if (!preview.ok && preview.reason === "below_zero" && amount !== null) {
    validation = `Solo hay ${formatCount(item.quantity ?? 0)}. Restar ${formatCount(amount)} dejaría el conteo bajo 0. Si contaste de nuevo, usa Fijar total.`;
  } else if (!preview.ok && preview.reason === "zero_delta") {
    validation = "Escribe una cantidad mayor que 0.";
  }
  const zeroWarning = preview.ok ? menuZeroWarning(item, preview.after, props.visibilityEnabled) : null;

  let saveLabel = "Escribe una cantidad";
  if (!preview.ok && preview.reason === "below_zero") saveLabel = "No puede quedar bajo 0";
  if (preview.ok) {
    const after = formatCount(preview.after);
    if (conflict) {
      saveLabel = panel.mode === "set" ? `Fijar ${after} sobre el nuevo conteo` : `${MODE_LABEL[panel.mode]} ${formatCount(amount ?? 0)} sobre el nuevo conteo`;
    } else if (retiring) {
      saveLabel = `Retirar ${formatCount(expired)} ${expired === 1 ? "vencida" : "vencidas"}`;
    } else if (chain) {
      saveLabel = `Guardar ${after} · siguiente sin contar`;
    } else if (panel.mode === "set") {
      saveLabel = firstCount ? `Guardar ${after} ${unit}` : `Fijar total en ${after}`;
    } else {
      saveLabel = `${MODE_LABEL[panel.mode]} ${formatCount(amount ?? 0)} · ${preview.after === 1 ? "queda" : "quedan"} ${after}`;
    }
  }

  const step = (direction: 1 | -1) => {
    const next = Math.max(0, (amount ?? 0) + direction);
    props.onChange({ amount: String(next), notice: conflict ? conflict : null });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!locked && preview.ok) props.onSave(chain);
  };

  return (
    <form className="stock-editor" onSubmit={submit} noValidate>
      <header className="stock-editor__head">
        <div>
          <p className="stock-editor__kind">{kindLabel}</p>
          <h2 id={props.titleId} tabIndex={-1}>{item.name}</h2>
          <p className={`stock-editor__current${firstCount ? " is-unknown" : ""}`}>
            {firstCount ? "Sin contar · primer conteo" : <>Hay <span className="stock-mono">{countText(item.quantity, item.unit)}</span></>}
            {expired > 0 && <> · <span className="stock-editor__expired">{formatCount(expired)} {expired === 1 ? "vencida" : "vencidas"}</span></>}
            {menuLinked && item.menu_available === false && " · pausado en carta"}
          </p>
        </div>
        <CloseButton onClose={props.onClose} disabled={busy} />
      </header>

      {props.savedNote && !pending && (
        <p className="stock-editor__saved">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          {props.savedNote}
        </p>
      )}
      {pending && (
        <div className="stock-callout" role="alert">
          <strong>No sabemos si se guardó.</strong>
          <span>Se cortó la conexión. Reintenta: si ya estaba guardado, no se contará dos veces.</span>
        </div>
      )}
      {conflict && !pending && (
        <div className="stock-callout" role="alert">
          <strong>Alguien guardó antes que tú.</strong>
          <span>
            El conteo cambió de {countText(conflict.before, item.unit)} a {countText(item.quantity, item.unit)} mientras editabas. No se guardó nada tuyo.
          </span>
        </div>
      )}
      {panel.notice?.kind === "error" && !pending && (
        <div className="stock-callout" role="alert"><span>{panel.notice.message}</span></div>
      )}
      {panel.notice?.kind === "gone" && (
        <div className="stock-callout" role="alert">
          <strong>Este artículo ya no está en el stock.</strong>
          <span>Pudo salir de la carta. Actualizamos la lista; tu ajuste no se guardó.</span>
        </div>
      )}

      {pending ? (
        <div className="stock-editor__result">
          <span>Pendiente: {pending.label}</span>
          <strong className="stock-mono">
            {countText(pending.before, item.unit)} → {pending.after === null ? "—" : formatCount(pending.after)}
          </strong>
        </div>
      ) : (
        <>
          {retireDraft && !retiring && (
            <div className="stock-callout stock-callout--action">
              <span>
                <strong>{formatCount(expired)} {expired === 1 ? "vencida" : "vencidas"}.</strong> Pasaron su día de retiro: sácalas de la vitrina y descuéntalas como merma.
              </span>
              <button
                type="button"
                className="stock-button stock-button--outline"
                disabled={locked}
                onClick={() => props.onChange({ ...retireDraft, notice: null })}
              >
                Preparar retiro
              </button>
            </div>
          )}
          <fieldset className="stock-editor__modes" disabled={locked}>
            <legend className="stock-visually-hidden">Tipo de ajuste</legend>
            <div className="stock-segmented">
              {(["set", "add", "subtract"] as EditMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={panel.mode === mode}
                  disabled={mode !== "set" && firstCount}
                  onClick={() => props.onChange({ mode, reason: "" })}
                >
                  {MODE_LABEL[mode]}
                </button>
              ))}
            </div>
            <p className="stock-editor__help">
              {firstCount ? "Escribe cuántas hay ahora. Sumar y Restar se activan después del primer total." : MODE_HELP[panel.mode]}
            </p>
          </fieldset>

          <div className="stock-amount">
            <button type="button" className="stock-amount__step" onClick={() => step(-1)} disabled={locked || (amount ?? 0) === 0} aria-label="Uno menos">
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12" stroke="currentColor" strokeWidth="1.8" /></svg>
            </button>
            <label className={`stock-amount__field${validation ? " is-invalid" : ""}`} htmlFor={amountId}>
              <span className="stock-visually-hidden">{panel.mode === "set" ? "Total" : "Cantidad"} en {unitLong(item.unit)}</span>
              <input
                id={amountId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                enterKeyHint="done"
                placeholder="0"
                value={panel.amount}
                onChange={(event) => props.onChange({ amount: event.target.value.replace(/\D/g, ""), notice: conflict ? conflict : null })}
                disabled={locked}
                aria-invalid={validation ? true : undefined}
                aria-describedby={messageId}
              />
              <span className="stock-amount__unit" aria-hidden="true">{unit}</span>
            </label>
            <button type="button" className="stock-amount__step" onClick={() => step(1)} disabled={locked} aria-label="Uno más">
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12M9 3v12" stroke="currentColor" strokeWidth="1.8" /></svg>
            </button>
          </div>

          <div id={messageId} aria-live="polite" className="stock-editor__messages">
            {validation && <p className="stock-inline-error">{validation}</p>}
            {zeroWarning && <p className="stock-inline-error">{zeroWarning}</p>}
          </div>

          <div className="stock-editor__result">
            <span>{preview.ok && preview.after === 1 ? "Quedará" : "Quedarán"}</span>
            <strong>
              <span className={`stock-editor__before${item.quantity !== null && preview.ok ? " is-struck" : ""}`}>
                {item.quantity === null ? "Sin contar" : formatCount(item.quantity)}
              </span>
              <span aria-hidden="true">→</span>
              <span className="stock-editor__after stock-mono">{preview.ok ? formatCount(preview.after) : "—"}</span>
              <span className="stock-editor__unit stock-mono">{unit}</span>
            </strong>
          </div>

          {lots && <LotPreview preview={lots} unit={item.unit} />}

          <div className="stock-reason">
            <label htmlFor={reasonId}>Motivo <span>(opcional)</span></label>
            <div className="stock-chips">
              {reasons.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  aria-pressed={panel.reason === suggestion}
                  disabled={locked}
                  onClick={() => props.onChange({ reason: panel.reason === suggestion ? "" : suggestion })}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <input
              id={reasonId}
              type="text"
              maxLength={240}
              autoComplete="off"
              placeholder="Otro motivo"
              value={panel.reason}
              onChange={(event) => props.onChange({ reason: event.target.value })}
              disabled={locked}
            />
          </div>

          {shelf && <UnknownLots lots={shelf.lots} unit={item.unit} disabled={locked} onDate={props.onDateLot} />}
        </>
      )}

      <div className="stock-editor__actions">
        {pending ? (
          <>
            <button type="button" className="stock-button" onClick={props.onRetry} disabled={busy}>
              {busy ? "Confirmando…" : "Reintentar la misma solicitud"}
            </button>
            <button type="button" className="stock-text-button" onClick={props.onShowHistory} disabled={busy}>
              Revisar historial antes
            </button>
          </>
        ) : (
          <>
            <button type="submit" className="stock-button" disabled={locked || !preview.ok} aria-busy={busy || undefined}>
              {busy ? "Guardando…" : saveLabel}
            </button>
            {chain && preview.ok && !busy && (
              <button type="button" className="stock-button stock-button--outline" onClick={() => props.onSave(false)}>
                Guardar y cerrar
              </button>
            )}
            {conflict && (
              <button type="button" className="stock-button stock-button--outline" onClick={props.onClose} disabled={busy}>
                Descartar mi ajuste
              </button>
            )}
            <div className="stock-editor__foot">
              <span className="stock-editor__keys">Enter guarda · Esc cierra</span>
              <button type="button" className="stock-text-button" onClick={props.onShowHistory} disabled={busy}>
                Ver historial
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

/** "Lote nuevo · retirar mar 27" or "Sale de lote mié 08:40 (2 → 0)". */
function describeLots(lots: NonNullable<StockHistoryEntry["lots_affected"]>): string {
  return lots
    .map((lot) => {
      if (lot.before === 0 && lot.after > 0) {
        return `Lote nuevo de ${formatCount(lot.after)}${lot.discard_at ? ` · retirar ${formatLotDay(lot.discard_at)}` : ""}`;
      }
      const label = lot.entered_at ? `lote ${formatLotMoment(lot.entered_at)}` : "lote sin fecha";
      return `Sale de ${label} (${formatCount(lot.before)} → ${formatCount(lot.after)})`;
    })
    .join(" · ");
}

function HistoryView(props: {
  item: StockItem;
  titleId: string;
  state?: HistoryState;
  onBack: () => void;
  onClose: () => void;
}) {
  const now = new Date();
  // Newest first. The contract has no paging yet; pagination is requested
  // from the backend and must not be simulated here.
  const entries =
    props.state?.status === "ready"
      ? [...props.state.entries].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      : [];
  return (
    <div className="stock-editor">
      <header className="stock-editor__head">
        <div>
          <p className="stock-editor__kind">Historial</p>
          <h2 id={props.titleId} tabIndex={-1}>{props.item.name}</h2>
        </div>
        <CloseButton onClose={props.onClose} />
      </header>
      {(!props.state || props.state.status === "loading") && <p className="stock-history__status" role="status">Cargando historial…</p>}
      {props.state?.status === "error" && <div className="stock-callout" role="alert"><span>{props.state.message}</span></div>}
      {props.state?.status === "ready" && entries.length === 0 && (
        <p className="stock-history__status">Todavía no hay movimientos.</p>
      )}
      {entries.length > 0 && (
        <ol className="stock-history">
          {entries.map((entry) => {
            const label =
              entry.mode === "set"
                ? "Fijar total"
                : entry.quantity >= 0
                  ? `Sumar ${formatCount(entry.quantity)}`
                  : `Restar ${formatCount(Math.abs(entry.quantity))}`;
            return (
              <li key={entry.id}>
                <div className="stock-history__line">
                  <strong>{entry.reason ? `${label} · ${entry.reason}` : label}</strong>
                  <span className="stock-mono">
                    {entry.before_quantity === null ? "Sin contar" : formatCount(entry.before_quantity)} → {formatCount(entry.after_quantity)}
                  </span>
                </div>
                {entry.lots_affected && entry.lots_affected.length > 0 && (
                  <p className="stock-history__lots">{describeLots(entry.lots_affected)}</p>
                )}
                <div className="stock-history__meta stock-mono">
                  <time dateTime={entry.created_at}>{formatHistoryTime(entry.created_at, now)}</time>
                  <span> · </span>
                  <span title={entry.actor_id}>{shortActor(entry.actor_id)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="stock-editor__actions">
        <button type="button" className="stock-button stock-button--outline" onClick={props.onBack}>
          Volver al conteo
        </button>
      </div>
    </div>
  );
}

export function CreateRawEditor(props: {
  panel: CreatePanel;
  titleId: string;
  busy: boolean;
  pending: boolean;
  onChange: (patch: Partial<CreatePanel>) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const errorId = `${baseId}-error`;
  const locked = props.busy || props.pending;
  return (
    <form
      className="stock-editor"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked) props.onSubmit();
      }}
    >
      <header className="stock-editor__head">
        <div>
          <p className="stock-editor__kind">Insumo nuevo</p>
          <h2 id={props.titleId} tabIndex={-1}>Añadir insumo</h2>
          <p className="stock-editor__help">Para materias primas. No aparece en la carta. La pastelería se agrega desde la gestión de carta.</p>
        </div>
        <CloseButton onClose={props.onClose} disabled={props.busy} />
      </header>
      {props.pending && (
        <div className="stock-callout" role="alert">
          <strong>No sabemos si se creó.</strong>
          <span>Reintenta la misma solicitud: si ya existía, no se duplicará.</span>
        </div>
      )}
      <div className="stock-field">
        <label htmlFor={nameId}>Nombre</label>
        <input
          id={nameId}
          value={props.panel.name}
          maxLength={120}
          autoComplete="off"
          onChange={(event) => props.onChange({ name: event.target.value, error: "" })}
          disabled={locked}
          aria-invalid={props.panel.error ? true : undefined}
          aria-describedby={errorId}
        />
      </div>
      <fieldset className="stock-units" disabled={locked}>
        <legend>Se cuenta en</legend>
        {RAW_UNIT_GROUPS.map((group, index) => (
          <div className="stock-chips" key={index}>
            {group.map((unit) => (
              <button
                key={unit}
                type="button"
                aria-pressed={props.panel.unit === unit}
                className={index === 1 ? "stock-mono" : undefined}
                onClick={() => props.onChange({ unit })}
              >
                {unitLong(unit)}
              </button>
            ))}
          </div>
        ))}
        <p className="stock-editor__help">Solo números enteros. Para medio litro, usa ml (500).</p>
      </fieldset>
      <div id={errorId} aria-live="polite">
        {props.panel.error && <p className="stock-inline-error">{props.panel.error}</p>}
      </div>
      <div className="stock-editor__actions">
        {props.pending ? (
          <button type="button" className="stock-button" onClick={props.onRetry} disabled={props.busy}>
            {props.busy ? "Confirmando…" : "Reintentar la misma solicitud"}
          </button>
        ) : (
          <button type="submit" className="stock-button" disabled={locked}>
            {props.busy ? "Guardando…" : "Añadir insumo"}
          </button>
        )}
      </div>
    </form>
  );
}
