"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth
} from "firebase/auth";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseAuth } from "../../../../src/auth/firebase";
import {
  buildAdjustmentPayload,
  buildRawItemPayload,
  makeRequestId,
  parseStockConflict
} from "../../../../src/stock/contract";
import {
  adjustStockItem,
  createRawItem,
  getStockHistory,
  getStockSnapshot,
  StockRequestError
} from "../../../../src/stock/client";
import {
  countSummary,
  defaultEditMode,
  filterStockItems,
  formatCount,
  nextUncounted,
  parseAmount,
  payloadQuantity,
  previewAdjustment,
  unitShort,
  type EditMode,
  type KindFilter
} from "../../../../src/stock/editor";
import type {
  CreateRawItemPayload,
  StockAdjustmentPayload,
  StockItem,
  StockSnapshot
} from "../../../../src/stock/types";
import { formatClock, formatHeaderDate, formatUpdated } from "./format";
import {
  AdjustEditor,
  CreateRawEditor,
  type AdjustPanel,
  type CreatePanel,
  type HistoryState,
  type Panel,
  type PendingView
} from "./StockEditor";

type AuthStatus = "loading" | "signed-out" | "signed-in" | "error";
type LoadState = "idle" | "loading" | "ready" | "error" | "forbidden";

type PendingMutation =
  | { type: "adjust"; itemId: string; payload: StockAdjustmentPayload; view: PendingView; chain: boolean }
  | { type: "raw"; payload: CreateRawItemPayload };

/** An adjustment the server definitely rejected with 401; offered back to the same account. */
type LostDraft = { uid: string; itemId: string; itemName: string; mode: EditMode; amount: string; reason: string };

const KIND_FILTERS: Array<{ value: KindFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "menu_item", label: "Carta" },
  { value: "raw_item", label: "Insumos" }
];

const MODE_VERB: Record<EditMode, string> = { set: "fijar total", add: "sumar", subtract: "restar" };
const SESSION_EXPIRED = "Tu sesión expiró. Vuelve a entrar para continuar.";
const DESKTOP_QUERY = "(min-width: 1024px)";

function describeLoginError(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "El correo o la contraseña no coinciden.";
  }
  if (code === "auth/invalid-email") return "Ingresa un correo válido.";
  if (code === "auth/too-many-requests") return "Hay muchos intentos. Espera unos minutos.";
  if (code === "auth/network-request-failed") return "Sin conexión. Revisa la red e inténtalo de nuevo.";
  return "No pudimos abrir la sesión. Inténtalo de nuevo.";
}

function describeRequestError(error: unknown): string {
  if (error instanceof StockRequestError) {
    const knownCopy: Record<string, string> = {
      invalid_quantity: "El conteo no puede quedar bajo 0 ni tener decimales. Revisa la cantidad.",
      invalid_unit: "La unidad elegida no está disponible.",
      invalid_request: "Revisa los datos e inténtalo de nuevo.",
      stock_item_not_found: "No encontramos ese artículo. Actualiza la lista.",
      raw_item_exists: "Ya existe un insumo con ese nombre. Búscalo en la lista."
    };
    if (error.code && knownCopy[error.code]) return knownCopy[error.code];
    if (error.status === 400) return "Revisa los datos e inténtalo de nuevo.";
    if (error.status === 403) return "Tu cuenta no tiene permiso para esta acción.";
    if (error.status === 404) return "No encontramos ese artículo. Actualiza la lista.";
    if (error.status === 401) return SESSION_EXPIRED;
    if (error.ambiguous) return "El stock no respondió. Puedes reintentar.";
    return error.message;
  }
  return "Ocurrió un problema. Inténtalo de nuevo.";
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

function countButtonId(itemId: string): string {
  return `stock-count-${itemId}`;
}

export function StockApp() {
  const authRef = useRef<Auth | null>(null);
  const sessionGenerationRef = useRef(0);
  const sessionUidRef = useRef<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<string | null>(null);
  const isDesktop = useIsDesktop();

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadError, setLoadError] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [staleSnapshot, setStaleSnapshot] = useState(false);

  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [uncountedOnly, setUncountedOnly] = useState(false);

  const [panel, setPanel] = useState<Panel | null>(null);
  const [pending, setPending] = useState<PendingMutation | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [lastSaved, setLastSaved] = useState<{ id: string; text: string } | null>(null);
  const [historyById, setHistoryById] = useState<Record<string, HistoryState>>({});
  const [lostDraft, setLostDraft] = useState<LostDraft | null>(null);
  // Set after mount: Cache Components forbids reading the clock during prerender.
  const [now, setNow] = useState<Date | null>(null);

  // Mirrors for async callbacks, so they never run side effects inside state updaters.
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const panelStateRef = useRef(panel);
  panelStateRef.current = panel;

  const isCurrentSession = useCallback(
    (generation: number, uid: string | null) =>
      generation === sessionGenerationRef.current && uid === sessionUidRef.current,
    []
  );

  const clearWorkspace = useCallback(() => {
    setSnapshot(null);
    setLoadState("idle");
    setLoadError("");
    setLoadedAt(null);
    setStaleSnapshot(false);
    setPanel(null);
    setPending(null);
    setBusy(false);
    setToast("");
    setLastSaved(null);
    setHistoryById({});
  }, []);

  const signOutAndClear = useCallback(
    async (message?: string) => {
      sessionGenerationRef.current += 1;
      sessionUidRef.current = null;
      try {
        await firebaseSignOut(authRef.current ?? getFirebaseAuth());
      } catch {
        // The local UI is still purged if Firebase already lost the session.
      }
      clearWorkspace();
      setAuthStatus("signed-out");
      if (message) setAuthError(message);
    },
    [clearWorkspace]
  );

  /** Background loads keep the current list on screen instead of flashing the skeleton. */
  const loadSnapshot = useCallback(
    async (options: { background?: boolean } = {}) => {
      const generation = sessionGenerationRef.current;
      const uid = sessionUidRef.current;
      if (!options.background) setLoadState((state) => (state === "ready" ? state : "loading"));
      try {
        const next = await getStockSnapshot();
        if (!isCurrentSession(generation, uid)) return;
        setSnapshot(next);
        setLoadState("ready");
        setLoadError("");
        setLoadedAt(new Date());
        setStaleSnapshot(false);
      } catch (error) {
        if (!isCurrentSession(generation, uid)) return;
        if (error instanceof StockRequestError && error.status === 401) {
          await signOutAndClear(SESSION_EXPIRED);
          return;
        }
        if (error instanceof StockRequestError && error.status === 403) {
          setSnapshot(null);
          setLoadState("forbidden");
          return;
        }
        setLoadError(describeRequestError(error));
        // With a previous read, keep it visible but read-only.
        if (snapshotRef.current) setStaleSnapshot(true);
        else setLoadState("error");
      }
    },
    [isCurrentSession, signOutAndClear]
  );

  useEffect(() => {
    let mounted = true;
    try {
      const auth = getFirebaseAuth();
      authRef.current = auth;
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        sessionGenerationRef.current += 1;
        sessionUidRef.current = user?.uid ?? null;
        clearWorkspace();
        if (user) {
          setAuthStatus("signed-in");
          setAuthError("");
          setAccountEmail(user.email ?? "");
          setLostDraft((draft) => (draft && draft.uid === user.uid ? draft : null));
          void loadSnapshot();
        } else {
          setAuthStatus("signed-out");
        }
      });
      return () => {
        mounted = false;
        unsubscribe();
      };
    } catch {
      setAuthStatus("error");
      setAuthError("Firebase no está configurado en este entorno.");
      return () => {
        mounted = false;
      };
    }
  }, [clearWorkspace, loadSnapshot]);

  // Keeps "actualizado 08:12" / "ayer" honest across a long shift.
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const items = useMemo(() => snapshot?.items ?? [], [snapshot]);
  const summary = useMemo(() => countSummary(items), [items]);
  const visibleItems = useMemo(
    () => filterStockItems(items, { kind: kindFilter, search, uncountedOnly }),
    [items, kindFilter, search, uncountedOnly]
  );
  const visibilityEnabled = snapshot?.stock_visibility_enabled ?? false;
  const readOnly = staleSnapshot;
  const panelItem = panel?.type === "adjust" ? items.find((item) => item.id === panel.itemId) ?? null : null;
  const pendingAdjust = pending?.type === "adjust" ? pending : null;

  const focusPanelTitle = useCallback(() => {
    window.requestAnimationFrame(() => {
      const root = panelRef.current;
      if (!root) return;
      const amount = root.querySelector<HTMLInputElement>('input[inputmode="numeric"]:not(:disabled)');
      // On phones the keyboard would cover the sheet's actions, so start on the title.
      if (window.matchMedia(DESKTOP_QUERY).matches && amount) amount.focus();
      else root.querySelector<HTMLElement>("h2")?.focus();
    });
  }, []);

  const closePanel = useCallback(() => {
    if (busy) return;
    setPanel(null);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target) window.requestAnimationFrame(() => document.getElementById(target)?.focus());
  }, [busy]);

  const openAdjust = useCallback(
    (item: StockItem, draft?: Partial<AdjustPanel>) => {
      returnFocusRef.current = countButtonId(item.id);
      setPanel({
        type: "adjust",
        itemId: item.id,
        mode: defaultEditMode(),
        amount: "",
        reason: "",
        view: "edit",
        notice: null,
        ...draft
      });
      focusPanelTitle();
    },
    [focusPanelTitle]
  );

  const updateItem = useCallback((item: StockItem) => {
    setSnapshot((current) => {
      if (!current) return current;
      const exists = current.items.some((entry) => entry.id === item.id);
      return {
        ...current,
        items: exists
          ? current.items.map((entry) => (entry.id === item.id ? item : entry))
          : [...current.items, item]
      };
    });
  }, []);

  const loadHistory = useCallback(
    async (itemId: string, force = false) => {
      const existing = historyById[itemId];
      if (!force && (existing?.status === "ready" || existing?.status === "loading")) return;
      setHistoryById((current) => ({ ...current, [itemId]: { status: "loading" } }));
      const generation = sessionGenerationRef.current;
      const uid = sessionUidRef.current;
      try {
        const entries = await getStockHistory(itemId);
        if (!isCurrentSession(generation, uid)) return;
        setHistoryById((current) => ({ ...current, [itemId]: { status: "ready", entries } }));
      } catch (error) {
        if (!isCurrentSession(generation, uid)) return;
        if (error instanceof StockRequestError && error.status === 401) {
          await signOutAndClear(SESSION_EXPIRED);
          return;
        }
        setHistoryById((current) => ({
          ...current,
          [itemId]: {
            status: "error",
            message:
              error instanceof StockRequestError && error.status === 403
                ? "No tienes permiso para ver este historial."
                : describeRequestError(error)
          }
        }));
      }
    },
    [historyById, isCurrentSession, signOutAndClear]
  );

  const commitMutation = useCallback(
    async (mutation: PendingMutation) => {
      const generation = sessionGenerationRef.current;
      const uid = sessionUidRef.current;
      setBusy(true);
      try {
        const item =
          mutation.type === "adjust"
            ? await adjustStockItem(mutation.itemId, mutation.payload)
            : await createRawItem(mutation.payload);
        if (!isCurrentSession(generation, uid)) return;
        updateItem(item);
        setPending(null);
        setBusy(false);
        setHistoryById((current) => {
          const next = { ...current };
          delete next[item.id];
          return next;
        });
        const time = formatClock(new Date());
        if (mutation.type === "raw") {
          setToast(`Insumo añadido: ${item.name}. Fija su primer conteo.`);
          setLastSaved({ id: item.id, text: `Añadido ${time}` });
          openAdjust(item, { mode: "set" });
        } else {
          const count = `${formatCount(item.quantity ?? 0)} ${unitShort(item.unit)}`;
          const menuNote =
            item.kind === "menu_item" && !visibilityEnabled ? " La carta no cambia." : "";
          // Abbreviated units ("unid.") already end the sentence.
          const stop = count.endsWith(".") ? "" : ".";
          setToast(`${item.name}: ${item.quantity === 1 ? "queda" : "quedan"} ${count}${stop}${menuNote}`);
          setLastSaved({ id: item.id, text: `Guardado ${time} · ${mutation.view.label.toLocaleLowerCase("es-CL")}` });
          const next = mutation.chain ? nextUncounted(visibleItems, item.id) : null;
          if (next) openAdjust(next, { mode: "set" });
          else {
            setPanel(null);
            returnFocusRef.current = null;
            window.requestAnimationFrame(() => document.getElementById(countButtonId(item.id))?.focus());
          }
        }
        // A replayed request can describe an older revision; always re-read.
        void loadSnapshot({ background: true });
      } catch (error) {
        if (!isCurrentSession(generation, uid)) return;
        setBusy(false);
        const setNotice = (notice: AdjustPanel["notice"]) =>
          setPanel((current) => (current?.type === "adjust" ? { ...current, notice } : current));
        const setCreateError = (message: string) =>
          setPanel((current) => (current?.type === "create" ? { ...current, error: message } : current));

        if (error instanceof StockRequestError && error.status === 401) {
          // 401 is a definite rejection: nothing was written, so the draft can be offered back.
          const current = panelStateRef.current;
          if (current?.type === "adjust" && uid) {
            setLostDraft({
              uid,
              itemId: current.itemId,
              itemName: items.find((entry) => entry.id === current.itemId)?.name ?? "",
              mode: current.mode,
              amount: current.amount,
              reason: current.reason
            });
          }
          setPending(null);
          await signOutAndClear(SESSION_EXPIRED);
          return;
        }
        if (error instanceof StockRequestError && error.ambiguous) {
          // Keep the exact body and request ID; only a retry of the same request is allowed.
          setPending(mutation);
          return;
        }
        setPending(null);
        if (mutation.type === "raw") {
          setCreateError(describeRequestError(error));
          return;
        }
        if (error instanceof StockRequestError && error.status === 409) {
          const conflict = parseStockConflict(error.body);
          const before = items.find((entry) => entry.id === mutation.itemId)?.quantity ?? null;
          if (conflict.code === "request_conflict") {
            setNotice({ kind: "error", message: "Esa solicitud ya se usó con otros datos. Revisa el conteo actual y guarda de nuevo." });
            void loadSnapshot({ background: true });
          } else if (conflict.current) {
            updateItem(conflict.current);
            setNotice({ kind: "conflict", before });
          } else {
            setNotice({ kind: "conflict", before });
            void loadSnapshot({ background: true });
          }
          return;
        }
        if (error instanceof StockRequestError && error.status === 404) {
          setNotice({ kind: "gone" });
          void loadSnapshot({ background: true });
          return;
        }
        setNotice({
          kind: "error",
          message:
            error instanceof StockRequestError && error.status === 403
              ? "Tu cuenta no tiene permiso para guardar cambios en el stock."
              : describeRequestError(error)
        });
      }
    },
    [isCurrentSession, items, loadSnapshot, openAdjust, signOutAndClear, updateItem, visibilityEnabled, visibleItems]
  );

  const saveAdjustment = (chain: boolean) => {
    if (panel?.type !== "adjust" || !panelItem || busy || pending) return;
    const preview = previewAdjustment(panelItem.quantity, panel.mode, panel.amount);
    const amount = parseAmount(panel.amount);
    if (!preview.ok || amount === null) return;
    const reason = panel.reason.trim();
    const label =
      panel.mode === "set"
        ? `Fijar total ${formatCount(amount)}`
        : `${panel.mode === "add" ? "Sumar" : "Restar"} ${formatCount(amount)}`;
    try {
      const payload = buildAdjustmentPayload({
        mode: panel.mode === "set" ? "set" : "delta",
        amount: payloadQuantity(panel.mode, amount),
        expectedRevision: panelItem.revision,
        // Every new or changed adjustment gets a fresh ID; only retries reuse one.
        requestId: makeRequestId(),
        reason
      });
      setPanel({ ...panel, notice: null });
      void commitMutation({
        type: "adjust",
        itemId: panelItem.id,
        payload,
        chain,
        view: { label: reason ? `${label} · ${reason}` : label, before: panelItem.quantity, after: preview.after }
      });
    } catch (error) {
      setPanel({ ...panel, notice: { kind: "error", message: error instanceof Error ? error.message : "No pudimos preparar el ajuste." } });
    }
  };

  const submitRawItem = () => {
    if (panel?.type !== "create" || busy || pending) return;
    try {
      const payload = buildRawItemPayload({ name: panel.name, unit: panel.unit, requestId: makeRequestId() });
      void commitMutation({ type: "raw", payload });
    } catch (error) {
      setPanel({ ...panel, error: error instanceof Error ? error.message : "No pudimos preparar el insumo." });
    }
  };

  const retryPending = () => {
    if (pending && !busy) void commitMutation(pending);
  };

  const resumePending = () => {
    if (!pending) return;
    if (pending.type === "raw") {
      setPanel({ type: "create", name: pending.payload.name, unit: pending.payload.unit, error: "" });
      focusPanelTitle();
      return;
    }
    const item = items.find((entry) => entry.id === pending.itemId);
    if (item) openAdjust(item);
  };

  const restoreLostDraft = () => {
    if (!lostDraft) return;
    const item = items.find((entry) => entry.id === lostDraft.itemId);
    setLostDraft(null);
    if (!item) return;
    // The draft is re-validated against the freshly loaded count before saving.
    openAdjust(item, {
      mode: item.quantity === null ? "set" : lostDraft.mode,
      amount: lostDraft.amount,
      reason: lostDraft.reason
    });
  };

  const showHistory = () => {
    if (panel?.type !== "adjust") return;
    setPanel({ ...panel, view: "history" });
    void loadHistory(panel.itemId, pending !== null);
    focusPanelTitle();
  };

  // "/" focuses search; Esc closes the editor.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape" && panel) {
        event.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, panel]);

  // On phones the sheet is modal: keep Tab inside it.
  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDesktop || event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='-1'], a[href]")
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    if (!email.trim() || !password) {
      setAuthError("Ingresa tu correo y contraseña.");
      return;
    }
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      setPassword("");
    } catch (error) {
      setAuthError(describeLoginError(error));
    }
  };

  if (authStatus === "loading") {
    return <StockFrame><p className="stock-status-line" role="status">Abriendo sesión…</p></StockFrame>;
  }
  if (authStatus === "error") {
    return <StockFrame><div className="stock-screen-message" role="alert"><p>{authError}</p></div></StockFrame>;
  }
  if (authStatus === "signed-out") {
    return (
      <StockFrame>
        <StockLogin
          email={email}
          password={password}
          error={authError}
          lostDraft={lostDraft}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
        />
      </StockFrame>
    );
  }

  if (loadState === "forbidden") {
    return (
      <StockFrame>
        <TopBar onSignOut={() => void signOutAndClear()} />
        <main className="stock-screen-message">
          <h1>Esta cuenta no tiene acceso al stock.</h1>
          <p>
            {accountEmail ? <>Entraste como <strong>{accountEmail}</strong>. </> : null}
            Pide a un encargado que revise tu rol, o entra con otra cuenta.
          </p>
          <button type="button" className="stock-button stock-button--outline" onClick={() => void signOutAndClear()}>
            Entrar con otra cuenta
          </button>
        </main>
      </StockFrame>
    );
  }

  const pendingItem = pendingAdjust ? items.find((entry) => entry.id === pendingAdjust.itemId) : null;
  const pendingOutsidePanel =
    pending !== null &&
    !(pending.type === "adjust" && panel?.type === "adjust" && panel.itemId === pending.itemId) &&
    !(pending.type === "raw" && panel?.type === "create");
  const lostDraftItem = lostDraft ? items.find((entry) => entry.id === lostDraft.itemId) : null;

  let editor: React.ReactNode = null;
  if (panel?.type === "adjust" && panelItem) {
    editor = (
      <AdjustEditor
        item={panelItem}
        panel={panel}
        titleId="stock-editor-title"
        busy={busy}
        pending={pendingAdjust && pendingAdjust.itemId === panelItem.id ? pendingAdjust.view : null}
        visibilityEnabled={visibilityEnabled}
        hasNextUncounted={nextUncounted(visibleItems, panelItem.id) !== null}
        savedNote={toast || null}
        history={historyById[panelItem.id]}
        onChange={(patch) => setPanel((current) => (current?.type === "adjust" ? { ...current, ...patch } : current))}
        onSave={saveAdjustment}
        onRetry={retryPending}
        onShowHistory={showHistory}
        onClose={closePanel}
      />
    );
  } else if (panel?.type === "adjust" && !panelItem) {
    editor = (
      <div className="stock-editor">
        <div className="stock-callout" role="alert">
          <strong id="stock-editor-title" tabIndex={-1}>Este artículo ya no está en el stock.</strong>
          <span>Pudo salir de la carta. Tu ajuste no se guardó.</span>
        </div>
        <button type="button" className="stock-button" onClick={closePanel}>Volver a la lista</button>
      </div>
    );
  } else if (panel?.type === "create") {
    editor = (
      <CreateRawEditor
        panel={panel}
        titleId="stock-editor-title"
        busy={busy}
        pending={pending?.type === "raw"}
        onChange={(patch: Partial<CreatePanel>) =>
          setPanel((current) => (current?.type === "create" ? { ...current, ...patch } : current))
        }
        onSubmit={submitRawItem}
        onRetry={retryPending}
        onClose={closePanel}
      />
    );
  }

  return (
    <StockFrame>
      <TopBar onSignOut={() => void signOutAndClear()} />
      <div className={`stock-workspace${editor ? " has-panel" : ""}`}>
        <main className="stock-main">
          <div className="stock-heading">
            <div>
              <h1>Stock de barra</h1>
              <p className="stock-heading__meta">
                {now ? formatHeaderDate(now) : ""}
                {snapshot && ` · ${summary.total} artículos`}
                {snapshot && summary.uncounted > 0 && ` · ${summary.uncounted} sin contar`}
              </p>
            </div>
            {snapshot?.can_manage_raw_items && (
              <button
                type="button"
                className="stock-button stock-button--outline stock-heading__add"
                disabled={readOnly || pending !== null}
                onClick={() => {
                  returnFocusRef.current = null;
                  setPanel({ type: "create", name: "", unit: "unit", error: "" });
                  focusPanelTitle();
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" /></svg>
                Añadir insumo
              </button>
            )}
          </div>

          {snapshot && (
            <div className={`stock-visibility${visibilityEnabled ? " is-active" : ""}`} role="note">
              <span className="stock-visibility__tag">Carta</span>
              <span>
                {visibilityEnabled
                  ? "Visibilidad por stock: activa. Un producto de carta en 0 se oculta de la carta pública; al reponer, vuelve si no está pausado."
                  : "Los conteos no ocultan productos. Visibilidad por stock: desactivada."}
              </span>
            </div>
          )}

          {readOnly && (
            <div className="stock-banner" role="alert">
              <span>
                <strong>Sin conexión con el stock.</strong>{" "}
                {loadedAt ? `Mostrando lo leído a las ${formatClock(loadedAt)}. ` : ""}No se puede guardar.
              </span>
              <button type="button" className="stock-text-button" onClick={() => void loadSnapshot({ background: true })}>Reintentar</button>
            </div>
          )}
          {pendingOutsidePanel && (
            <div className="stock-banner" role="alert">
              <span>
                <strong>Hay un cambio sin confirmar</strong>
                {pending?.type === "adjust" && pendingItem ? `: ${pendingItem.name}, ${pending.view.label.toLocaleLowerCase("es-CL")}.` : "."}{" "}
                Confírmalo antes de seguir.
              </span>
              <button type="button" className="stock-text-button" onClick={resumePending}>Retomar</button>
            </div>
          )}
          {lostDraft && lostDraftItem && loadState === "ready" && (
            <div className="stock-banner" role="status">
              <span>
                <strong>No se guardó:</strong> {lostDraftItem.name}, {MODE_VERB[lostDraft.mode]} {lostDraft.amount}.
              </span>
              <span className="stock-banner__actions">
                <button type="button" className="stock-text-button" onClick={restoreLostDraft}>Revisar</button>
                <button type="button" className="stock-text-button" onClick={() => setLostDraft(null)}>Descartar</button>
              </span>
            </div>
          )}

          {loadState === "error" && !snapshot ? (
            <div className="stock-screen-message" role="alert">
              <h2>El stock no responde.</h2>
              <p>Revisa la conexión e inténtalo de nuevo. Los conteos ya guardados no se pierden.</p>
              {loadError && loadError !== "El stock no respondió. Puedes reintentar." && <p>{loadError}</p>}
              <button type="button" className="stock-button stock-button--outline" onClick={() => void loadSnapshot()}>Volver a intentar</button>
            </div>
          ) : (
            <>
              <section className="stock-controls" aria-label="Buscar y filtrar">
                <div className="stock-search">
                  <label htmlFor="stock-search" className="stock-visually-hidden">Buscar artículo</label>
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                  <input
                    ref={searchRef}
                    id="stock-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar artículo"
                    autoComplete="off"
                  />
                  {search ? (
                    <button type="button" className="stock-text-button" onClick={() => { setSearch(""); searchRef.current?.focus(); }}>Borrar</button>
                  ) : (
                    <kbd className="stock-search__key" aria-hidden="true">/</kbd>
                  )}
                </div>
                <div className="stock-segmented stock-segmented--filter" role="group" aria-label="Tipo de artículo">
                  {KIND_FILTERS.map((option) => {
                    const count = option.value === "all" ? summary.total : option.value === "menu_item" ? summary.menu : summary.raw;
                    return (
                      <button key={option.value} type="button" aria-pressed={kindFilter === option.value} onClick={() => setKindFilter(option.value)}>
                        {option.label} <span className="stock-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>
                <label className="stock-check">
                  <input type="checkbox" checked={uncountedOnly} onChange={(event) => setUncountedOnly(event.target.checked)} />
                  <span>Solo sin contar</span>
                  <span className="stock-mono stock-check__count">{summary.uncounted}</span>
                </label>
              </section>

              {loadState === "loading" && !snapshot && <LoadingRows />}
              {snapshot && visibleItems.length === 0 && (
                <EmptyState
                  hasItems={items.length > 0}
                  search={search}
                  kindFilter={kindFilter}
                  uncountedOnly={uncountedOnly}
                  canManageRaw={snapshot.can_manage_raw_items}
                  onShowAll={() => { setKindFilter("all"); setUncountedOnly(false); }}
                />
              )}
              {snapshot && visibleItems.length > 0 && (
                <div className="stock-table">
                  <div className="stock-table__head" aria-hidden="true">
                    <span>Artículo</span>
                    <span>Tipo</span>
                    <span>En carta</span>
                    <span>Actualizado</span>
                    <span>Conteo</span>
                  </div>
                  <ul className="stock-list" aria-label="Artículos de stock">
                    {visibleItems.map((item) => (
                      <StockRow
                        key={item.id}
                        item={item}
                        now={now}
                        selected={panel?.type === "adjust" && panel.itemId === item.id}
                        savedText={lastSaved?.id === item.id ? lastSaved.text : null}
                        disabled={readOnly || (pending !== null && !(pending.type === "adjust" && pending.itemId === item.id))}
                        onOpen={() => openAdjust(item)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </main>

        {editor ? (
          <>
            {!isDesktop && <div className="stock-backdrop" onClick={closePanel} aria-hidden="true" />}
            <div
              ref={panelRef}
              className="stock-panel"
              role="dialog"
              aria-modal={isDesktop ? undefined : true}
              aria-labelledby="stock-editor-title"
              onKeyDown={trapFocus}
            >
              {editor}
            </div>
          </>
        ) : (
          <aside className="stock-panel stock-panel--empty" aria-label="Editor de conteo">
            <p>Elige un conteo de la lista para fijar, sumar o restar.</p>
            <p className="stock-mono">/ busca · Enter guarda · Esc cierra</p>
          </aside>
        )}
      </div>
      <div className="stock-toast-region" role="status" aria-live="polite">
        {toast && !panel && (
          <div className="stock-toast">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            <span>{toast}</span>
          </div>
        )}
        {toast && panel && <span className="stock-visually-hidden">{toast}</span>}
      </div>
    </StockFrame>
  );
}

function StockFrame({ children }: { children: React.ReactNode }) {
  return <div className="stock-shell">{children}</div>;
}

function TopBar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="stock-bar">
      <div className="stock-bar__brand">
        <span className="stock-bar__diamond" aria-hidden="true" />
        <span>Barra · Stock</span>
      </div>
      <button type="button" className="stock-text-button" onClick={onSignOut}>Salir</button>
    </header>
  );
}

function StockRow(props: {
  item: StockItem;
  now: Date | null;
  selected: boolean;
  savedText: string | null;
  disabled: boolean;
  onOpen: () => void;
}) {
  const { item } = props;
  const kind = item.kind === "menu_item" ? "Carta" : "Insumo";
  const updated = props.now ? formatUpdated(item.updated_at, props.now) : null;
  const paused = item.kind === "menu_item" && item.menu_available === false;
  const menuState =
    item.kind === "raw_item" ? "No aplica" : paused ? "Pausado (manual)" : item.menu_available ? "Disponible" : "Vinculado";
  const unknown = item.quantity === null;
  const unit = unitShort(item.unit);

  let meta: React.ReactNode;
  if (props.savedText) meta = <span className="is-saved">{props.savedText}</span>;
  else if (paused) meta = <span className="is-paused">Pausado en carta{updated ? ` · ${updated}` : ""}</span>;
  else meta = <>{kind} · {unknown ? "aún sin conteo" : updated ? `actualizado ${updated}` : "contado"}</>;

  const label = `${item.name}, ${unknown ? "sin contar" : `${formatCount(item.quantity ?? 0)} ${unit}`}, ${unknown ? "fijar primer conteo" : "editar conteo"}`;

  return (
    <li className={`stock-row${props.selected ? " is-selected" : ""}${props.savedText ? " is-saved" : ""}`}>
      <div className="stock-row__name">
        <span className="stock-row__title">{item.name}</span>
        <span className="stock-row__meta">{meta}</span>
      </div>
      <span className="stock-row__cell">{kind}</span>
      <span className={`stock-row__cell${paused ? " is-paused" : ""}`}>{menuState}</span>
      <span className="stock-row__cell stock-mono">{updated ?? "—"}</span>
      <button
        id={countButtonId(item.id)}
        type="button"
        className={`stock-count${unknown ? " is-unknown" : ""}`}
        onClick={props.onOpen}
        disabled={props.disabled}
        aria-label={label}
        aria-haspopup="dialog"
      >
        {unknown ? (
          <span className="stock-count__unknown">Sin contar</span>
        ) : (
          <>
            <span className="stock-count__value">{formatCount(item.quantity ?? 0)}</span>
            <span className="stock-count__unit">{unit}</span>
          </>
        )}
      </button>
    </li>
  );
}

function EmptyState(props: {
  hasItems: boolean;
  search: string;
  kindFilter: KindFilter;
  uncountedOnly: boolean;
  canManageRaw: boolean;
  onShowAll: () => void;
}) {
  if (!props.hasItems) {
    return (
      <div className="stock-empty">
        <strong>Todavía no hay artículos de stock.</strong>
        <span>La pastelería aparece sola desde la carta.</span>
      </div>
    );
  }
  if (props.kindFilter === "raw_item" && !props.search && !props.uncountedOnly) {
    return (
      <div className="stock-empty">
        <strong>Todavía no hay insumos.</strong>
        <span>{props.canManageRaw ? "Usa “Añadir insumo” para crear el primero." : "Los agrega un encargado. Tú puedes contar los que aparezcan aquí."}</span>
      </div>
    );
  }
  if (props.uncountedOnly && !props.search) {
    return (
      <div className="stock-empty">
        <strong>Todo está contado.</strong>
        <span>No quedan artículos sin contar en esta vista.</span>
      </div>
    );
  }
  const scope = props.kindFilter === "menu_item" ? " en Carta" : props.kindFilter === "raw_item" ? " en Insumos" : "";
  return (
    <div className="stock-empty">
      <strong>Nada con “{props.search.trim()}”{scope}.</strong>
      <span>La pastelería llega sola desde la carta. Si falta un producto, se agrega en la gestión de carta, no aquí.</span>
      {(props.kindFilter !== "all" || props.uncountedOnly) && (
        <button type="button" className="stock-button stock-button--outline" onClick={props.onShowAll}>Buscar en Todos</button>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="stock-loading" role="status" aria-label="Cargando conteos">
      {[0, 1, 2, 3].map((row) => (
        <div className="stock-loading__row" key={row}>
          <span className="stock-loading__text"><span /><span /></span>
          <span className="stock-loading__count" />
        </div>
      ))}
    </div>
  );
}

function StockLogin(props: {
  email: string;
  password: string;
  error: string;
  lostDraft: LostDraft | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="stock-login">
      <span className="stock-bar__diamond" aria-hidden="true" />
      <h1>Stock de barra</h1>
      <p>Entra con tu cuenta individual. Cada conteo queda registrado con ella.</p>
      {props.lostDraft && (
        <div className="stock-callout" role="status">
          <strong>No se guardó: {props.lostDraft.itemName}, {MODE_VERB[props.lostDraft.mode]} {props.lostDraft.amount}.</strong>
          <span>Al volver a entrar lo dejamos listo para revisar.</span>
        </div>
      )}
      <form className="stock-login__form" onSubmit={props.onSubmit} noValidate>
        <div className="stock-field">
          <label htmlFor="stock-login-email">Correo</label>
          <input id="stock-login-email" type="email" value={props.email} onChange={(event) => props.onEmailChange(event.target.value)} autoComplete="username" autoFocus />
        </div>
        <div className="stock-field">
          <label htmlFor="stock-login-password">Contraseña</label>
          <input id="stock-login-password" type="password" value={props.password} onChange={(event) => props.onPasswordChange(event.target.value)} autoComplete="current-password" aria-describedby="stock-login-error" />
        </div>
        <div id="stock-login-error" aria-live="assertive">
          {props.error && <p className="stock-inline-error">{props.error}</p>}
        </div>
        <button type="submit" className="stock-button">Entrar</button>
      </form>
    </main>
  );
}
