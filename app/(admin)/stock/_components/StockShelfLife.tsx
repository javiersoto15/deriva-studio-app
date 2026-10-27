"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import {
  createShelfLifeGroup,
  getShelfLifeConfiguration,
  StockRequestError,
  updateShelfLifeGroup
} from "../../../../src/stock/client";
import { makeRequestId, parseGroupConflict } from "../../../../src/stock/contract";
import { formatCount, unitShort } from "../../../../src/stock/editor";
import {
  formatLotDay,
  formatLotMoment,
  fromLocalInputValue,
  toLocalInputValue,
  type LotPreview as LotPreviewResult
} from "../../../../src/stock/shelf-life";
import type {
  StockItem,
  StockLot,
  StockShelfLifeConfiguration,
  StockShelfLifeGroup
} from "../../../../src/stock/types";

function lotLabel(lot: Pick<StockLot, "entered_at">): string {
  return lot.entered_at ? `Lote ${formatLotMoment(lot.entered_at)}` : "Lote sin fecha";
}

const STATE_NOTE: Record<StockLot["state"], string> = {
  discard: "vencido",
  sell_first: "vender primero",
  fresh: "fresco",
  unknown: "sin fecha"
};

/** What the draft does to the lots behind the count. Informational; nothing to choose. */
export function LotPreview(props: { preview: LotPreviewResult; unit: StockItem["unit"] }) {
  const { preview } = props;
  const unit = unitShort(props.unit);
  if (preview.kind === "none") return null;
  if (preview.kind === "enter") {
    return (
      <div className="stock-lots" role="note">
        <p className="stock-lots__tag">Entran +{formatCount(preview.quantity)} · lote nuevo</p>
        <p className="stock-lots__text">
          {preview.quantity === 1 ? "Entra ahora" : `Las ${formatCount(preview.quantity)} entran juntas ahora`}: fresca hasta{" "}
          <span className="stock-mono">{formatLotDay(preview.freshUntil)}</span> · retirar{" "}
          <span className="stock-mono">{formatLotDay(preview.discardAt)}</span>
        </p>
      </div>
    );
  }
  if (preview.takes.length === 0) return null;
  return (
    <div className="stock-lots" role="note">
      <p className="stock-lots__tag">Sale de · primero lo más antiguo</p>
      <ul className="stock-lots__list">
        {preview.takes.map(({ lot, take, left }) => (
          <li key={lot.id} className={lot.state === "discard" ? "is-expired" : undefined}>
            <span>
              {lotLabel(lot)} · {STATE_NOTE[lot.state]}
            </span>
            <span className="stock-mono">
              −{formatCount(take)} · {left === 0 ? "se cierra" : `quedan ${formatCount(left)} ${unit}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Stock counted before tracking started has no entry date. Asking once per lot
 * (never blocking the count) lets those units get real deadlines.
 */
export function UnknownLots(props: {
  lots: StockLot[];
  unit: StockItem["unit"];
  disabled: boolean;
  onDate: (lotId: string, enteredAt: string, requestId: string) => Promise<string | null>;
}) {
  const unknown = props.lots.filter((lot) => lot.entered_at === null);
  if (unknown.length === 0) return null;
  return (
    <div className="stock-lots stock-lots--unknown">
      <p className="stock-lots__tag">Sin fecha de entrada</p>
      {unknown.map((lot) => (
        <UnknownLotRow key={lot.id} lot={lot} unit={props.unit} disabled={props.disabled} onDate={props.onDate} />
      ))}
    </div>
  );
}

function UnknownLotRow(props: {
  lot: StockLot;
  unit: StockItem["unit"];
  disabled: boolean;
  onDate: (lotId: string, enteredAt: string, requestId: string) => Promise<string | null>;
}) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [max, setMax] = useState<string | undefined>(undefined);
  // A retry of the same date must reuse the same request ID.
  const [requestId, setRequestId] = useState(() => makeRequestId());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setMax(toLocalInputValue(new Date())), []);

  const save = async () => {
    const date = fromLocalInputValue(value);
    if (!date) {
      setError("Elige el día y la hora en que entraron.");
      return;
    }
    if (date.getTime() > Date.now()) {
      setError("La fecha no puede ser futura.");
      return;
    }
    setBusy(true);
    setError("");
    const message = await props.onDate(props.lot.id, date.toISOString(), requestId);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="stock-lots__date">
      <label htmlFor={inputId}>
        {formatCount(props.lot.quantity_left)} {unitShort(props.unit)} · ¿cuándo entraron a la barra?
      </label>
      <div className="stock-lots__date-row">
        <input
          id={inputId}
          type="datetime-local"
          value={value}
          max={max}
          onChange={(event) => {
            setValue(event.target.value);
            setRequestId(makeRequestId());
            setError("");
          }}
          disabled={props.disabled || busy}
        />
        <button
          type="button"
          className="stock-button stock-button--outline"
          onClick={() => void save()}
          disabled={props.disabled || busy || !value}
        >
          {busy ? "Guardando…" : "Guardar fecha"}
        </button>
      </div>
      {error && <p className="stock-inline-error">{error}</p>}
    </div>
  );
}

type GroupDraft = {
  id: string | null;
  revision: number;
  name: string;
  fresh: string;
  discard: string;
  members: string[];
  requestId: string;
};

type ConfigState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; config: StockShelfLifeConfiguration };

function draftFrom(group: StockShelfLifeGroup | null): GroupDraft {
  return {
    id: group?.id ?? null,
    revision: group?.revision ?? 0,
    name: group?.name ?? "",
    fresh: group ? String(group.fresh_days) : "",
    discard: group ? String(group.discard_days) : "",
    members: group ? [...group.menu_item_ids] : [],
    requestId: makeRequestId()
  };
}

function days(value: number): string {
  return `${value} ${value === 1 ? "día" : "días"}`;
}

/**
 * "Plazos de cocina": named lifespan groups (e.g. Tortas · 2/3 días) with the
 * carta products they cover. Managers edit; staff read. New days apply only to
 * lots that enter after saving.
 */
export function ShelfLifeGroupsPanel(props: {
  titleId: string;
  onClose: () => void;
  onSessionExpired: () => void;
  onSaved: () => void;
}) {
  const { onSessionExpired, onSaved } = props;
  const [state, setState] = useState<ConfigState>({ status: "loading" });
  const [draft, setDraft] = useState<GroupDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const nameId = useId();
  const freshId = useId();
  const discardId = useId();

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", config: await getShelfLifeConfiguration() });
    } catch (loadError) {
      if (loadError instanceof StockRequestError && loadError.status === 401) {
        onSessionExpired();
        return;
      }
      setState({
        status: "error",
        message: loadError instanceof StockRequestError && loadError.status === 403
          ? "Tu cuenta no tiene permiso para ver los plazos."
          : "No pudimos leer los plazos de cocina."
      });
    }
  }, [onSessionExpired]);

  useEffect(() => {
    void load();
  }, [load]);

  const config = state.status === "ready" ? state.config : null;
  const nameById = new Map(config?.menu_items.map((item) => [item.id, item.name]) ?? []);
  const ownerOf = new Map<string, StockShelfLifeGroup>();
  for (const group of config?.groups ?? []) for (const id of group.menu_item_ids) ownerOf.set(id, group);

  const update = (patch: Partial<GroupDraft>) =>
    // Any change is a new request; only a retry of the same payload reuses the ID.
    setDraft((current) => (current ? { ...current, ...patch, requestId: makeRequestId() } : current));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || busy) return;
    const name = draft.name.trim();
    const fresh = Number(draft.fresh);
    const discard = Number(draft.discard);
    if (!name) return setError("Ponle un nombre al grupo.");
    if (!Number.isInteger(fresh) || fresh < 1) return setError("Fresca debe ser al menos 1 día.");
    if (!Number.isInteger(discard) || discard < fresh) return setError("Retirar no puede ser antes que fresca.");
    setBusy(true);
    setError("");
    const body = { name, fresh_days: fresh, discard_days: discard, menu_item_ids: draft.members, request_id: draft.requestId };
    try {
      const saved = draft.id
        ? await updateShelfLifeGroup(draft.id, { ...body, expected_revision: draft.revision })
        : await createShelfLifeGroup(body);
      setDraft(null);
      setSavedNote(`Guardado: ${saved.name}. Los lotes que entren desde ahora usan ${days(saved.fresh_days)} / ${days(saved.discard_days)}.`);
      onSaved();
      await load();
    } catch (saveError) {
      if (saveError instanceof StockRequestError && saveError.status === 401) {
        onSessionExpired();
        return;
      }
      if (saveError instanceof StockRequestError && saveError.status === 409) {
        const conflict = parseGroupConflict(saveError.body);
        if (conflict.code === "revision_conflict" && conflict.current) {
          setDraft({ ...draftFrom(conflict.current) });
          setError("Alguien cambió este grupo mientras editabas. Cargamos su versión; revisa y guarda de nuevo.");
        } else if (conflict.code === "shelf_life_group_conflict") {
          setError("Un producto ya pertenece a otro grupo. Quítalo de ese grupo primero.");
        } else if (conflict.code === "shelf_life_group_orphan") {
          setError("Un producto que quitas tiene unidades en la barra. Muévelo a otro grupo, no lo dejes sin plazo.");
        } else {
          setError("Esa solicitud ya se usó con otros datos. Revisa y guarda de nuevo.");
        }
        void load();
      } else if (saveError instanceof StockRequestError && saveError.ambiguous) {
        setError("No sabemos si se guardó. Guarda de nuevo: no se duplicará.");
      } else {
        setError(saveError instanceof StockRequestError && saveError.status === 403
          ? "Solo un encargado puede cambiar los plazos."
          : "No pudimos guardar el grupo. Revisa los datos.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stock-editor">
      <header className="stock-editor__head">
        <div>
          <p className="stock-editor__kind">Vida útil</p>
          <h2 id={props.titleId} tabIndex={-1}>Plazos de cocina</h2>
          <p className="stock-editor__help">
            Cada lote cuenta desde que entra a la barra. Los cambios valen para los lotes nuevos; los que ya están no se mueven.
          </p>
        </div>
        <button type="button" className="stock-icon-button" onClick={props.onClose} disabled={busy} aria-label="Cerrar">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </header>

      {savedNote && !draft && (
        <p className="stock-editor__saved" role="status">{savedNote}</p>
      )}
      {state.status === "loading" && <p className="stock-history__status" role="status">Cargando plazos…</p>}
      {state.status === "error" && (
        <div className="stock-callout" role="alert">
          <span>{state.message}</span>
          <button type="button" className="stock-text-button" onClick={() => void load()}>Reintentar</button>
        </div>
      )}

      {config && !draft && (
        <>
          {config.groups.length === 0 ? (
            <div className="stock-callout" role="note">
              <strong>Todavía no hay plazos.</strong>
              <span>
                {config.can_manage_rules
                  ? "Crea un grupo por plazo (por ejemplo, Tortas · fresca 2 días · retirar 3) y elige sus productos. Desde ahí, cada conteo arma los lotes."
                  : "Un encargado define los plazos. Mientras tanto, los conteos funcionan como siempre."}
              </span>
            </div>
          ) : (
            <ul className="stock-groups">
              {config.groups.map((group) => (
                <li key={group.id}>
                  <div className="stock-groups__line">
                    <strong>{group.name}</strong>
                    <span className="stock-mono">fresca {days(group.fresh_days)} · retirar día {group.discard_days}</span>
                  </div>
                  <p className="stock-groups__members">
                    {group.menu_item_ids.length === 0
                      ? "Sin productos"
                      : group.menu_item_ids.map((id) => nameById.get(id) ?? id).join(" · ")}
                  </p>
                  {config.can_manage_rules && (
                    <button type="button" className="stock-text-button" onClick={() => { setSavedNote(""); setError(""); setDraft(draftFrom(group)); }}>
                      Editar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {config.can_manage_rules && (
            <div className="stock-editor__actions">
              <button type="button" className="stock-button stock-button--outline" onClick={() => { setSavedNote(""); setError(""); setDraft(draftFrom(null)); }}>
                Nuevo grupo
              </button>
            </div>
          )}
        </>
      )}

      {config && draft && (
        <form className="stock-groups__form" onSubmit={(event) => void submit(event)} noValidate>
          <div className="stock-field">
            <label htmlFor={nameId}>Nombre del grupo</label>
            <input
              id={nameId}
              value={draft.name}
              maxLength={80}
              autoComplete="off"
              placeholder="Tortas de crema"
              onChange={(event) => update({ name: event.target.value })}
              disabled={busy}
            />
          </div>
          <div className="stock-groups__days">
            <div className="stock-field">
              <label htmlFor={freshId}>Fresca (días)</label>
              <input id={freshId} inputMode="numeric" value={draft.fresh} onChange={(event) => update({ fresh: event.target.value.replace(/\D/g, "") })} disabled={busy} />
            </div>
            <div className="stock-field">
              <label htmlFor={discardId}>Retirar el día</label>
              <input id={discardId} inputMode="numeric" value={draft.discard} onChange={(event) => update({ discard: event.target.value.replace(/\D/g, "") })} disabled={busy} />
            </div>
          </div>
          <fieldset className="stock-groups__picker" disabled={busy}>
            <legend>Productos</legend>
            {config.menu_items.map((item) => {
              const owner = ownerOf.get(item.id);
              const elsewhere = owner && owner.id !== draft.id ? owner : null;
              const checked = draft.members.includes(item.id);
              return (
                <label key={item.id} className={`stock-check${elsewhere ? " is-taken" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={elsewhere !== null}
                    onChange={(event) =>
                      update({
                        members: event.target.checked
                          ? [...draft.members, item.id]
                          : draft.members.filter((id) => id !== item.id)
                      })
                    }
                  />
                  <span>{item.name}</span>
                  {elsewhere && <span className="stock-check__count">{elsewhere.name}</span>}
                </label>
              );
            })}
          </fieldset>
          <div aria-live="polite">{error && <p className="stock-inline-error">{error}</p>}</div>
          <div className="stock-editor__actions">
            <button type="submit" className="stock-button" disabled={busy}>
              {busy ? "Guardando…" : draft.id ? "Guardar grupo" : "Crear grupo"}
            </button>
            <button type="button" className="stock-button stock-button--outline" onClick={() => { setDraft(null); setError(""); }} disabled={busy}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
