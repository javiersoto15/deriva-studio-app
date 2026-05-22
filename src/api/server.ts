import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { components } from "./schema";
import { groupMenuItems, type MenuView } from "./menu-grouping";
import type { ItemDetail, OriginCardView } from "./hooks";

// Phase 2B.2 — Node-side fetcher for the customer carta routes.
//
// These helpers run inside React Server Components and Next 16 Cache Components.
// They are tagged with `'menu'` (plus a per-item / per-origin tag) so any future
// admin menu-edit Server Action can bust the cache with
// `revalidateTag('menu')` (background) or `updateTag('menu')` (same-request).
//
// Resolution order for the base URL:
//   1. INTERNAL_API_BASE_URL — server-only, points at the private backend in prod
//      (e.g. a Fly internal address or VPC hostname). Avoids the public hop.
//   2. NEXT_PUBLIC_API_BASE_URL — fallback / dev / preview.
//   3. http://localhost:8080 — last-resort local dev.
//
// We DO NOT forward auth tokens here: every endpoint below is public (the carta
// is public on the marketing surface). Auth-gated reads still go through
// `apiClient` on the client side via @tanstack/react-query.

function resolveBaseUrl(): string {
  // Server-side fetch needs an absolute URL. NEXT_PUBLIC_API_BASE_URL is often
  // a relative path (e.g. "/api") because the browser relies on the Next dev
  // rewrite to forward it to the Go backend — that rewrite doesn't apply when
  // Node fetches directly. Treat any non-absolute value as "talk to the
  // backend the rewrite would have hit."
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${resolveBaseUrl()}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

// Cached fetches happen at request time AND at build time during prerender. At
// build time the backend usually isn't reachable (ECONNREFUSED), so we wrap the
// throw and return null. Callers handle null with a placeholder shell. The
// cached null entry is short-lived (`minutes`) so the next real hit refreshes.
async function tryGetJson<T>(path: string): Promise<T | null> {
  try {
    return await getJson<T>(path);
  } catch {
    return null;
  }
}

// ----- Public canonical /menu -----------------------------------------------
// Returns the flat MenuItem[] from the canonical OpenAPI contract.
export async function getMenuItems(): Promise<
  components["schemas"]["MenuItem"][] | null
> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu");
  return tryGetJson<components["schemas"]["MenuItem"][]>("/menu");
}

// ----- UI-shaped MenuView (derived) -----------------------------------------
// /carta wants a sectioned MenuView; the canonical contract only exposes the
// flat /menu MenuItem[]. Group by `section` here so we don't depend on a
// MSW-only /menu/view path. `today_origin` points at the house blend (the
// all-purpose default origin per /12_menu/coffee_origins/README.md). The
// specialty rotation and decaf live on their own origin cards reachable from
// the item detail spec sheet.
export async function getMenuView(): Promise<MenuView | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu");
  const items = await tryGetJson<components["schemas"]["MenuItem"][]>("/menu");
  if (!items) return null;
  return {
    categories: groupMenuItems(items),
    today_origin: { id: "orig_house_blend_dach", label: "House Blend · DACH" }
  };
}

// ----- Per-item view --------------------------------------------------------
// Used by /carta/[id] for the rich spec sheet.
export async function getMenuItem(id: string): Promise<ItemDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu", `menu-item-${id}`);
  return tryGetJson<ItemDetail>(`/menu/items/${id}`);
}

// ----- Per-origin view ------------------------------------------------------
// Used by /carta/origen/[id].
export async function getOriginCard(id: string): Promise<OriginCardView | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu", `menu-origin-${id}`);
  return tryGetJson<OriginCardView>(`/menu/origins/${id}`);
}
