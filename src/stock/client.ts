"use client";

import { getFirebaseAuth } from "../auth/firebase";
import {
  errorMessageFromBody,
  extractStockItem,
  isAmbiguousStockStatus,
  normalizeHistory,
  normalizeStockSnapshot
} from "./contract";
import type {
  CreateRawItemPayload,
  StockAdjustmentPayload,
  StockHistoryEntry,
  StockItem,
  StockSnapshot
} from "./types";

const STOCK_PROXY = "/api/barra-stock";
const CLIENT_TIMEOUT_MS = 12_000;

export class StockRequestError extends Error {
  readonly status: number | null;
  readonly code?: string;
  readonly body: unknown;
  readonly ambiguous: boolean;

  constructor(args: {
    message: string;
    status?: number | null;
    code?: string;
    body?: unknown;
    ambiguous?: boolean;
  }) {
    super(args.message);
    this.name = "StockRequestError";
    this.status = args.status ?? null;
    this.code = args.code;
    this.body = args.body;
    this.ambiguous = args.ambiguous ?? (args.status ? isAmbiguousStockStatus(args.status) : true);
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function stockFetch<T>(path: string, init: RequestInit, parse: (body: unknown) => T): Promise<T> {
  let token: string | null = null;
  try {
    token = (await getFirebaseAuth().currentUser?.getIdToken()) ?? null;
  } catch (error) {
    throw new StockRequestError({
      message: "No pudimos renovar tu sesión.",
      status: 401,
      code: "auth_token_unavailable",
      body: error,
      ambiguous: false
    });
  }
  if (!token) {
    throw new StockRequestError({
      message: "Tu sesión no está disponible.",
      status: 401,
      code: "missing_token",
      ambiguous: false
    });
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const response = await fetch(`${STOCK_PROXY}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {})
      }
    });
    const body = await parseBody(response);
    if (!response.ok) {
      throw new StockRequestError({
        message:
          errorMessageFromBody(body) ??
          (response.status === 403
            ? "Tu cuenta no tiene permiso para gestionar el stock."
            : "No pudimos completar la solicitud."),
        status: response.status,
        code:
          body && typeof body === "object" && typeof (body as { code?: unknown }).code === "string"
            ? (body as { code: string }).code
            : undefined,
        body
      });
    }
    try {
      return parse(body);
    } catch (error) {
      throw new StockRequestError({
        message: "La respuesta de stock no tiene el formato esperado.",
        status: 502,
        code: "invalid_stock_response",
        body: error,
        ambiguous: true
      });
    }
  } catch (error) {
    if (error instanceof StockRequestError) throw error;
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    throw new StockRequestError({
      message: timedOut
        ? "El stock tardó demasiado en responder."
        : "No pudimos conectar con el stock.",
      status: timedOut ? 504 : null,
      code: timedOut ? "stock_timeout" : "stock_network_error",
      body: error,
      ambiguous: true
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getStockSnapshot(): Promise<StockSnapshot> {
  return stockFetch("", { method: "GET" }, normalizeStockSnapshot);
}

export function createRawItem(payload: CreateRawItemPayload): Promise<StockItem> {
  return stockFetch(
    "/raw-items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    extractStockItem
  );
}

export function adjustStockItem(stockId: string, payload: StockAdjustmentPayload): Promise<StockItem> {
  return stockFetch(
    `/items/${encodeURIComponent(stockId)}/adjustments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    extractStockItem
  );
}

export function getStockHistory(stockId: string): Promise<StockHistoryEntry[]> {
  return stockFetch(
    `/items/${encodeURIComponent(stockId)}/history`,
    { method: "GET" },
    normalizeHistory
  );
}
