"use client";
import { getFirebaseAuth } from "../auth/firebase";
import { normalizeHistory, normalizeItem, normalizeSnapshot } from "./model";
import type { AdjustmentPayload, CreatePayload, KitchenItem } from "./types";
export class KitchenRequestError extends Error {
  constructor(
    public status: number | null,
    public code: string,
    public body: unknown,
    public ambiguous: boolean,
  ) {
    super(code);
    this.name = "KitchenRequestError";
  }
  get item(): KitchenItem | null {
    try {
      return normalizeItem((this.body as { item?: unknown })?.item);
    } catch {
      return null;
    }
  }
}
async function request<T>(
  path: string,
  init: RequestInit,
  parse: (v: unknown) => T,
): Promise<T> {
  let token: string | undefined;
  try {
    token = await getFirebaseAuth().currentUser?.getIdToken();
  } catch {
    throw new KitchenRequestError(401, "session_expired", null, false);
  }
  if (!token)
    throw new KitchenRequestError(401, "session_expired", null, false);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch("/api/kitchen-stock" + path, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      throw new KitchenRequestError(r.status, "invalid_response", null, true);
    }
    if (!r.ok) {
      const code =
        body && typeof body === "object" && "code" in body
          ? String(body.code)
          : "request_failed";
      throw new KitchenRequestError(
        r.status,
        code,
        body,
        r.status >= 500 || r.status === 408 || r.status === 429,
      );
    }
    try {
      return parse(body);
    } catch {
      throw new KitchenRequestError(502, "invalid_response", body, true);
    }
  } catch (e) {
    if (e instanceof KitchenRequestError) throw e;
    throw new KitchenRequestError(null, "network_error", null, true);
  } finally {
    clearTimeout(timer);
  }
}
export const getKitchenStock = () =>
  request("", { method: "GET" }, normalizeSnapshot);
export const createIngredient = (payload: CreatePayload) =>
  request(
    "/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    (b) => normalizeItem((b as { item: unknown }).item),
  );
export const adjustIngredient = (id: string, payload: AdjustmentPayload) =>
  request(
    `/items/${encodeURIComponent(id)}/adjustments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    (b) => normalizeItem((b as { item: unknown }).item),
  );
export const getKitchenHistory = (id: string, beforeRevision?: number) =>
  request(
    `/items/${encodeURIComponent(id)}/history?limit=30${beforeRevision ? "&before_revision=" + beforeRevision : ""}`,
    { method: "GET" },
    normalizeHistory,
  );
export const kitchenAPI = {
  list: getKitchenStock,
  create: createIngredient,
  adjust: adjustIngredient,
  history: getKitchenHistory,
};
export type KitchenAPI = typeof kitchenAPI;
export function requestMessage(e: unknown): string {
  if (e instanceof KitchenRequestError) {
    if (e.status === 401) return "Tu sesión expiró. Vuelve a entrar.";
    if (e.status === 403)
      return "Tu cuenta no tiene permiso para gestionar cocina.";
    if (e.code === "duplicate_ingredient")
      return "Este ingrediente ya existe. Usa el registro existente.";
    if (e.code === "revision_conflict")
      return "Alguien cambió este conteo. Revisa el total actualizado antes de guardar otra vez.";
    if (e.ambiguous)
      return "No pudimos confirmar el cambio. Reintenta el mismo cambio antes de continuar.";
    if (e.status === 400)
      return "Revisa el nombre, la unidad y la cantidad. No se guardó el cambio.";
  }
  return "No pudimos completar la solicitud. Revisa la conexión e inténtalo de nuevo.";
}
