"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  beanAPI,
  BeanRequestError,
  requestMessage,
} from "../../../../src/bean-stock/client";
import { buildAdjustment } from "../../../../src/bean-stock/model";
import {
  readPending,
  savePending,
  clearPending,
} from "../../../../src/bean-stock/pending";
import {
  buildBeanShareText,
  beanWhatsAppUrl,
} from "../../../../src/bean-stock/share";
import type {
  BeanItem,
  Snapshot,
  Mode,
  HistoryPage,
  PendingOperation,
} from "../../../../src/bean-stock/types";
import { BeanCountForm, BeanList, StockSections, kgLabel } from "./BeanView";

type Draft = { mode: Mode; amount: string; reason: string };
const emptyDraft: Draft = { mode: "set", amount: "", reason: "" };
const errorText = requestMessage;
export function BeanWorkspace({
  uid,
  onProducts,
  onSessionExpired,
  api = beanAPI,
  initialSnapshot,
}: {
  uid: string;
  onProducts: () => void;
  onSessionExpired: (uid: string) => void;
  api?: typeof beanAPI;
  initialSnapshot?: Snapshot;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(
    initialSnapshot ?? null,
  );
  const [state, setState] = useState<
    "loading" | "ready" | "error" | "unavailable" | "forbidden"
  >(initialSnapshot ? "ready" : "loading");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [query, setQuery] = useState(""),
    [uncounted, setUncounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null),
    [share, setShare] = useState(false);
  const [shareReady, setShareReady] = useState(false);
  const [tab, setTab] = useState<"count" | "history" | "links">("count");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pending, setPending] = useState<PendingOperation | null>(null),
    [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState<HistoryPage | null>(null),
    [historyBusy, setHistoryBusy] = useState(false),
    [historyError, setHistoryError] = useState("");
  const [linkQuery, setLinkQuery] = useState(""),
    [linkIds, setLinkIds] = useState<string[]>([]);
  const [desktop, setDesktop] = useState(false);
  const dialog = useRef<HTMLDivElement>(null),
    returnFocus = useRef<string | null>(null);
  const live = useRef(true),
    serial = useRef(0),
    historySerial = useRef(0),
    busyRef = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      serial.current++;
      historySerial.current++;
    };
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const load = useCallback(async () => {
    const request = ++serial.current;
    try {
      const next = await api.getBeans(uid);
      if (!live.current || request !== serial.current) return null;
      setSnapshot(next);
      setState("ready");
      setError("");
      return next;
    } catch (e) {
      if (!live.current || request !== serial.current) return null;
      setState(
        e instanceof BeanRequestError && e.status === 404
          ? "unavailable"
          : e instanceof BeanRequestError && e.status === 403
            ? "forbidden"
            : "error",
      );
      setError(errorText(e));
      if (
        e instanceof BeanRequestError &&
        e.status === 401 &&
        e.code !== "session_changed"
      )
        onSessionExpired(uid);
      return null;
    }
  }, [api, uid, onSessionExpired]);
  useEffect(() => {
    const recovered = readPending(uid);
    if (recovered) {
      setPending(recovered);
      setSelected(recovered.beanId);
      setTab(recovered.kind === "links" ? "links" : "count");
      setNotice(
        "Hay un cambio por confirmar. Se conserva la operación original.",
      );
    }
    if (!initialSnapshot) void load();
  }, [uid, load, initialSnapshot]);
  const panelOpen = selected !== null || share;
  useEffect(() => {
    if (!panelOpen) return;
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.id
        : null;
    const frame = requestAnimationFrame(() =>
      dialog.current?.querySelector<HTMLElement>("h2")?.focus(),
    );
    const old = document.body.style.overflow;
    if (!desktop) document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = old;
      if (returnFocus.current)
        document.getElementById(returnFocus.current)?.focus();
    };
  }, [panelOpen, desktop]);
  const close = () => {
    if (busyRef.current) return;
    setSelected(null);
    setShare(false);
    setHistoryError("");
  };
  const open = (item: BeanItem) => {
    historySerial.current++;
    setSelected(item.id);
    setShare(false);
    setTab("count");
    setDraft(emptyDraft);
    setHistory(null);
    setHistoryError("");
    setConflict(false);
    setNotice("");
    setLinkQuery("");
    setLinkIds(
      snapshot?.links
        .filter((l) => l.bean_id === item.id)
        .map((l) => l.menu_item_id) ?? [],
    );
  };
  const locked = busy || pending !== null || conflict || state !== "ready";
  const item = snapshot?.items.find((b) => b.id === selected);
  const visible =
    snapshot?.items.filter(
      (b) =>
        (!uncounted || b.quantity_kg === null) &&
        b.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            query
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
    ) ?? [];
  const perform = async (op: PendingOperation, next = false) => {
    if (busyRef.current) return;
    const previouslyUnconfirmed = pending !== null;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      savePending(uid, op);
      setPending(op);
      const result =
        op.kind === "count"
          ? await api.adjustBean(uid, op.beanId, op.payload)
          : await api.putBeanLinks(uid, op.beanId, op.payload);
      if (!live.current) return;
      clearPending(uid);
      setPending(null);
      setConflict(false);
      setNotice(
        op.kind === "count" && "adjustment" in result
          ? `Conteo confirmado: ${kgLabel(result.adjustment.after_kg)}. Se muestra el stock más reciente.`
          : "Vínculos confirmados.",
      );
      const fresh = await load();
      if (!live.current) return;
      if (fresh) {
        setDraft(emptyDraft);
        setHistory(null);
        setLinkIds(
          fresh.links
            .filter((l) => l.bean_id === op.beanId)
            .map((l) => l.menu_item_id),
        );
        if (next) {
          const following = fresh.items.find(
            (b) => b.id !== op.beanId && b.quantity_kg === null,
          );
          if (following) open(following);
        }
      }
    } catch (e) {
      if (!live.current) return;
      setError(errorText(e));
      if (e instanceof BeanRequestError && e.status === 409) {
        setConflict(true);
        const fresh = await load();
        if (!live.current) return;
        if (fresh) {
          clearPending(uid);
          setPending(null);
          setConflict(true);
          setNotice(
            "El stock o sus vínculos cambiaron. Revisa el estado actual antes de guardar una operación nueva.",
          );
        }
      } else if (e instanceof BeanRequestError && e.status === 401) {
        if (e.code !== "session_changed") onSessionExpired(uid);
      } else if (
        e instanceof BeanRequestError &&
        !e.ambiguous &&
        !previouslyUnconfirmed &&
        e.status !== null &&
        e.status >= 400 &&
        e.status < 500
      ) {
        clearPending(uid);
        setPending(null);
        const fresh = await load();
        if (!live.current) return;
        if (op.kind === "links" && fresh && !fresh.can_manage_beans) {
          setLinkIds(
            fresh.links
              .filter((link) => link.bean_id === op.beanId)
              .map((link) => link.menu_item_id),
          );
        }
        setError(errorText(e));
      }
    } finally {
      busyRef.current = false;
      if (live.current) setBusy(false);
    }
  };
  const saveCount = (next: boolean) => {
    if (!item || locked) return;
    try {
      const payload = buildAdjustment(
        item,
        draft.mode,
        draft.amount,
        crypto.randomUUID(),
        draft.reason,
      );
      void perform({ kind: "count", beanId: item.id, payload }, next);
    } catch (e) {
      setError(errorText(e));
    }
  };
  const showHistory = async (more = false) => {
    if (!item) return;
    setTab("history");
    setHistoryBusy(true);
    setHistoryError("");
    const request = ++historySerial.current;
    try {
      const page = await api.getBeanHistory(
        uid,
        item.id,
        more ? (history?.next_before_revision ?? undefined) : undefined,
      );
      if (!live.current || request !== historySerial.current) return;
      setHistory((prev) =>
        more && prev
          ? { ...page, entries: [...prev.entries, ...page.entries] }
          : page,
      );
    } catch (e) {
      if (!live.current || request !== historySerial.current) return;
      setHistoryError(errorText(e));
      if (
        e instanceof BeanRequestError &&
        e.status === 401 &&
        e.code !== "session_changed"
      )
        onSessionExpired(uid);
    } finally {
      if (live.current && request === historySerial.current)
        setHistoryBusy(false);
    }
  };
  const showLinks = () => {
    setTab("links");
    setLinkIds(
      snapshot?.links
        .filter((l) => l.bean_id === selected)
        .map((l) => l.menu_item_id) ?? [],
    );
  };
  const review = () => {
    if (!snapshot || state !== "ready") return;
    setConflict(false);
    setError("");
    setNotice("Estado actualizado. Revisa tu ingreso y vuelve a guardar.");
    setLinkIds(
      snapshot.links
        .filter((l) => l.bean_id === selected)
        .map((l) => l.menu_item_id),
    );
  };
  const trap = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key !== "Tab" || desktop) return;
    const nodes = dialog.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),a[href],textarea:not(:disabled),[tabindex="0"]',
    );
    if (!nodes?.length) return;
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement?.tagName === "H2")
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const shareText = snapshot ? buildBeanShareText(snapshot) : "";
  return (
    <div
      className={`stock-workspace bean-workspace${panelOpen ? " has-panel" : ""}`}
    >
      <main className="stock-main">
        <div className="stock-heading">
          <div>
            <h1>Stock de barra</h1>
            <p className="stock-heading__meta">
              {snapshot
                ? `${new Date(snapshot.now).toLocaleDateString("es-CL", { day: "numeric", month: "short" })} · ${snapshot.items.length} granos · ${snapshot.items.filter((b) => b.quantity_kg === null).length} sin contar`
                : "Granos · kg"}
            </p>
          </div>
          <button
            id="bean-share"
            type="button"
            className="stock-button stock-button--outline"
            disabled={
              !snapshot || state !== "ready" || pending !== null || busy
            }
            onClick={() => {
              setShare(true);
              setShareReady(false);
              setSelected(null);
              setNotice("");
              void load().then((fresh) => {
                if (live.current && fresh) setShareReady(true);
              });
            }}
          >
            Compartir granos
          </button>
        </div>
        <StockSections
          active="beans"
          locked={busy || pending !== null}
          onProducts={onProducts}
          onBeans={() => {}}
        />
        <div className="stock-visibility" role="note">
          <span className="stock-visibility__tag">Carta</span>
          <span>
            Sin contar no es cero. La disponibilidad manual se mantiene hasta el
            primer conteo.
          </span>
        </div>
        {pending && !panelOpen && (
          <div className="stock-banner" role="alert">
            <span>Hay un cambio por confirmar.</span>
            <button
              className="stock-text-button"
              onClick={() => {
                setSelected(pending.beanId);
                setTab(pending.kind === "count" ? "count" : "links");
              }}
            >
              Retomar
            </button>
          </div>
        )}
        {state === "loading" && !snapshot && (
          <div className="stock-loading" role="status">
            Cargando granos…
          </div>
        )}
        {state === "unavailable" ? (
          <div className="stock-empty">
            <strong>Granos aún no habilitado.</strong>
            <span>
              Esta versión del servidor todavía no tiene el stock de granos.
            </span>
            <button
              className="stock-button stock-button--outline"
              onClick={onProducts}
            >
              Volver a productos
            </button>
          </div>
        ) : state === "forbidden" ? (
          <div className="stock-empty" role="alert">
            <strong>Tu cuenta no tiene acceso al stock de granos.</strong>
          </div>
        ) : (
          <>
            {state === "error" && (
              <div className="stock-banner" role="alert">
                <span>
                  Sin conexión con el stock. {error} No se puede guardar.
                </span>
                <button
                  className="stock-text-button"
                  onClick={() => void load()}
                >
                  Reintentar
                </button>
              </div>
            )}
            {snapshot && (
              <>
                <section
                  className="stock-controls bean-controls"
                  aria-label="Buscar y filtrar granos"
                >
                  <div className="stock-search">
                    <label
                      htmlFor="bean-search"
                      className="stock-visually-hidden"
                    >
                      Buscar grano
                    </label>
                    <input
                      id="bean-search"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar grano"
                    />
                  </div>
                  <label className="stock-check">
                    <input
                      type="checkbox"
                      checked={uncounted}
                      onChange={(e) => setUncounted(e.target.checked)}
                    />
                    <span>Solo sin contar</span>
                    <span className="stock-mono">
                      {
                        snapshot.items.filter((b) => b.quantity_kg === null)
                          .length
                      }
                    </span>
                  </label>
                </section>
                {snapshot.items.length === 0 ? (
                  <div className="stock-empty">
                    <strong>Aún no hay granos configurados.</strong>
                    <span>
                      Administración debe completar la configuración inicial.
                    </span>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="stock-empty">
                    <strong>No hay granos en esta búsqueda.</strong>
                    <button
                      className="stock-text-button"
                      onClick={() => {
                        setQuery("");
                        setUncounted(false);
                      }}
                    >
                      Mostrar todos
                    </button>
                  </div>
                ) : (
                  <BeanList
                    items={visible}
                    menuItems={snapshot.menu_items}
                    links={snapshot.links}
                    selected={selected ?? undefined}
                    locked={busy || state !== "ready" || pending !== null}
                    onOpen={open}
                  />
                )}
              </>
            )}
          </>
        )}
        {!panelOpen && notice && <p role="status">{notice}</p>}
      </main>
      {panelOpen ? (
        <>
          {!desktop && (
            <div
              className="stock-backdrop"
              aria-hidden="true"
              onClick={close}
            />
          )}
          <div
            ref={dialog}
            className="stock-panel"
            role="dialog"
            aria-modal={!desktop || undefined}
            aria-labelledby="bean-panel-title"
            onKeyDown={trap}
          >
            <div className="stock-editor">
              <div className="stock-editor__head">
                <h2 id="bean-panel-title" tabIndex={-1}>
                  {share
                    ? "Compartir granos"
                    : (item?.name ?? "Cambio pendiente")}
                </h2>
                <button
                  className="stock-text-button"
                  disabled={busy}
                  onClick={close}
                >
                  Cerrar
                </button>
              </div>
              {notice && (
                <div className="stock-callout" role="status">
                  {notice}
                </div>
              )}
              {error && (
                <p className="stock-inline-error" role="alert">
                  {error}
                </p>
              )}
              {pending && (
                <div className="stock-callout" role="alert">
                  <strong>Guardado por confirmar</strong>
                  <span>
                    Tu ingreso se conserva. Se reintentará la misma operación
                    para evitar un doble registro.
                  </span>
                  <span className="stock-mono">
                    {pending.kind === "count"
                      ? `${pending.payload.mode === "set" ? "Fijar" : "Ajustar"} ${pending.payload.quantity_kg} kg`
                      : "Cambio de vínculos con la carta"}
                  </span>
                  <button
                    className="stock-button"
                    disabled={busy}
                    onClick={() => void perform(pending)}
                  >
                    Comprobar y reintentar
                  </button>
                </div>
              )}
              {conflict && (
                <div className="stock-callout" role="alert">
                  <strong>El stock cambió</strong>
                  <span>
                    Actual: {kgLabel(item?.quantity_kg ?? null)}. Tu ingreso:{" "}
                    {draft.amount || "sin ingreso"} kg. Nada se sobrescribe
                    automáticamente.
                  </span>
                  <button
                    className="stock-button stock-button--outline"
                    disabled={busy || state !== "ready" || pending !== null}
                    onClick={review}
                  >
                    Revisar con stock actualizado
                  </button>
                </div>
              )}
              {share ? (
                <>
                  {!shareReady && (
                    <div role="status">
                      Actualizando el reporte…{" "}
                      <button
                        className="stock-text-button"
                        onClick={() =>
                          void load().then((fresh) => {
                            if (live.current && fresh) setShareReady(true);
                          })
                        }
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  <p className="bean-help">
                    Incluye todos los granos, aunque haya filtros activos.
                  </p>
                  <textarea
                    className="bean-share-text stock-mono"
                    readOnly
                    aria-label="Texto para compartir"
                    value={shareText}
                  />
                  <button
                    className="stock-button"
                    disabled={!shareReady || state !== "ready"}
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(shareText)
                        .then(() => setNotice("Texto copiado."))
                        .catch(() =>
                          setError(
                            "No pudimos copiar. Selecciona el texto para copiarlo manualmente.",
                          ),
                        )
                    }
                  >
                    Copiar texto
                  </button>
                  <a
                    className="stock-button stock-button--outline"
                    aria-disabled={!shareReady || state !== "ready"}
                    href={
                      shareReady && state === "ready"
                        ? beanWhatsAppUrl(shareText)
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir WhatsApp
                  </a>
                </>
              ) : item ? (
                <>
                  <div
                    className="bean-tabs"
                    role="group"
                    aria-label="Detalle del grano"
                  >
                    <button
                      className="stock-text-button"
                      aria-pressed={tab === "count"}
                      onClick={() => setTab("count")}
                    >
                      Conteo
                    </button>
                    <button
                      className="stock-text-button"
                      aria-pressed={tab === "history"}
                      onClick={() => void showHistory()}
                    >
                      Historial
                    </button>
                    <button
                      className="stock-text-button"
                      aria-pressed={tab === "links"}
                      onClick={showLinks}
                    >
                      Carta
                    </button>
                  </div>
                  {tab === "count" ? (
                    <BeanCountForm
                      item={item}
                      {...draft}
                      locked={locked}
                      onChange={(patch) =>
                        setDraft((d) => ({ ...d, ...patch }))
                      }
                      onSave={saveCount}
                      hasNext={snapshot!.items.some(
                        (b) => b.id !== item.id && b.quantity_kg === null,
                      )}
                    />
                  ) : tab === "history" ? (
                    <section aria-label="Historial de conteos">
                      {historyBusy && <p role="status">Cargando historial…</p>}
                      {historyError && (
                        <div role="alert">
                          <p>{historyError}</p>
                          <button
                            className="stock-text-button"
                            onClick={() => void showHistory()}
                          >
                            Reintentar
                          </button>
                        </div>
                      )}
                      {history?.entries.length === 0 && (
                        <div className="stock-empty">
                          <strong>Aún no hay conteos para este grano.</strong>
                          <span>
                            Al guardar el primero verás la fecha, quién lo
                            registró, el cambio y su motivo.
                          </span>
                        </div>
                      )}
                      <ol className="bean-history">
                        {history?.entries.map((entry) => (
                          <li key={entry.id}>
                            <span className="stock-mono">
                              {new Date(entry.created_at).toLocaleString(
                                "es-CL",
                              )}
                            </span>
                            <strong>
                              {kgLabel(entry.before_kg)} →{" "}
                              {kgLabel(entry.after_kg)}
                            </strong>
                            <span>{entry.actor_id}</span>
                            {entry.reason && <span>{entry.reason}</span>}
                          </li>
                        ))}
                      </ol>
                      {history?.has_more && (
                        <button
                          className="stock-button stock-button--outline"
                          disabled={historyBusy}
                          onClick={() => void showHistory(true)}
                        >
                          Ver anteriores
                        </button>
                      )}
                    </section>
                  ) : (
                    <section
                      className="stock-editor"
                      aria-label="Vínculos con carta"
                    >
                      <p className="bean-help">
                        {snapshot!.can_manage_beans
                          ? "Selecciona los productos vinculados."
                          : "Puedes consultar los vínculos. Solo administración puede editarlos."}{" "}
                        Vincular no publica una opción ni cambia su precio.
                      </p>
                      <label className="stock-field">
                        Buscar producto de la carta
                        <input
                          type="search"
                          value={linkQuery}
                          onChange={(e) => setLinkQuery(e.target.value)}
                        />
                      </label>
                      <ul className="bean-links">
                        {snapshot!.menu_items
                          .filter(
                            (m) =>
                              (snapshot!.can_manage_beans ||
                                linkIds.includes(m.id)) &&
                              m.name
                                .toLocaleLowerCase("es-CL")
                                .includes(linkQuery.toLocaleLowerCase("es-CL")),
                          )
                          .map((m) => (
                            <li key={m.id}>
                              <label className="stock-check">
                                <input
                                  type="checkbox"
                                  checked={linkIds.includes(m.id)}
                                  disabled={
                                    !snapshot!.can_manage_beans || locked
                                  }
                                  onChange={(e) =>
                                    setLinkIds((ids) =>
                                      e.target.checked
                                        ? [...ids, m.id]
                                        : ids.filter((id) => id !== m.id),
                                    )
                                  }
                                />
                                <span>
                                  {m.name}
                                  <small>
                                    {m.origin_ids.includes(item.origin_id)
                                      ? "Opción configurada"
                                      : "Pendiente de configuración"}
                                    {m.available
                                      ? ""
                                      : " · Pausado manualmente"}
                                  </small>
                                </span>
                              </label>
                            </li>
                          ))}
                      </ul>
                      {!snapshot!.can_manage_beans && linkIds.length === 0 && (
                        <p>Sin productos vinculados.</p>
                      )}
                      {snapshot!.can_manage_beans && (
                        <button
                          className="stock-button"
                          disabled={locked}
                          onClick={() =>
                            void perform({
                              kind: "links",
                              beanId: item.id,
                              payload: {
                                menu_item_ids: linkIds,
                                expected_menu_item_ids: snapshot!.links
                                  .filter((l) => l.bean_id === item.id)
                                  .map((l) => l.menu_item_id),
                                request_id: crypto.randomUUID(),
                              },
                            })
                          }
                        >
                          Guardar vínculos
                        </button>
                      )}
                    </section>
                  )}
                </>
              ) : (
                !pending && <p>Este grano ya no está en el stock.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <aside className="stock-panel stock-panel--empty">
          <p>
            Elige un grano para contar, ver su historial o consultar sus
            vínculos con la carta.
          </p>
        </aside>
      )}
    </div>
  );
}
