"use client";
import { getFirebaseAuth } from "../auth/firebase";
import {
  normalizeItem,
  normalizeSnapshot,
  normalizeMutation,
  normalizeMovementPage,
} from "./model";
import type {
  CreatePayload,
  AdjustmentPayload,
  WithdrawalPayload,
  SalonItem,
  WithdrawalLocation,
} from "./types";
export class SalonRequestError extends Error {
  constructor(
    public status: number | null,
    public code: string,
    public body: unknown,
    public ambiguous: boolean,
  ) {
    super(code);
    this.name = "SalonRequestError";
  }
  get item(): SalonItem | null {
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
    throw new SalonRequestError(401, "session_expired", null, false);
  }
  if (!token) throw new SalonRequestError(401, "session_expired", null, false);
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch("/api/salon-stock" + path, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new SalonRequestError(
        response.status,
        "invalid_response",
        null,
        true,
      );
    }
    if (!response.ok)
      throw new SalonRequestError(
        response.status,
        body && typeof body === "object" && "code" in body
          ? String(body.code)
          : "request_failed",
        body,
        response.status >= 500 ||
          response.status === 408 ||
          response.status === 429,
      );
    try {
      return parse(body);
    } catch {
      throw new SalonRequestError(502, "invalid_response", body, true);
    }
  } catch (error) {
    if (error instanceof SalonRequestError) throw error;
    throw new SalonRequestError(null, "network_error", null, true);
  } finally {
    clearTimeout(timer);
  }
}
const post = (payload: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
export const salonAPI = {
  list: () => request("", { method: "GET" }, normalizeSnapshot),
  create: (payload: CreatePayload) =>
    request("/items", post(payload), normalizeMutation),
  adjust: (id: string, payload: AdjustmentPayload) =>
    request(
      `/items/${encodeURIComponent(id)}/adjustments`,
      post(payload),
      normalizeMutation,
    ),
  withdraw: (payload: WithdrawalPayload) =>
    request("/withdrawals", post(payload), normalizeMutation),
  history: (id: string, before?: number) =>
    request(
      `/items/${encodeURIComponent(id)}/history?limit=30${before ? "&before_revision=" + before : ""}`,
      { method: "GET" },
      (v) => normalizeMovementPage(v, "item"),
    ),
  withdrawals: (
    options: {
      location?: WithdrawalLocation;
      taker?: string;
      before?: number;
    } = {},
  ) => {
    const query = new URLSearchParams({ limit: "30" });
    if (options.location) query.set("location", options.location);
    if (options.taker) query.set("taker", options.taker);
    if (options.before) query.set("before_sequence", String(options.before));
    return request("/withdrawals?" + query, { method: "GET" }, (v) =>
      normalizeMovementPage(v, "withdrawals"),
    );
  },
};
export type SalonAPI = typeof salonAPI;
export function requestMessage(error: unknown): string {
  if (error instanceof SalonRequestError) {
    if (error.status === 401)
      return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
    if (error.status === 403) return "Tu cuenta no tiene acceso a Stock Salón.";
    const messages: Record<string, string> = {
      duplicate_item:
        "Este artículo ya existe en esta ubicación. Usa su registro existente.",
      revision_conflict:
        "El saldo cambió. Revisa el stock actualizado antes de confirmar una nueva operación.",
      insufficient_stock:
        "No hay stock suficiente. Revisa el saldo actualizado y la cantidad.",
      quantity_unknown: "Primero registra un conteo para este artículo.",
      withdrawal_required:
        "Los retiros de bodega y limpieza se registran desde Registrar retiro, con el nombre de quien retiró.",
      withdrawal_location_not_allowed:
        "No se registran retiros desde Refrigerador.",
      location_mismatch: "El artículo no pertenece a la ubicación elegida.",
      item_not_found: "No encontramos este artículo. Actualiza el inventario.",
      request_conflict:
        "Este identificador ya corresponde a otra operación. Conservamos el cambio pendiente para revisarlo.",
    };
    if (messages[error.code]) return messages[error.code];
    if (error.ambiguous)
      return "No pudimos confirmar el resultado. Reintenta el mismo cambio para evitar duplicarlo.";
    if (error.status === 400)
      return "Revisa el artículo, la persona, la cantidad y el motivo. No se guardó el cambio.";
  }
  return "No pudimos completar la solicitud. Revisa la conexión e inténtalo de nuevo.";
}
