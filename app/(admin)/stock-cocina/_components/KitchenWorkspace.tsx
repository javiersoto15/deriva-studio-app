"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  kitchenAPI,
  KitchenRequestError,
  requestMessage,
  type KitchenAPI,
} from "../../../../src/kitchen-stock/client";
import {
  CATEGORIES,
  type Category,
  type KitchenItem,
  type Snapshot,
  type Mode,
  type HistoryPage,
} from "../../../../src/kitchen-stock/types";
import {
  countLabel,
  formatAmount,
  formatMoment,
  formatShare,
  ingredientMatches,
  normalizeName,
  parseQuantity,
  previewCount,
  whatsappUrl,
} from "../../../../src/kitchen-stock/model";
import { IngredientSuggestions } from "./IngredientSuggestions";

type Panel =
  | { kind: "create" }
  | { kind: "adjust"; id: string }
  | { kind: "history"; id: string }
  | { kind: "share" };
import {
  readPending,
  writePending,
  clearPending,
  mutationRecovery,
  type PendingMutation as Pending,
} from "../../../../src/kitchen-stock/pending";
const MODES: { id: Mode; label: string }[] = [
  { id: "set", label: "Fijar total" },
  { id: "add", label: "Sumar" },
  { id: "subtract", label: "Restar" },
];
const UNITS = [
  "unidades",
  "kg",
  "g",
  "L",
  "ml",
  "paquetes",
  "potes",
  "barra",
  "botellas",
  "tarros",
  "cajas",
  "bandeja",
  "mata",
  "guatero",
];
export function KitchenWorkspace({
  accountEmail = "",
  accountId = "",
  onBlockingChange,
  onReauthenticate,
  initialSnapshot = null,
  api = kitchenAPI,
  initialPanel = null,
}: {
  accountEmail?: string;
  accountId?: string;
  onBlockingChange?: (blocked: boolean) => void;
  onReauthenticate?: () => void;
  initialSnapshot?: Snapshot | null;
  api?: KitchenAPI;
  initialPanel?: Panel | null;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot);
  const [load, setLoad] = useState<"loading" | "ready" | "error">(
    initialSnapshot ? "ready" : "loading",
  );
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [uncounted, setUncounted] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(initialPanel);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("verduras");
  const [unit, setUnit] = useState("unidades");
  const [packageNote, setPackageNote] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mode, setMode] = useState<Mode>("set");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [reauthenticate, setReauthenticate] = useState(false);
  const [existing, setExisting] = useState<KitchenItem | null>(null);
  const [activeMatch, setActiveMatch] = useState(-1);
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [share, setShare] = useState<Snapshot | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const items = snapshot?.items ?? [];
  const selected =
    panel && "id" in panel ? items.find((x) => x.id === panel.id) : undefined;
  const matches = useMemo(() => ingredientMatches(items, name), [items, name]);
  const exact = items.find(
    (x) => normalizeName(x.name) === normalizeName(name),
  );
  const visible = useMemo(
    () =>
      items.filter(
        (x) =>
          (category === "all" || x.category === category) &&
          (!uncounted || x.quantity === null) &&
          normalizeName(x.name).includes(normalizeName(search)),
      ),
    [items, category, uncounted, search],
  );
  const refresh = useCallback(async () => {
    const run = ++generation.current;
    try {
      const next = await api.list();
      if (!mounted.current || run !== generation.current) return;
      setSnapshot(next);
      setLoad("ready");
      setError("");
    } catch (e) {
      if (!mounted.current || run !== generation.current) return;
      setLoad("error");
      setError(requestMessage(e));
    }
  }, [api]);
  useEffect(() => {
    mounted.current = true;
    if (!initialSnapshot) void refresh();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [initialSnapshot, refresh]);
  useEffect(() => {
    if (!accountId) return;
    let saved: Pending | null = null;
    try {
      saved = readPending(sessionStorage, accountId);
    } catch {
      /* Storage can be unavailable; saving is blocked in mutate. */
    }
    if (!saved) return;
    pendingRef.current = saved;
    setPending(saved);
    if (saved.kind === "create") {
      setName(saved.payload.name);
      setNewCategory(saved.payload.category);
      setUnit(saved.payload.unit ?? "");
      setPackageNote(saved.payload.package_note);
      setQuantity(saved.payload.quantity ?? "");
      setPanel({ kind: "create" });
    } else {
      setMode(saved.payload.mode);
      setQuantity(saved.payload.amount);
      setReason(saved.payload.reason);
      setPanel({ kind: "adjust", id: saved.id });
    }
    setFieldError(
      "Hay un cambio sin confirmar de esta sesión. Reinténtalo con los mismos datos.",
    );
  }, [accountId]);
  useEffect(() => {
    const blocked = pending !== null || busy;
    onBlockingChange?.(blocked || panel !== null);
    const preventLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    if (blocked) window.addEventListener("beforeunload", preventLeave);
    return () => {
      window.removeEventListener("beforeunload", preventLeave);
      onBlockingChange?.(false);
    };
  }, [pending, busy, panel, onBlockingChange]);
  useEffect(() => {
    if (panel) {
      const el = panelRef.current;
      el?.querySelector<HTMLElement>("h2")?.focus();
    } else {
      returnFocus.current?.focus();
    }
  }, [panel]);
  function close() {
    if (pendingRef.current || busyRef.current) return;
    generation.current++;
    setPanel(null);
    setFieldError("");
    setExisting(null);
  }
  function open(next: Panel) {
    if (pendingRef.current || busyRef.current) return;
    generation.current++;
    returnFocus.current = document.activeElement as HTMLElement;
    setFieldError("");
    setExisting(null);
    setNotice("");
    setPanel(next);
  }
  function openAdjust(item: KitchenItem) {
    setMode("set");
    setQuantity(item.quantity ?? "");
    setReason("");
    open({ kind: "adjust", id: item.id });
  }
  function openCreate() {
    setName("");
    setNewCategory(category === "all" ? "verduras" : category);
    setUnit("unidades");
    setPackageNote("");
    setQuantity("");
    setActiveMatch(-1);
    open({ kind: "create" });
  }
  function install(item: KitchenItem) {
    setSnapshot((s) =>
      s
        ? {
            ...s,
            items: s.items.some((x) => x.id === item.id)
              ? s.items.map((x) => (x.id === item.id ? item : x))
              : [...s.items, item],
          }
        : s,
    );
  }
  async function mutate(change: Pending) {
    if (busyRef.current) return;
    const previouslyUnconfirmed = pendingRef.current !== null;
    // Save before the request: even a reload during an in-flight mutation must replay its original ID.
    if (accountId) {
      try {
        writePending(sessionStorage, accountId, change);
      } catch {
        setFieldError(
          "No pudimos conservar el cambio para reintentos. Habilita el almacenamiento de esta pestaña antes de guardar.",
        );
        return;
      }
    }
    generation.current++;
    pendingRef.current = change;
    setPending(change);
    busyRef.current = true;
    setBusy(true);
    setFieldError("");
    setReauthenticate(false);
    function confirmed() {
      if (accountId) {
        try {
          clearPending(sessionStorage, accountId);
        } catch {
          /* Replaying this confirmed request remains safe. */
        }
      }
      pendingRef.current = null;
      setPending(null);
    }
    try {
      const item =
        change.kind === "create"
          ? await api.create(change.payload)
          : await api.adjust(change.id, change.payload);
      if (!mounted.current) return;
      // Replays return their immutable result. Read current inventory before enabling another edit.
      try {
        const latest = await api.list();
        if (!mounted.current) return;
        setSnapshot(latest);
        setLoad("ready");
        setError("");
      } catch {
        if (!mounted.current) return;
        install(item);
        setLoad("error");
        setError(
          "El cambio se guardó, pero no pudimos actualizar el inventario. Actualiza la lista antes de seguir.",
        );
      }
      confirmed();
      setPanel(null);
      setNotice(`${item.name}: cambio guardado.`);
    } catch (e) {
      if (!mounted.current) return;
      const recovery = mutationRecovery(
        previouslyUnconfirmed,
        e instanceof KitchenRequestError
          ? {
              status: e.status,
              ambiguous: e.ambiguous,
              code: e.code,
              validItem: e.item !== null,
            }
          : { status: null, ambiguous: true },
      );
      setReauthenticate(recovery.reauthenticate);
      if (!recovery.keepRequest) {
        confirmed();
        if (e instanceof KitchenRequestError && e.item) {
          install(e.item);
          setExisting(e.item);
        }
      }
      setFieldError(requestMessage(e));
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function create(e: FormEvent) {
    e.preventDefault();
    if (pendingRef.current || busyRef.current) return;
    if (!name.trim()) {
      setFieldError("Escribe el nombre del ingrediente.");
      return;
    }
    if (exact) {
      setExisting(exact);
      setFieldError("Este ingrediente ya existe. Usa el registro existente.");
      return;
    }
    const amount = quantity.trim() ? parseQuantity(quantity) : null;
    if (quantity.trim() && amount === null) {
      setFieldError("Usa una cantidad desde 0, con hasta tres decimales.");
      return;
    }
    void mutate({
      kind: "create",
      payload: {
        name: name.trim(),
        category: newCategory,
        unit: unit.trim() || null,
        package_note: packageNote.trim(),
        quantity: amount,
        request_id: crypto.randomUUID(),
      },
    });
  }
  function adjust(e: FormEvent) {
    e.preventDefault();
    if (!selected || pendingRef.current || busyRef.current) return;
    const amount = parseQuantity(quantity);
    if (
      amount === null ||
      previewCount(selected.quantity, mode, quantity) === null
    ) {
      setFieldError(
        "Revisa la cantidad. El total no puede quedar bajo cero; si está sin contar, fija el total primero.",
      );
      return;
    }
    void mutate({
      kind: "adjust",
      id: selected.id,
      payload: {
        mode,
        amount,
        reason: reason.trim(),
        expected_revision: selected.revision,
        request_id: crypto.randomUUID(),
      },
    });
  }
  async function openHistory(item: KitchenItem) {
    open({ kind: "history", id: item.id });
    setHistory(null);
    await historyPage(item.id);
  }
  async function historyPage(id: string, before?: number) {
    const run = ++generation.current;
    setHistoryBusy(true);
    setFieldError("");
    try {
      const page = await api.history(id, before);
      if (!mounted.current || run !== generation.current) return;
      setHistory((old) =>
        before && old
          ? { ...page, entries: [...old.entries, ...page.entries] }
          : page,
      );
    } catch (e) {
      if (mounted.current && run === generation.current)
        setFieldError(requestMessage(e));
    } finally {
      if (mounted.current && run === generation.current) setHistoryBusy(false);
    }
  }
  async function refreshShare() {
    const run = ++generation.current;
    setShare(null);
    setShareBusy(true);
    setCopied(false);
    setFieldError("");
    try {
      const next = await api.list();
      if (mounted.current && run === generation.current) {
        setShare(next);
        setSnapshot(next);
        setLoad("ready");
      }
    } catch (e) {
      if (mounted.current && run === generation.current)
        setFieldError(requestMessage(e));
    } finally {
      if (mounted.current && run === generation.current) setShareBusy(false);
    }
  }
  function openShare() {
    open({ kind: "share" });
    void refreshShare();
  }
  async function copy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(formatShare(share.items, share.now));
      setCopied(true);
      setFieldError("");
    } catch {
      setFieldError(
        "No pudimos copiar. Selecciona el mensaje y cópialo manualmente.",
      );
    }
  }
  function panelKeys(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement?.id === "kitchen-panel-title")
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  function matchKeys(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveMatch((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveMatch((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeMatch >= 0 && matches[activeMatch]) {
      e.preventDefault();
      openAdjust(matches[activeMatch]);
    } else if (e.key === "Escape") {
      setActiveMatch(-1);
    }
  }
  const locked = busy || pending !== null;
  const shareText = share ? formatShare(share.items, share.now) : "";
  return (
    <div className={`kitchen-workspace${panel ? " has-panel" : ""}`}>
      <main className="kitchen-main" inert={!!panel}>
        <div className="stock-heading">
          <div>
            <h1>Stock de cocina</h1>
            <p className="stock-heading__meta">
              {snapshot
                ? `${items.length} ingredientes · ${items.filter((x) => x.quantity === null).length} sin contar`
                : "Inventario de cocina"}
            </p>
          </div>
          <div className="kitchen-heading-actions">
            <button
              className="stock-button stock-button--outline"
              disabled={!snapshot || load !== "ready" || locked}
              onClick={openShare}
            >
              Compartir stock
            </button>
            <button
              className="stock-button stock-button--outline"
              disabled={!snapshot || load !== "ready" || locked}
              onClick={openCreate}
            >
              + Añadir ingrediente
            </button>
          </div>
        </div>
        <p className="kitchen-context">
          Conteos de cocina · ingredientes y cantidades guardadas
        </p>
        {accountEmail && <p className="kitchen-account">{accountEmail}</p>}
        {notice && (
          <p className="kitchen-notice" role="status">
            {notice}
          </p>
        )}
        {load === "loading" && <p role="status">Cargando ingredientes…</p>}
        {error && (
          <div className="kitchen-callout" role="alert">
            <strong>
              {snapshot
                ? "Mostrando el último inventario leído. No se puede guardar."
                : "No pudimos cargar el inventario."}
            </strong>
            <p>{error}</p>
            <button
              className="stock-button stock-button--outline"
              onClick={() => void refresh()}
            >
              Volver a intentar
            </button>
          </div>
        )}
        {snapshot && (
          <>
            <div className="kitchen-controls">
              <label className="stock-visually-hidden" htmlFor="kitchen-search">
                Buscar ingrediente
              </label>
              <input
                id="kitchen-search"
                className="kitchen-input"
                type="search"
                placeholder="Buscar ingrediente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <label className="kitchen-check">
                <input
                  type="checkbox"
                  checked={uncounted}
                  onChange={(e) => setUncounted(e.target.checked)}
                />{" "}
                Solo sin contar
              </label>
            </div>
            <div
              className="kitchen-categories"
              role="group"
              aria-label="Categoría"
            >
              <button
                aria-pressed={category === "all"}
                onClick={() => setCategory("all")}
              >
                Todos · {items.length}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label} · {items.filter((x) => x.category === c.id).length}
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <div className="kitchen-empty">
                <h2>
                  {items.length
                    ? "No hay coincidencias"
                    : "Aún no hay ingredientes"}
                </h2>
                <p>
                  {items.length
                    ? "Prueba otro nombre o categoría."
                    : "Añade el primer ingrediente para comenzar."}
                </p>
                {items.length > 0 && (
                  <button
                    className="stock-text-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                      setUncounted(false);
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              CATEGORIES.map((c) => {
                const rows = visible.filter((x) => x.category === c.id);
                return rows.length ? (
                  <section
                    className="kitchen-group"
                    key={c.id}
                    aria-labelledby={`category-${c.id}`}
                  >
                    <h2 id={`category-${c.id}`}>
                      {c.label}
                      <span>{rows.length}</span>
                    </h2>
                    <div className="kitchen-list">
                      {rows.map((item) => (
                        <article className="kitchen-row" key={item.id}>
                          <div className="kitchen-row-name">
                            <h3>{item.name}</h3>
                            {item.package_note && <p>{item.package_note}</p>}
                            <small>
                              {item.counted_at
                                ? `Conteo ${formatMoment(item.counted_at)}`
                                : "Sin fecha de conteo"}
                            </small>
                          </div>
                          <button
                            className={`kitchen-count${item.quantity === "0" ? " is-zero" : ""}`}
                            disabled={load !== "ready" || locked}
                            onClick={() => openAdjust(item)}
                            aria-label={`Editar ${item.name}: ${countLabel(item)}`}
                          >
                            {countLabel(item)}
                          </button>
                          <button
                            className="stock-text-button kitchen-history"
                            disabled={locked}
                            onClick={() => void openHistory(item)}
                            aria-label={`Historial de ${item.name}`}
                          >
                            Historial
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null;
              })
            )}
          </>
        )}
      </main>
      {panel && (
        <>
          <div className="kitchen-backdrop" aria-hidden="true" />
          <aside
            className="kitchen-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kitchen-panel-title"
            ref={panelRef}
            onKeyDown={panelKeys}
          >
            <header className="kitchen-editor-head">
              <div>
                <p className="stock-editor__kind">COCINA</p>
                <h2 id="kitchen-panel-title" tabIndex={-1}>
                  {panel.kind === "create"
                    ? "Añadir ingrediente"
                    : panel.kind === "share"
                      ? "Compartir stock"
                      : panel.kind === "history"
                        ? "Historial"
                        : (selected?.name ?? "Ingrediente")}
                </h2>
              </div>
              <button
                className="stock-icon-button"
                disabled={locked}
                onClick={close}
                aria-label="Cerrar"
              >
                ×
              </button>
            </header>
            {fieldError && (
              <div className="kitchen-callout" role="alert">
                <p>{fieldError}</p>
                {reauthenticate && onReauthenticate && (
                  <button
                    className="stock-button stock-button--outline"
                    disabled={busy}
                    onClick={onReauthenticate}
                  >
                    Volver a iniciar sesión
                  </button>
                )}
                {existing && panel.kind === "create" && (
                  <button
                    className="stock-text-button"
                    onClick={() => openAdjust(existing)}
                  >
                    Usar {existing.name}
                  </button>
                )}
              </div>
            )}
            {pending && (
              <div className="kitchen-callout" role="status">
                <strong>Cambio sin confirmar</strong>
                <p>
                  El resultado puede haberse guardado. Reintenta con los mismos
                  datos para evitar duplicarlo.
                </p>
                <button
                  className="stock-button"
                  disabled={busy}
                  onClick={() => void mutate(pending)}
                >
                  Reintentar el mismo cambio
                </button>
              </div>
            )}
            {panel.kind === "create" && (
              <form onSubmit={create}>
                <fieldset disabled={locked}>
                  <label htmlFor="ingredient-name">Nombre</label>
                  <input
                    id="ingredient-name"
                    className="kitchen-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={matches.length > 0}
                    aria-controls="ingredient-matches"
                    aria-activedescendant={
                      activeMatch >= 0 ? `match-${activeMatch}` : undefined
                    }
                    value={name}
                    maxLength={120}
                    autoComplete="off"
                    required
                    onKeyDown={matchKeys}
                    onChange={(e) => {
                      setName(e.target.value);
                      setActiveMatch(-1);
                      setExisting(null);
                    }}
                  />
                  <p className="kitchen-help">
                    Revisa los ingredientes existentes antes de crear uno nuevo.
                  </p>
                  {matches.length > 0 ? (
                    <IngredientSuggestions
                      matches={matches}
                      activeIndex={activeMatch}
                      disabled={locked}
                      onSelect={openAdjust}
                    />
                  ) : (
                    name.trim() && (
                      <p className="kitchen-help" role="status">
                        No encontramos coincidencias. Puedes crear este
                        ingrediente.
                      </p>
                    )
                  )}
                  <label htmlFor="ingredient-category">Categoría</label>
                  <select
                    id="ingredient-category"
                    className="kitchen-input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                  >
                    {CATEGORIES.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="ingredient-unit">Unidad</label>
                  <input
                    id="ingredient-unit"
                    className="kitchen-input"
                    list="kitchen-units"
                    value={unit}
                    maxLength={40}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                  <datalist id="kitchen-units">
                    {UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                  <p className="kitchen-help">
                    Si no está indicada, déjala vacía. No convertimos paquetes a
                    kg.
                  </p>
                  <label htmlFor="ingredient-package">
                    Detalle del envase (opcional)
                  </label>
                  <input
                    id="ingredient-package"
                    className="kitchen-input"
                    placeholder="Ej. 250 g c/u"
                    value={packageNote}
                    maxLength={500}
                    onChange={(e) => setPackageNote(e.target.value)}
                  />
                  <label htmlFor="ingredient-quantity">
                    Cantidad inicial (opcional)
                  </label>
                  <input
                    id="ingredient-quantity"
                    className="kitchen-input"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <p className="kitchen-help">
                    Vacío significa sin contar. 0 significa agotado.
                  </p>
                  <button
                    className="stock-button kitchen-save"
                    disabled={!!exact || !name.trim()}
                  >
                    {busy ? "Guardando…" : "Crear ingrediente"}
                  </button>
                </fieldset>
              </form>
            )}
            {panel.kind === "adjust" && selected && (
              <form onSubmit={adjust}>
                <p className="kitchen-current">
                  Guardado: <strong>{countLabel(selected)}</strong>
                </p>
                {selected.package_note && (
                  <p className="kitchen-help">{selected.package_note}</p>
                )}
                <fieldset disabled={locked}>
                  <div
                    className="kitchen-modes"
                    role="group"
                    aria-label="Tipo de cambio"
                  >
                    {MODES.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        aria-pressed={mode === m.id}
                        disabled={selected.quantity === null && m.id !== "set"}
                        onClick={() => {
                          setMode(m.id);
                          setQuantity("");
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <label htmlFor="adjust-amount">
                    {mode === "set"
                      ? "Cantidad total ahora"
                      : mode === "add"
                        ? "Cantidad que llegó"
                        : "Cantidad que se usó"}
                    {selected.unit ? ` (${selected.unit})` : ""}
                  </label>
                  <input
                    className="kitchen-input"
                    id="adjust-amount"
                    inputMode="decimal"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <p className="kitchen-result">
                    Total después del cambio:{" "}
                    <strong>
                      {formatAmount(
                        previewCount(selected.quantity, mode, quantity),
                      )}{" "}
                      {selected.unit ?? ""}
                    </strong>
                  </p>
                  <label htmlFor="adjust-reason">Nota (opcional)</label>
                  <input
                    id="adjust-reason"
                    className="kitchen-input"
                    value={reason}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Llegó pedido"
                  />
                  <button
                    className="stock-button kitchen-save"
                    disabled={
                      load !== "ready" ||
                      parseQuantity(quantity) === null ||
                      previewCount(selected.quantity, mode, quantity) === null
                    }
                  >
                    {busy ? "Guardando…" : "Guardar conteo"}
                  </button>
                </fieldset>
              </form>
            )}
            {panel.kind === "history" && selected && (
              <>
                <p className="kitchen-current">
                  {selected.name} · {countLabel(selected)}
                </p>
                {historyBusy && !history && (
                  <p role="status">Cargando historial…</p>
                )}
                {!historyBusy && !history && (
                  <button
                    className="stock-button stock-button--outline"
                    onClick={() => void historyPage(selected.id)}
                  >
                    Reintentar
                  </button>
                )}
                {history && (
                  <>
                    {history.entries.length === 0 ? (
                      <p>No hay cambios registrados.</p>
                    ) : (
                      <ol className="kitchen-history-list">
                        {history.entries.map((h) => (
                          <li key={h.id}>
                            <strong>
                              {formatAmount(h.before)} → {formatAmount(h.after)}{" "}
                              {selected.unit ?? ""}
                            </strong>
                            <p>
                              {formatMoment(h.created_at)} · {h.actor}
                            </p>
                            {h.reason && <p>{h.reason}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                    {history.has_more && history.next_before_revision && (
                      <button
                        className="stock-button stock-button--outline"
                        disabled={historyBusy}
                        onClick={() =>
                          void historyPage(
                            selected.id,
                            history.next_before_revision!,
                          )
                        }
                      >
                        {historyBusy ? "Cargando…" : "Ver cambios anteriores"}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            {panel.kind === "share" && (
              <>
                <p className="kitchen-help">
                  Revisa el inventario guardado completo. Después elige un chat
                  en WhatsApp o copia el mensaje.
                </p>
                {shareBusy ? (
                  <p role="status">Actualizando inventario guardado…</p>
                ) : share ? (
                  <>
                    <pre
                      className="kitchen-share-preview"
                      tabIndex={0}
                      aria-label="Mensaje de inventario"
                    >
                      {shareText}
                    </pre>
                    <div className="kitchen-share-actions">
                      <button
                        className="stock-button"
                        disabled={!share.items.some((x) => x.quantity !== null)}
                        onClick={() => void copy()}
                      >
                        Copiar mensaje
                      </button>
                      {share.items.some((x) => x.quantity !== null) && (
                        <a
                          className="stock-button stock-button--outline"
                          href={whatsappUrl(shareText)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir WhatsApp
                        </a>
                      )}
                    </div>
                    {copied && (
                      <p role="status" className="kitchen-notice">
                        Mensaje copiado.
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    className="stock-button stock-button--outline"
                    onClick={() => void refreshShare()}
                  >
                    Volver a intentar
                  </button>
                )}
              </>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
