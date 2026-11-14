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
  salonAPI,
  SalonRequestError,
  requestMessage,
  type SalonAPI,
} from "../../../../src/salon-stock/client";
import {
  LOCATIONS,
  type Location,
  type WithdrawalLocation,
  type SalonItem,
  type Snapshot,
  type ItemHistoryPage,
  type WithdrawalPage,
} from "../../../../src/salon-stock/types";
import {
  countLabel,
  formatAmount,
  formatObservation,
  formatShare,
  locationLabel,
  normalizeName,
  parseQuantity,
  prepareWithdrawal,
  previewCount,
} from "../../../../src/salon-stock/model";
import {
  clearPending,
  readPending,
  recoveryDecision,
  writePending,
  type PendingMutation,
} from "../../../../src/salon-stock/pending";
import {
  CreateEditor,
  CountEditor,
  WithdrawalEditor,
  MovementList,
  SharePanel,
  SourceNotes,
  type CreateDraft,
  type CountDraft,
  type WithdrawalDraft,
} from "./SalonEditors";
export type SalonPanel =
  | { kind: "create"; draft: CreateDraft }
  | { kind: "adjust"; id: string; draft: CountDraft }
  | { kind: "withdrawal"; draft: WithdrawalDraft }
  | { kind: "history"; id: string }
  | { kind: "withdrawals" }
  | { kind: "share" };
const STORAGE_KEY = (uid: string) => `deriva:salon-stock:pending:${uid}`;
export function SalonWorkspace({
  accountId = "",
  accountEmail = "",
  api = salonAPI,
  initialSnapshot = null,
  initialLocation = "storage",
  initialPanel = null,
  onBlockingChange,
  onReauthenticate,
}: {
  accountId?: string;
  accountEmail?: string;
  api?: SalonAPI;
  initialSnapshot?: Snapshot | null;
  initialLocation?: Location;
  initialPanel?: SalonPanel | null;
  onBlockingChange?: (blocked: boolean) => void;
  onReauthenticate?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initialSnapshot),
    [load, setLoad] = useState<"loading" | "ready" | "error">(
      initialSnapshot ? "ready" : "loading",
    ),
    [loadError, setLoadError] = useState(""),
    [location, setLocation] = useState<Location>(initialLocation),
    [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [panel, setPanel] = useState<SalonPanel | null>(initialPanel),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<PendingMutation | null>(null),
    [fieldError, setFieldError] = useState(""),
    [notice, setNotice] = useState(""),
    [reauthNeeded, setReauthNeeded] = useState(false),
    [recoveryIssue, setRecoveryIssue] = useState(""),
    [conflictItem, setConflictItem] = useState<SalonItem | null>(null);
  const [itemHistory, setItemHistory] = useState<ItemHistoryPage | null>(null),
    [withdrawals, setWithdrawals] = useState<WithdrawalPage | null>(null),
    [historyBusy, setHistoryBusy] = useState(false),
    [historyLocation, setHistoryLocation] = useState<
      WithdrawalLocation | "all"
    >("all"),
    [historyTaker, setHistoryTaker] = useState(""),
    [share, setShare] = useState<Snapshot | null>(null),
    [shareBusy, setShareBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const mounted = useRef(true),
    generation = useRef(0),
    busyRef = useRef(false),
    pendingRef = useRef<PendingMutation | null>(null),
    panelRef = useRef<HTMLElement | null>(null),
    returnFocus = useRef<HTMLElement | null>(null);
  const items = snapshot?.items ?? [];
  const selected =
    panel && "id" in panel ? items.find((i) => i.id === panel.id) : undefined;
  const scoped = useMemo(
    () => items.filter((i) => i.location === location),
    [items, location],
  );
  const visible = useMemo(
    () =>
      scoped.filter(
        (i) =>
          (category === "all" || i.category === category) &&
          normalizeName(i.name).includes(normalizeName(query)),
      ),
    [scoped, category, query],
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Map(scoped.map((i) => [i.category, i.category_label])).entries(),
      ),
    [scoped],
  );
  const locked = busy || pending !== null || !!recoveryIssue;
  const readOnly = load !== "ready" || locked;
  const refresh = useCallback(async () => {
    const run = ++generation.current;
    try {
      const next = await api.list();
      if (!mounted.current || run !== generation.current) return;
      setSnapshot(next);
      setLoad("ready");
      setLoadError("");
    } catch (error) {
      if (!mounted.current || run !== generation.current) return;
      if (
        error instanceof SalonRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        setSnapshot(null);
        setReauthNeeded(true);
      }
      setLoad("error");
      setLoadError(requestMessage(error));
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
    let saved: PendingMutation | null = null;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY(accountId));
      saved = readPending(sessionStorage, accountId);
    } catch {
      /* Writes will be refused if safe persistence is unavailable. */
    }
    if (!saved) {
      if (raw)
        setRecoveryIssue(
          "Hay un registro local pendiente que no pudimos validar. No lo reintentaremos ni crearemos otra operación. Pide a un encargado que lo revise.",
        );
      return;
    }
    pendingRef.current = saved;
    setPending(saved);
    if (saved.kind === "create") {
      setLocation(saved.payload.location);
      setPanel({
        kind: "create",
        draft: {
          name: saved.payload.name,
          location: saved.payload.location,
          category: saved.payload.category,
          categoryLabel: saved.payload.category_label,
          unit: saved.payload.unit ?? "",
          packageNote: saved.payload.package_note,
          quantity: saved.payload.quantity ?? "",
        },
      });
    } else if (saved.kind === "adjust") {
      setPanel({
        kind: "adjust",
        id: saved.id,
        draft: {
          mode: saved.payload.mode,
          amount: saved.payload.amount,
          reason: saved.payload.reason,
        },
      });
    } else {
      setLocation(saved.payload.location);
      setPanel({
        kind: "withdrawal",
        draft: {
          location: saved.payload.location,
          itemId: saved.payload.item_id,
          query: "",
          taker: saved.payload.taker,
          amount: saved.payload.amount,
          reason: saved.payload.reason,
        },
      });
    }
    setFieldError(
      "Hay un cambio sin confirmar de esta cuenta. Reintenta exactamente la misma operación.",
    );
  }, [accountId]);
  useEffect(() => {
    const unresolved = pending !== null || busy;
    onBlockingChange?.(unresolved || panel !== null);
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    if (unresolved) window.addEventListener("beforeunload", leave);
    return () => {
      window.removeEventListener("beforeunload", leave);
      onBlockingChange?.(false);
    };
  }, [pending, busy, panel, onBlockingChange]);
  useEffect(() => {
    if (panel) panelRef.current?.querySelector<HTMLElement>("h2")?.focus();
    else returnFocus.current?.focus();
  }, [panel?.kind]);
  function open(next: SalonPanel) {
    if (locked) return;
    if (!panel) returnFocus.current = document.activeElement as HTMLElement;
    generation.current++;
    setFieldError("");
    setConflictItem(null);
    setNotice("");
    setReauthNeeded(false);
    setPanel(next);
  }
  function close() {
    if (busyRef.current || pendingRef.current) return;
    generation.current++;
    setPanel(null);
    setFieldError("");
    setConflictItem(null);
  }
  function chooseLocation(next: Location) {
    if (locked) return;
    setLocation(next);
    setCategory("all");
    setQuery("");
  }
  function locationKeys(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % LOCATIONS.length;
    else if (event.key === "ArrowLeft")
      next = (index + LOCATIONS.length - 1) % LOCATIONS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = LOCATIONS.length - 1;
    else return;
    event.preventDefault();
    chooseLocation(LOCATIONS[next].id);
    document.getElementById(`salon-tab-${LOCATIONS[next].id}`)?.focus();
  }
  function openCount(item: SalonItem) {
    open({
      kind: "adjust",
      id: item.id,
      draft: {
        mode:
          item.location === "fridge" || item.quantity === null ? "set" : "add",
        amount: "",
        reason: "",
      },
    });
  }
  function openCreate() {
    const id = category === "all" ? "otros" : category;
    open({
      kind: "create",
      draft: {
        location,
        name: "",
        category: id,
        categoryLabel: categories.find((c) => c[0] === id)?.[1] ?? "Otros",
        unit: "",
        packageNote: "",
        quantity: "",
      },
    });
  }
  function openWithdrawal() {
    if (location === "fridge") return;
    open({
      kind: "withdrawal",
      draft: {
        location,
        itemId: "",
        query: "",
        taker: "",
        amount: "",
        reason: "",
      },
    });
  }
  function install(item: SalonItem) {
    setSnapshot((s) =>
      s
        ? {
            ...s,
            items: s.items.some((i) => i.id === item.id)
              ? s.items.map((i) => (i.id === item.id ? item : i))
              : [...s.items, item],
          }
        : s,
    );
  }
  function clearConfirmed() {
    if (accountId)
      try {
        clearPending(sessionStorage, accountId);
      } catch {
        /* Replaying a confirmed operation remains idempotent. */
      }
    pendingRef.current = null;
    setPending(null);
  }
  async function mutate(change: PendingMutation) {
    if (busyRef.current || recoveryIssue) return;
    const previouslyUnconfirmed = pendingRef.current !== null;
    if (accountId)
      try {
        writePending(sessionStorage, accountId, change);
      } catch {
        setFieldError(
          "No pudimos conservar esta operación para reintentos. Habilita el almacenamiento de la pestaña antes de guardar.",
        );
        return;
      }
    generation.current++;
    pendingRef.current = change;
    setPending(change);
    busyRef.current = true;
    setBusy(true);
    setFieldError("");
    setReauthNeeded(false);
    try {
      const result =
        change.kind === "create"
          ? await api.create(change.payload)
          : change.kind === "adjust"
            ? await api.adjust(change.id, change.payload)
            : await api.withdraw(change.payload);
      if (!mounted.current) return;
      try {
        const latest = await api.list();
        if (!mounted.current) return;
        setSnapshot(latest);
        setLoad("ready");
        setLoadError("");
      } catch (error) {
        if (!mounted.current) return;
        if (
          error instanceof SalonRequestError &&
          (error.status === 401 || error.status === 403)
        ) {
          setSnapshot(null);
          setReauthNeeded(true);
        } else install(result.item);
        setLoad("error");
        setLoadError(
          "La operación quedó registrada, pero no pudimos actualizar el saldo. Actualiza el inventario antes de seguir.",
        );
      }
      clearConfirmed();
      setPanel(null);
      setNotice(
        change.kind === "withdrawal"
          ? `Retiro registrado: ${change.payload.taker} · ${result.item.name}.`
          : `${result.item.name}: cambio guardado.`,
      );
    } catch (error) {
      if (!mounted.current) return;
      const recovery = recoveryDecision(
        previouslyUnconfirmed,
        error instanceof SalonRequestError
          ? {
              status: error.status,
              code: error.code,
              ambiguous: error.ambiguous,
              validItem: error.item !== null,
            }
          : { status: null, ambiguous: true },
      );
      setReauthNeeded(recovery.reauthenticate);
      if (!recovery.keepRequest) {
        clearConfirmed();
        if (error instanceof SalonRequestError && error.item) {
          install(error.item);
          setConflictItem(error.item);
        }
      }
      setFieldError(requestMessage(error));
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function submitCreate(event: FormEvent) {
    event.preventDefault();
    if (panel?.kind !== "create" || readOnly) return;
    const draft = panel.draft;
    if (!draft.name.trim()) {
      setFieldError("Escribe el nombre del artículo.");
      return;
    }
    const existing = items.find(
      (i) =>
        i.location === draft.location &&
        normalizeName(i.name) === normalizeName(draft.name),
    );
    if (existing) {
      setConflictItem(existing);
      setFieldError("Ya existe en esta ubicación. Usa el registro existente.");
      return;
    }
    const amount = draft.quantity.trim() ? parseQuantity(draft.quantity) : null;
    if (draft.quantity.trim() && amount === null) {
      setFieldError("Usa una cantidad desde cero con hasta tres decimales.");
      return;
    }
    void mutate({
      kind: "create",
      payload: {
        name: draft.name.trim(),
        location: draft.location,
        category: draft.category.trim() || "otros",
        category_label: draft.categoryLabel.trim() || "Otros",
        unit: draft.unit.trim() || null,
        package_note: draft.packageNote.trim(),
        quantity: amount,
        request_id: crypto.randomUUID(),
      },
    });
  }
  function submitCount(event: FormEvent) {
    event.preventDefault();
    if (panel?.kind !== "adjust" || !selected || readOnly) return;
    const draft = panel.draft,
      amount = parseQuantity(draft.amount);
    if (
      amount === null ||
      previewCount(selected.quantity, draft.mode, amount) === null ||
      (selected.location !== "fridge" && draft.mode === "subtract")
    ) {
      setFieldError(
        "Revisa la cantidad y la operación. El saldo no puede quedar bajo cero.",
      );
      return;
    }
    if (
      selected.location !== "fridge" &&
      draft.mode === "set" &&
      !draft.reason.trim()
    ) {
      setFieldError("Escribe el motivo de la corrección de conteo.");
      return;
    }
    void mutate({
      kind: "adjust",
      id: selected.id,
      payload: {
        mode: draft.mode,
        amount,
        reason: draft.reason.trim(),
        expected_revision: selected.revision,
        request_id: crypto.randomUUID(),
      },
    });
  }
  function submitWithdrawal(event: FormEvent) {
    event.preventDefault();
    if (panel?.kind !== "withdrawal" || !snapshot || readOnly) return;
    const draft = panel.draft;
    const checked = prepareWithdrawal({
      items,
      location: draft.location,
      itemId: draft.itemId,
      taker: draft.taker,
      amount: draft.amount,
      takers: snapshot.withdrawal_takers,
    });
    if (!checked) {
      setFieldError(
        "Selecciona ubicación, persona y un artículo existente; usa una cantidad positiva que alcance con el saldo guardado.",
      );
      return;
    }
    void mutate({
      kind: "withdrawal",
      payload: {
        location: draft.location,
        item_id: checked.item.id,
        taker: draft.taker,
        amount: checked.amount,
        expected_revision: checked.item.revision,
        request_id: crypto.randomUUID(),
        reason: draft.reason.trim(),
      },
    });
  }
  async function loadHistory(id: string, before?: number) {
    const run = ++generation.current;
    setHistoryBusy(true);
    setFieldError("");
    try {
      const page = await api.history(id, before);
      if (!mounted.current || run !== generation.current) return;
      setItemHistory((old) =>
        before && old
          ? { ...page, entries: [...old.entries, ...page.entries] }
          : page,
      );
    } catch (error) {
      if (mounted.current && run === generation.current)
        setFieldError(requestMessage(error));
    } finally {
      if (mounted.current && run === generation.current) setHistoryBusy(false);
    }
  }
  function openHistory(item: SalonItem) {
    open({ kind: "history", id: item.id });
    setItemHistory(null);
    void loadHistory(item.id);
  }
  async function loadWithdrawals(
    nextLocation: WithdrawalLocation | "all" = historyLocation,
    nextTaker = historyTaker,
    before?: number,
  ) {
    const run = ++generation.current;
    setHistoryBusy(true);
    setFieldError("");
    if (!before) setWithdrawals(null);
    try {
      const page = await api.withdrawals({
        location: nextLocation === "all" ? undefined : nextLocation,
        taker: nextTaker || undefined,
        before,
      });
      if (!mounted.current || run !== generation.current) return;
      setWithdrawals((old) =>
        before && old
          ? { ...page, entries: [...old.entries, ...page.entries] }
          : page,
      );
    } catch (error) {
      if (mounted.current && run === generation.current)
        setFieldError(requestMessage(error));
    } finally {
      if (mounted.current && run === generation.current) setHistoryBusy(false);
    }
  }
  function openWithdrawals() {
    open({ kind: "withdrawals" });
    setHistoryLocation("all");
    setHistoryTaker("");
    void loadWithdrawals("all", "");
  }
  async function refreshShare() {
    const run = ++generation.current;
    setShare(null);
    setShareBusy(true);
    setCopied(false);
    setFieldError("");
    try {
      const next = await api.list();
      if (!mounted.current || run !== generation.current) return;
      setShare(next);
      setSnapshot(next);
      setLoad("ready");
      setLoadError("");
    } catch (error) {
      if (mounted.current && run === generation.current)
        setFieldError(requestMessage(error));
    } finally {
      if (mounted.current && run === generation.current) setShareBusy(false);
    }
  }
  function openShare() {
    open({ kind: "share" });
    void refreshShare();
  }
  async function copyShare() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(formatShare(share));
      setCopied(true);
    } catch {
      setFieldError(
        "No pudimos copiar el mensaje. Selecciónalo y cópialo manualmente.",
      );
    }
  }
  function dialogKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
    if (event.key === "Tab") {
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement?.id === "salon-dialog-title")
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  const observationSummary = new Set(
    scoped.map((i) => formatObservation(i.observation)),
  );
  const title =
    panel?.kind === "create"
      ? "Añadir artículo"
      : panel?.kind === "withdrawal"
        ? "Registrar retiro"
        : panel?.kind === "history"
          ? "Historial del artículo"
          : panel?.kind === "withdrawals"
            ? "Retiros registrados"
            : panel?.kind === "share"
              ? "Compartir stock"
              : (selected?.name ?? "Conteo de stock");
  return (
    <>
      <main className="salon-main" inert={panel !== null}>
        <div className="salon-heading">
          <div>
            <p className="salon-kicker">Inventario</p>
            <h1>Stock Salón</h1>
            <p>Refrigerador, bodega y artículos de limpieza.</p>
          </div>
          {accountEmail && (
            <small className="salon-account">{accountEmail}</small>
          )}
        </div>
        <div className="salon-actions">
          {location !== "fridge" && (
            <button
              id="salon-withdraw-trigger"
              className="stock-button"
              disabled={!snapshot || readOnly}
              onClick={openWithdrawal}
            >
              Registrar retiro
            </button>
          )}
          <button
            className="stock-button stock-button--outline"
            disabled={!snapshot || readOnly}
            onClick={openCreate}
          >
            Añadir artículo
          </button>
          <button
            className="stock-button stock-button--outline"
            disabled={!snapshot || readOnly}
            onClick={openShare}
          >
            Compartir stock
          </button>
          <button
            className="stock-button stock-button--outline"
            disabled={!snapshot || locked}
            onClick={openWithdrawals}
          >
            Retiros
          </button>
        </div>
        <div
          className="salon-tabs"
          role="tablist"
          aria-label="Ubicación del inventario"
        >
          {LOCATIONS.map((loc, index) => (
            <button
              id={`salon-tab-${loc.id}`}
              key={loc.id}
              role="tab"
              aria-selected={location === loc.id}
              aria-controls="salon-location-panel"
              tabIndex={location === loc.id ? 0 : -1}
              onKeyDown={(event) => locationKeys(event, index)}
              onClick={() => chooseLocation(loc.id)}
            >
              {loc.label}
              <span>{items.filter((i) => i.location === loc.id).length}</span>
            </button>
          ))}
        </div>
        {notice && (
          <p className="salon-success" role="status">
            {notice}
          </p>
        )}
        {loadError && (
          <div className="salon-alert" role="alert">
            <strong>
              {snapshot
                ? "El inventario está sin actualizar. No se puede guardar."
                : "No pudimos cargar el inventario."}
            </strong>
            <p>{loadError}</p>
            <button
              className="stock-button stock-button--outline"
              onClick={() => void refresh()}
            >
              Volver a intentar
            </button>
            {reauthNeeded && onReauthenticate && (
              <button className="stock-text-button" onClick={onReauthenticate}>
                Volver a iniciar sesión
              </button>
            )}
          </div>
        )}
        {recoveryIssue && (
          <div className="salon-alert" role="alert">
            <strong>Operación pendiente por revisar</strong>
            <p>{recoveryIssue}</p>
            {onReauthenticate && (
              <button className="stock-text-button" onClick={onReauthenticate}>
                Cambiar de cuenta
              </button>
            )}
          </div>
        )}
        <section
          id="salon-location-panel"
          role="tabpanel"
          aria-labelledby={`salon-tab-${location}`}
        >
          {load === "loading" && <p role="status">Cargando inventario…</p>}
          {snapshot && (
            <>
              <div className="salon-location-meta">
                <strong>
                  {locationLabel(location)} · {scoped.length} artículos
                </strong>
                <p>
                  Conteo físico:{" "}
                  {observationSummary.size === 1
                    ? formatObservation(scoped[0].observation)
                    : scoped.length
                      ? "distintas fechas, indicadas por artículo"
                      : "sin registros"}
                </p>
                {location === "fridge" ? (
                  <p>No se registran retiros desde Refrigerador.</p>
                ) : null}
              </div>
              <div className="salon-filters">
                <label htmlFor="salon-search">
                  Buscar en esta ubicación
                  <input
                    id="salon-search"
                    className="salon-input"
                    type="search"
                    value={query}
                    placeholder="Nombre del artículo…"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label htmlFor="salon-filter-category">
                  Categoría
                  <select
                    id="salon-filter-category"
                    className="salon-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Todas</option>
                    {categories.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {visible.length === 0 ? (
                <div className="salon-empty">
                  <h2>
                    {scoped.length
                      ? "No hay coincidencias"
                      : "Aún no hay artículos"}
                  </h2>
                  <p>
                    {scoped.length
                      ? "Prueba otro nombre o categoría."
                      : "Añade un artículo para comenzar."}
                  </p>
                  {scoped.length > 0 && (
                    <button
                      className="stock-text-button"
                      onClick={() => {
                        setQuery("");
                        setCategory("all");
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                categories.map(([id, label]) => {
                  const group = visible.filter((i) => i.category === id);
                  return group.length ? (
                    <section
                      className="salon-group"
                      key={id}
                      aria-labelledby={`salon-group-${id}`}
                    >
                      <h2 id={`salon-group-${id}`}>
                        {label}
                        <span>{group.length}</span>
                      </h2>
                      {group.map((item) => (
                        <article className="salon-row" key={item.id}>
                          <div className="salon-row-copy">
                            <h3>{item.name}</h3>
                            <SourceNotes item={item} />
                            {observationSummary.size > 1 && (
                              <small>
                                Conteo físico:{" "}
                                {formatObservation(item.observation)}
                              </small>
                            )}
                          </div>
                          <div
                            className={`salon-row-quantity${item.quantity === "0" ? " is-zero" : ""}`}
                          >
                            <strong>{formatAmount(item.quantity)}</strong>
                            {item.unit && <small>{item.unit}</small>}
                          </div>
                          <button
                            className="stock-text-button salon-count-action"
                            disabled={readOnly}
                            onClick={() => openCount(item)}
                            aria-label={`Conteo de ${item.name}`}
                          >
                            Conteo
                          </button>
                        </article>
                      ))}
                    </section>
                  ) : null;
                })
              )}
              <p className="salon-help">
                Las cantidades sin unidad conservan la base del conteo original.
              </p>
            </>
          )}
        </section>
      </main>
      {panel && (
        <>
          <div className="salon-backdrop" aria-hidden="true" />
          <section
            ref={panelRef}
            className={`salon-dialog${panel.kind === "withdrawal" ? " salon-dialog--withdrawal" : ""}${panel.kind === "share" || panel.kind === "withdrawals" ? " salon-dialog--wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="salon-dialog-title"
            onKeyDown={dialogKeys}
          >
            <header className="salon-dialog-head">
              <div>
                <p className="salon-kicker">Stock Salón</p>
                <h2 id="salon-dialog-title" tabIndex={-1}>
                  {title}
                </h2>
              </div>
              <button
                className="stock-icon-button"
                disabled={busy || pending !== null}
                aria-label="Cerrar"
                onClick={close}
              >
                ×
              </button>
            </header>
            {fieldError && (
              <div className="salon-alert" role="alert">
                <p>{fieldError}</p>
                {conflictItem && panel.kind === "create" && (
                  <button
                    className="stock-text-button"
                    onClick={() => openCount(conflictItem)}
                  >
                    Usar {conflictItem.name}
                  </button>
                )}
                {conflictItem && panel.kind !== "create" && (
                  <p>
                    Saldo actualizado:{" "}
                    <strong>{countLabel(conflictItem)}</strong>. Revisa la
                    cantidad antes de confirmar otra operación.
                  </p>
                )}
                {reauthNeeded && onReauthenticate && (
                  <button
                    className="stock-button stock-button--outline"
                    disabled={busy}
                    onClick={onReauthenticate}
                  >
                    Volver a iniciar sesión
                  </button>
                )}
              </div>
            )}
            {pending && (
              <div className="salon-alert" role="status">
                <strong>
                  {busy ? "Confirmando operación…" : "Operación sin confirmar"}
                </strong>
                <p>
                  Se conservan los mismos datos para evitar registrar el cambio
                  dos veces.
                </p>
                {pending.kind === "withdrawal" && (
                  <p>
                    {pending.payload.taker} ·{" "}
                    {locationLabel(pending.payload.location)} · cantidad{" "}
                    {formatAmount(pending.payload.amount)}
                  </p>
                )}
                <button
                  className="stock-button"
                  disabled={busy}
                  onClick={() => void mutate(pending)}
                >
                  {busy ? "Confirmando…" : "Reintentar la misma operación"}
                </button>
              </div>
            )}
            {panel.kind === "create" && (
              <CreateEditor
                draft={panel.draft}
                items={items}
                locked={readOnly}
                onExisting={openCount}
                onChange={(patch) =>
                  setPanel((p) =>
                    p?.kind === "create"
                      ? { ...p, draft: { ...p.draft, ...patch } }
                      : p,
                  )
                }
                onSubmit={submitCreate}
              />
            )}{" "}
            {panel.kind === "adjust" &&
              (selected ? (
                <CountEditor
                  item={selected}
                  draft={panel.draft}
                  locked={readOnly}
                  onChange={(patch) =>
                    setPanel((p) =>
                      p?.kind === "adjust"
                        ? { ...p, draft: { ...p.draft, ...patch } }
                        : p,
                    )
                  }
                  onSubmit={submitCount}
                  onHistory={() => openHistory(selected)}
                />
              ) : (
                !pending && (
                  <p role="status">
                    El artículo no está disponible. Actualiza el inventario.
                  </p>
                )
              ))}{" "}
            {panel.kind === "withdrawal" && snapshot && (
              <WithdrawalEditor
                draft={panel.draft}
                snapshot={snapshot}
                locked={readOnly}
                onChange={(patch) =>
                  setPanel((p) =>
                    p?.kind === "withdrawal"
                      ? { ...p, draft: { ...p.draft, ...patch } }
                      : p,
                  )
                }
                onSubmit={submitWithdrawal}
              />
            )}{" "}
            {panel.kind === "history" && selected && (
              <>
                <p className="salon-current">
                  {selected.name} · {locationLabel(selected.location)}
                </p>
                {historyBusy && !itemHistory ? (
                  <p role="status">Cargando historial…</p>
                ) : itemHistory ? (
                  <>
                    {itemHistory.entries.length ? (
                      <MovementList entries={itemHistory.entries} />
                    ) : (
                      <p>No hay movimientos registrados.</p>
                    )}
                    {itemHistory.has_more &&
                      itemHistory.next_before_revision && (
                        <button
                          className="stock-button stock-button--outline"
                          disabled={historyBusy}
                          onClick={() =>
                            void loadHistory(
                              selected.id,
                              itemHistory.next_before_revision!,
                            )
                          }
                        >
                          {historyBusy
                            ? "Cargando…"
                            : "Ver movimientos anteriores"}
                        </button>
                      )}
                  </>
                ) : (
                  <button
                    className="stock-button stock-button--outline"
                    onClick={() => void loadHistory(selected.id)}
                  >
                    Reintentar
                  </button>
                )}
              </>
            )}{" "}
            {panel.kind === "withdrawals" && (
              <>
                <div className="salon-history-filters">
                  <label htmlFor="withdraw-history-location">
                    Ubicación
                    <select
                      id="withdraw-history-location"
                      className="salon-input"
                      value={historyLocation}
                      onChange={(e) => {
                        const loc = e.target.value as
                          | WithdrawalLocation
                          | "all";
                        setHistoryLocation(loc);
                        void loadWithdrawals(loc, historyTaker);
                      }}
                    >
                      <option value="all">Todas</option>
                      <option value="storage">Bodega</option>
                      <option value="cleaning">Limpieza</option>
                    </select>
                  </label>
                  <label htmlFor="withdraw-history-taker">
                    Persona
                    <select
                      id="withdraw-history-taker"
                      className="salon-input"
                      value={historyTaker}
                      onChange={(e) => {
                        setHistoryTaker(e.target.value);
                        void loadWithdrawals(historyLocation, e.target.value);
                      }}
                    >
                      <option value="">Todas</option>
                      {snapshot?.withdrawal_takers.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {historyBusy && !withdrawals ? (
                  <p role="status">Cargando retiros…</p>
                ) : withdrawals ? (
                  <>
                    {withdrawals.entries.length ? (
                      <MovementList entries={withdrawals.entries} />
                    ) : (
                      <div className="salon-empty">
                        <h3>No hay retiros registrados</h3>
                        <p>Los retiros de Bodega y Limpieza aparecerán aquí.</p>
                      </div>
                    )}
                    {withdrawals.has_more &&
                      withdrawals.next_before_sequence && (
                        <button
                          className="stock-button stock-button--outline"
                          disabled={historyBusy}
                          onClick={() =>
                            void loadWithdrawals(
                              historyLocation,
                              historyTaker,
                              withdrawals.next_before_sequence!,
                            )
                          }
                        >
                          {historyBusy ? "Cargando…" : "Ver retiros anteriores"}
                        </button>
                      )}
                  </>
                ) : (
                  <button
                    className="stock-button stock-button--outline"
                    onClick={() => void loadWithdrawals()}
                  >
                    Reintentar
                  </button>
                )}
              </>
            )}{" "}
            {panel.kind === "share" && (
              <SharePanel
                snapshot={share}
                busy={shareBusy}
                error={!!fieldError}
                copied={copied}
                onRefresh={() => void refreshShare()}
                onCopy={() => void copyShare()}
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
