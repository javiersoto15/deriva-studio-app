"use client";
import { getFirebaseAuth } from "../auth/firebase";
import {
  normalizeAdjustment,
  normalizeHistory,
  normalizeLinks,
  normalizeSnapshot,
  validAdjustmentPayload,
  validBeanId,
  validLinksPayload,
} from "./model";
import type { AdjustmentPayload, LinksPayload } from "./types";
export class BeanRequestError extends Error {
  constructor(
    public status: number | null,
    public code: string,
    public body: unknown,
    public ambiguous: boolean,
  ) {
    super(code);
    this.name = "BeanRequestError";
  }
}
type AuthLike = {
  currentUser: { uid: string; getIdToken: () => Promise<string> } | null;
};
type Dependencies = {
  getAuth: () => AuthLike;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  timeoutMs?: number;
};
/** Capture the account at every async boundary; responses never cross accounts. */
export function createBeanClient(deps: Dependencies) {
  async function request<T>(
    uid: string,
    path: string,
    init: RequestInit,
    parse: (v: unknown) => T,
  ): Promise<T> {
    let sent = false;
    const guard = () => {
      if (!uid || deps.getAuth().currentUser?.uid !== uid)
        throw new BeanRequestError(
          401,
          "session_changed",
          null,
          sent && init.method !== "GET",
        );
    };
    guard();
    let token: string;
    try {
      token = await deps.getAuth().currentUser!.getIdToken();
    } catch {
      throw new BeanRequestError(401, "session_expired", null, false);
    }
    guard();
    if (!token) throw new BeanRequestError(401, "session_expired", null, false);
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 12000);
    try {
      sent = true;
      const response = await deps.fetch("/api/barra-stock/beans" + path, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      });
      guard();
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        guard();
        throw new BeanRequestError(
          response.status,
          "invalid_response",
          null,
          true,
        );
      }
      guard();
      if (!response.ok) {
        const code =
          body &&
          typeof body === "object" &&
          "code" in body &&
          typeof body.code === "string"
            ? body.code
            : "request_failed";
        throw new BeanRequestError(
          response.status,
          code,
          body,
          response.status >= 500 ||
            response.status === 408 ||
            response.status === 429,
        );
      }
      try {
        return parse(body);
      } catch {
        throw new BeanRequestError(
          response.status,
          "invalid_response",
          body,
          true,
        );
      }
    } catch (e) {
      if (e instanceof BeanRequestError) throw e;
      throw new BeanRequestError(null, "network_error", null, true);
    } finally {
      clearTimeout(timer);
    }
  }
  const path = (id: string) => {
    if (!validBeanId(id))
      throw new BeanRequestError(400, "invalid_bean_stock_input", null, false);
    return "/" + encodeURIComponent(id);
  };
  const json = (method: string, payload: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    getBeans: (uid: string) =>
      request(uid, "", { method: "GET" }, normalizeSnapshot),
    adjustBean: (uid: string, id: string, payload: AdjustmentPayload) => {
      if (!validAdjustmentPayload(payload))
        return Promise.reject(
          new BeanRequestError(400, "invalid_bean_stock_input", null, false),
        );
      return request(
        uid,
        path(id) + "/adjustments",
        json("POST", payload),
        (v) => {
          const r = normalizeAdjustment(v);
          if (
            r.item.id !== id ||
            r.adjustment.request_id !== payload.request_id ||
            r.adjustment.revision !== payload.expected_revision + 1
          )
            throw Error("invalid_response");
          return r;
        },
      );
    },
    getBeanHistory: (uid: string, id: string, beforeRevision?: number) => {
      if (
        beforeRevision !== undefined &&
        (!Number.isSafeInteger(beforeRevision) || beforeRevision < 1)
      )
        return Promise.reject(
          new BeanRequestError(400, "invalid_bean_stock_input", null, false),
        );
      return request(
        uid,
        path(id) +
          "/history?limit=30" +
          (beforeRevision === undefined
            ? ""
            : "&before_revision=" + beforeRevision),
        { method: "GET" },
        (v) => {
          const page = normalizeHistory(v);
          if (page.entries.some((e) => e.bean_id !== id))
            throw Error("invalid_response");
          return page;
        },
      );
    },
    getBeanLinks: (uid: string, id: string) =>
      request(uid, path(id) + "/menu-links", { method: "GET" }, (v) => {
        const r = normalizeLinks(v);
        if (r.bean_id !== id) throw Error("invalid_response");
        return r;
      }),
    putBeanLinks: (uid: string, id: string, payload: LinksPayload) => {
      if (!validLinksPayload(payload))
        return Promise.reject(
          new BeanRequestError(400, "invalid_bean_stock_input", null, false),
        );
      return request(
        uid,
        path(id) + "/menu-links",
        json("PUT", payload),
        (v) => {
          const r = normalizeLinks(v);
          if (
            r.bean_id !== id ||
            JSON.stringify([...r.menu_item_ids].sort()) !==
              JSON.stringify([...payload.menu_item_ids].sort())
          )
            throw Error("invalid_response");
          return r;
        },
      );
    },
  };
}
export const beanAPI = createBeanClient({
  getAuth: getFirebaseAuth,
  fetch: (input, init) => fetch(input, init),
});
export type BeanAPI = typeof beanAPI;
export const {
  getBeans,
  adjustBean,
  getBeanHistory,
  getBeanLinks,
  putBeanLinks,
} = beanAPI;
export function requestMessage(error: unknown): string {
  if (error instanceof BeanRequestError) {
    if (error.status === 401)
      return "Tu sesión expiró. Vuelve a entrar para continuar.";
    if (error.status === 403)
      return "Tu cuenta no tiene permiso para gestionar los granos.";
    if (error.ambiguous)
      return "Guardado por confirmar. Reintenta el mismo cambio antes de continuar.";
    if (error.status === 404) return "Granos todavía no está habilitado.";
    if (error.status === 409)
      return "El stock o las conexiones cambiaron. Actualiza y revisa antes de guardar otra vez.";
    if (error.status === 400)
      return "Revisa la cantidad y los datos del cambio.";
  }
  return "No pudimos completar la solicitud. Revisa la conexión e inténtalo de nuevo.";
}
