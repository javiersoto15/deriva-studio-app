"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";
import { getFirebaseAuth } from "../auth/firebase";

// =============================================================================
// Canonical types — sourced from openapi.yaml via openapi-typescript.
// Treat these as the source of truth. UI-only extensions live below.
// =============================================================================

export type Member = components["schemas"]["Member"];
export type MemberSelfProfile = components["schemas"]["MemberSelfProfile"];
export type PatchMeRequest = components["schemas"]["PatchMeRequest"];
export type BalanceResponse = components["schemas"]["BalanceResponse"];
export type NextReward = components["schemas"]["NextReward"];
export type MemberQRTokenResponse = components["schemas"]["MemberQRTokenResponse"];
export type RewardRedemptionTokenResponse = components["schemas"]["RewardRedemptionTokenResponse"];
export type StaffLookupRequest = components["schemas"]["StaffLookupRequest"];
export type StaffLookupResponse = components["schemas"]["StaffLookupResponse"];
export type MenuItem = components["schemas"]["MenuItem"];
export type OriginCard = components["schemas"]["OriginCard"];
export type CreateMemberRequest = components["schemas"]["CreateMemberRequest"];
export type CreateMissingPointsClaimRequest = components["schemas"]["CreateMissingPointsClaimRequest"];
export type MissingPointsClaim = components["schemas"]["MissingPointsClaim"];
export type FeedbackRequest = components["schemas"]["FeedbackRequest"];
export type LedgerEntry = components["schemas"]["LedgerEntry"];
export type IdentitySummary = components["schemas"]["IdentitySummary"];
export type LinkedProvider = components["schemas"]["LinkedProvider"];
export type IdentityConflict = components["schemas"]["IdentityConflict"];
export type AddEmailRequest = components["schemas"]["AddEmailRequest"];
export type AddEmailResponse = components["schemas"]["AddEmailResponse"];
export type AddPhoneRequest = components["schemas"]["AddPhoneRequest"];
export type AddPhoneResponse = components["schemas"]["AddPhoneResponse"];
export type LinkProviderRequest = components["schemas"]["LinkProviderRequest"];

// Extracts the typed IdentityConflict body from an openapi-fetch error, when
// the backend returned a 409 with the canonical shape. Returns null otherwise
// — caller can fall back to a generic error surface. Identity-mutation hooks
// run with meta.silent so the global QueryProvider toast does not preempt the
// inline manual-resolution UX defined in the conflict Paper artboards.
export function parseIdentityConflict(error: unknown): IdentityConflict | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { error?: IdentityConflict } & Partial<IdentityConflict>;
  const body = candidate.error ?? candidate;
  if (
    body &&
    typeof body === "object" &&
    typeof (body as IdentityConflict).code === "string" &&
    ["email_taken", "phone_taken", "provider_taken", "last_method_cant_remove"].includes(
      (body as IdentityConflict).code
    )
  ) {
    return body as IdentityConflict;
  }
  return null;
}

// =============================================================================
// UI-only shapes — endpoints not yet in the canonical contract.
// These are served by MSW in dev. Flag each hook that depends on them.
// =============================================================================

export type Reward = { id: string; name: string; threshold_points: number };

import {
  CATEGORY_ORDER,
  SECTION_ORDER,
  groupMenuItems,
  type MenuCategory,
  type MenuSection,
  type MenuView
} from "./menu-grouping";

export {
  CATEGORY_ORDER,
  SECTION_ORDER,
  groupMenuItems,
  type MenuCategory,
  type MenuSection,
  type MenuView
};

export type RewardDetailed = {
  id: components["schemas"]["MyReward"]["id"];
  name: components["schemas"]["MyReward"]["name"];
  threshold_points: components["schemas"]["MyReward"]["threshold_points"];
  icon: components["schemas"]["MyReward"]["icon"];
  expiry_label: components["schemas"]["MyReward"]["expiry_label"];
  expires_at?: components["schemas"]["MyReward"]["expires_at"];
  eligibility_label: components["schemas"]["MyReward"]["eligibility_label"];
  points_cost: components["schemas"]["MyReward"]["points_cost"];
  reward_type: components["schemas"]["MyReward"]["reward_type"];
  item_quantity: components["schemas"]["MyReward"]["item_quantity"];
  eligible_item_ids?: components["schemas"]["MyReward"]["eligible_item_ids"];
  available: components["schemas"]["MyReward"]["available"];
};

export type MemberProfileView = {
  id: string;
  member_id: string;
  display_name: string;
  phone: string;
  phone_verified_at: string | null;
  balance_points: number;
  email: string;
  email_verified_at: string | null;
  member_since: string;
  ritual: string;
  favorite_drink: string;
  birthday: string;
  language: string;
  notifications: string;
  digital_receipts: boolean;
  origins_tasted: number;
};

export type ActivityPreviewEntry = {
  id: string;
  label: string;
  when: string;
  points: number;
  tag: string | null;
};

export type ActivityLedgerEntry = {
  id: string;
  at: string;
  label: string;
  sub: string;
  amount_clp: number | null;
  points: number;
  state: "scanned" | "staff" | "pending";
};

export type Favorite = { id: string; name: string; sub: string; price_clp: number };
export type Suggestion = { id: string; name: string; sub: string };
export type FavoritesResponse = { saved: Favorite[]; suggestions: Suggestion[] };

export type OriginCardView = {
  id: string;
  country: string;
  region: string;
  producer: string;
  variety: string;
  process: string;
  method: string;
  name_a: string;
  name_b: string;
  body: string;
  barista_note: string;
  barista_attrib: string;
};

export type ItemDetail = {
  id: string;
  name: string;
  section_eyebrow: string;
  size_note: string;
  price_clp: number;
  spec: { label: string; value: string }[];
  allergens: string[];
  barista_note: string;
};

export type Claim = {
  id: string;
  status: "pending" | "approved" | "rejected";
  receipt: string;
  headline: string;
  body: string;
};

// RewardRedemptionTokenResponse now canonically includes `short_code` (migration
// 007 + openapi update). No frontend extension needed.
export type RedemptionTokenView = RewardRedemptionTokenResponse;

// ---- Helper for plain-fetch endpoints not yet migrated to openapi-fetch. ----

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const headers = new Headers(init?.headers);
  const authHeaders = await firebaseAuthHeaders();
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function firebaseAuthHeaders(): Promise<Record<string, string>> {
  try {
    const current = getFirebaseAuth().currentUser;
    if (!current) return {};
    return { Authorization: `Bearer ${await current.getIdToken()}` };
  } catch {
    return {};
  }
}

// =============================================================================
// Hooks — typed via apiClient where the canonical contract covers the route.
// =============================================================================

// Backend: wired.
//
// Identity is treated as always-stale so we never paint outdated member_code
// or backup_code values after the backend changes them. Combined with the
// global refetchOnWindowFocus: true, the worst case is a single refetch on
// each tab focus — cheap, and the alternative was "stale for hours on a
// long-open tab".
export function useCurrentMember() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/me");
      if (error) throw error;
      return data;
    },
    staleTime: 0
  });
}

// Backend: wired.
export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PatchMeRequest) => {
      const { data, error } = await apiClient.PATCH("/me", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
    }
  });
}

// Backend: wired.
export function usePointsBalance() {
  return useQuery({
    queryKey: ["me", "balance"],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/me/balance");
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });
}

// Backend: wired.
export function useMemberQrToken() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST("/me/member-qr-token");
      if (error) throw error;
      return data;
    }
  });
}

// Backend: wired. Reward redemption token (60s TTL).
// `refetch` re-issues a new token; canonical response is { token, expires_at,
// short_code } per the updated openapi.yaml (migration 007).
export function useRedemptionToken(rewardId: string, enabled = true) {
  return useQuery({
    queryKey: ["me", "rewards", rewardId, "redemption-token"],
    queryFn: async () => {
      const { data, error } = await apiClient.POST(
        "/me/rewards/{reward_id}/redemption-token",
        { params: { path: { reward_id: rewardId } } }
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(rewardId) && enabled,
    staleTime: 60_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false
  });
}

// Backend: wired.
// Optimistic update: remove from favorites cache immediately; rollback on error.
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await apiClient.DELETE("/me/favorites/{item_id}", {
        params: { path: { item_id: itemId } }
      });
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["me", "favorites"] });
      const previous = queryClient.getQueryData<FavoritesResponse>(["me", "favorites"]);
      if (previous) {
        queryClient.setQueryData<FavoritesResponse>(["me", "favorites"], {
          ...previous,
          saved: previous.saved.filter((f) => f.id !== itemId)
        });
      }
      return { previous };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["me", "favorites"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "favorites"] });
    }
  });
}

// ---- Localized content fetch helpers ----
//
// Backend owns localized copy for menu and rewards (item names, descriptions,
// tasting notes, allergens, reward labels, etc.). The frontend MUST NOT
// translate these fields — pass the active locale to the endpoint and render
// the response verbatim. UI chrome (buttons, nav, empty states) stays on
// next-intl client-side translation.
//
// Backend uses BCP-47 ("es-CL", "en"); frontend's i18n module uses short
// codes ("es", "en"). The mapper bridges them. New locales added here must
// also be added to the backend enum in openapi.yaml.

export type BackendLocale = "es-CL" | "en";
export const DEFAULT_BACKEND_LOCALE: BackendLocale = "es-CL";

export function toBackendLocale(short?: string | null): BackendLocale {
  if (short === "en") return "en";
  return DEFAULT_BACKEND_LOCALE;
}

// Backend: wired. Note: canonical /menu returns MenuItem[] (flat array). The
// UI groups by section client-side via useMenu() below.
export function useMenuItems(locale: BackendLocale = DEFAULT_BACKEND_LOCALE) {
  return useQuery({
    queryKey: ["menu", locale],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/menu", {
        params: { query: { locale } }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000
  });
}

// UI convenience: groups canonical MenuItem[] into MenuView (categories →
// sections). today_origin defaults to the House Blend (the all-purpose origin
// per /12_menu/coffee_origins/README.md). Specialty rotation + decaf live on
// their own /menu/origins/{id} cards reachable from item detail.
//
// Filter params map directly onto the new /menu?category=&?section= contract.
// When the backend hasn't backfilled taxonomy fields yet, items collapse into
// a single synthetic "Menú" category via groupMenuItems (server is the
// authority for filtering — we don't reapply the filter client-side).
export type MenuFilters = {
  category?: NonNullable<MenuItem["category_id"]>;
  section?: NonNullable<MenuItem["section_id"]>;
  locale?: BackendLocale;
};

export function useMenu(filters: MenuFilters = {}) {
  const locale = filters.locale ?? DEFAULT_BACKEND_LOCALE;
  return useQuery<MenuView>({
    queryKey: ["menu", "view", locale, filters.category ?? null, filters.section ?? null],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/menu", {
        params: { query: { ...filters, locale } }
      });
      if (error) throw error;
      const items = (data ?? []) as MenuItem[];
      return {
        categories: groupMenuItems(items),
        today_origin: { id: "orig_house_blend_dach", label: "House Blend · DACH" }
      };
    },
    staleTime: 5 * 60_000
  });
}

// Backend: wired. ?locale picks the localized name/description/tasting_notes/
// allergens copy on the response.
export function useMenuItem(id: string, locale: BackendLocale = DEFAULT_BACKEND_LOCALE) {
  return useQuery<ItemDetail>({
    queryKey: ["menu", "item", locale, id],
    queryFn: () => fetchJson(`/menu/items/${id}?locale=${locale}`),
    enabled: Boolean(id),
    staleTime: 5 * 60_000
  });
}

// Backend: wired.
export function useOriginCard(id: string) {
  return useQuery<OriginCardView>({
    queryKey: ["menu", "origin", id],
    queryFn: () => fetchJson(`/menu/origins/${id}`),
    enabled: Boolean(id),
    staleTime: 5 * 60_000
  });
}

// Backend: wired. Staff lookup. query_type is required by contract.
export function useStaffLookup() {
  return useMutation({
    mutationFn: async (body: StaffLookupRequest) => {
      const { data, error } = await apiClient.POST("/staff/lookup", { body });
      if (error) throw error;
      return data;
    }
  });
}

// Backend: wired. Create missing-points claim.
export function useSubmitClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateMissingPointsClaimRequest) => {
      const { data, error } = await apiClient.POST("/missing-points-claims", {
        body
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "claims"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "activity"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "balance"] });
    }
  });
}

// Backend: stubbed (returns 501). MSW serves in dev.
export function useSubmitFeedback(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: FeedbackRequest) => {
      const { data, error } = await apiClient.POST(
        "/me/orders/{order_id}/feedback",
        { params: { path: { order_id: orderId } }, body }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me", "activity"] });
    }
  });
}

// =============================================================================
// Identity hooks — backend's auth_identities + user_profiles model.
//
// All mutations use meta.silent so a 409 IdentityConflict surfaces to the
// caller's onError as a typed body (via parseIdentityConflict). The global
// QueryProvider toast handler skips IdentityConflict shapes so the inline
// manual-resolution UX (Paper artboards: email_taken / phone_taken /
// last_method_cant_remove) renders without a competing toast.
// =============================================================================

// Backend: wired. Returns user_id (us_xxx), verified-contact flags, and the
// canonical linked_providers list for /estudio.
export function useIdentity() {
  return useQuery({
    queryKey: ["me", "identity"],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/me/identity");
      if (error) throw error;
      return data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true
  });
}

function invalidateIdentity(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["me"] });
  void queryClient.invalidateQueries({ queryKey: ["me", "identity"] });
  void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
}

// Backend: wired.
export function useAddEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async (body: AddEmailRequest) => {
      const { data, error } = await apiClient.POST("/me/email", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// Backend: wired.
export function useRemoveEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async () => {
      const { error } = await apiClient.DELETE("/me/email");
      if (error) throw error;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// Backend: wired. Preflight only — backend checks uniqueness, returns 202
// { ready: true }. Firebase owns OTP delivery and verification. Frontend
// must then call linkPhone via AuthProvider to drive Firebase OTP, refresh
// the ID token (so it carries a verified phone_number claim), and POST
// /me/phone/confirm via useConfirmPhone() to actually bind the phone.
export function useAddPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async (body: AddPhoneRequest) => {
      const { data, error } = await apiClient.POST("/me/phone", { body });
      if (error) throw error;
      return data;
    },
    // No-op on success — confirm is the binding step. Keep onSuccess invalidate
    // out of preflight so an unconfirmed preflight doesn't churn /me caches.
    onSuccess: () => {
      // intentional: no invalidation until /me/phone/confirm succeeds
      void queryClient;
    }
  });
}

// Backend: wired. Confirms the Firebase-verified phone (token must include
// phone_number claim) and binds it to the Deriva user_profile. Returns the
// new LinkedProvider row. 403 means the token lacks a verified phone_number;
// 409 means the phone or provider subject is already taken.
export function useConfirmPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async () => {
      const { data, error } = await apiClient.POST("/me/phone/confirm");
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// Backend: wired. DELETE /me/phone removes the phone provider when at
// least one other login/contact method remains; 409 last_method_cant_remove
// otherwise. /me/phone/confirm is POST-only (binds the Firebase-verified
// phone after OTP) — DELETE belongs on the bare /me/phone path.
export function useRemovePhone() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async () => {
      const { error } = await apiClient.DELETE("/me/phone");
      if (error) throw error;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// Backend: wired. Records the provider linkage server-side after Firebase
// linkWithCredential succeeds on the client.
export function useLinkProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async (body: LinkProviderRequest) => {
      const { data, error } = await apiClient.POST("/me/link-provider", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// Backend: wired.
export function useUnlinkProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: async (provider: LinkedProvider["provider"]) => {
      const { error } = await apiClient.DELETE("/me/link-provider/{provider}", {
        params: { path: { provider } }
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateIdentity(queryClient)
  });
}

// =============================================================================
// Hooks still using plain fetch. Protected backend routes receive Firebase auth
// through fetchJson; UI view-only routes remain MSW-served in dev.
// =============================================================================

// Backend: wired. ?locale picks the localized reward name + label copy on
// the response. The frontend renders those fields verbatim.
export function useMyRewards(locale: BackendLocale = DEFAULT_BACKEND_LOCALE) {
  return useQuery<{ rewards: RewardDetailed[]; total: number }>({
    queryKey: ["me", "rewards", locale],
    queryFn: () => fetchJson(`/me/rewards?locale=${locale}`),
    staleTime: 30_000,
    refetchOnWindowFocus: true
  });
}

// Backend: wired.
//
// Identity view (Studio screen) — staleTime: 0 for the same reason as
// useCurrentMember(). The profile carries member_code/backup_code, which we
// want to mirror the backend immediately when the user comes back to the tab.
export function useMemberProfile() {
  return useQuery<MemberProfileView>({
    queryKey: ["me", "profile"],
    queryFn: () => fetchJson("/me/profile"),
    staleTime: 0
  });
}

// Backend: wired.
export function useActivityPreview() {
  return useQuery<{ entries: ActivityPreviewEntry[]; month_summary: string }>({
    queryKey: ["me", "activity", "preview"],
    queryFn: () => fetchJson("/me/activity/preview"),
    staleTime: 10_000
  });
}

// Backend: wired.
export function useActivity() {
  return useQuery<{ entries: ActivityLedgerEntry[]; summary: string }>({
    queryKey: ["me", "activity", "ledger"],
    queryFn: () => fetchJson("/me/activity/ledger"),
    staleTime: 10_000
  });
}

// Backend: wired.
export function useFavorites() {
  return useQuery<FavoritesResponse>({
    queryKey: ["me", "favorites"],
    queryFn: () => fetchJson("/me/favorites"),
    staleTime: 30_000
  });
}

// Backend: wired.
export function useClaims() {
  return useQuery<{ entries: Claim[] }>({
    queryKey: ["me", "claims"],
    queryFn: () => fetchJson("/me/claims")
  });
}

// Backend: wired. §3.5 email-to-phone identity reconciliation. Called from the
// consent step after POST /members succeeds, if a campaign token is present in
// sessionStorage.
export type RedeemCampaignTokenRequest = { token: string };
export type RedeemCampaignTokenResponse = {
  matched: boolean;
  email: string;
  first_name?: string;
};

export class RedeemCampaignTokenError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "RedeemCampaignTokenError";
  }
}

export function useRedeemCampaignToken() {
  const queryClient = useQueryClient();
  return useMutation<RedeemCampaignTokenResponse, RedeemCampaignTokenError, RedeemCampaignTokenRequest>({
    meta: { silent: true },
    mutationFn: async (body) => {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
      const authHeaders = await firebaseAuthHeaders();
      const res = await fetch(`${base}/me/redeem-campaign-token`, {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new RedeemCampaignTokenError(
          res.status,
          `POST /me/redeem-campaign-token failed: ${res.status}`
        );
      }
      return (await res.json()) as RedeemCampaignTokenResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
    }
  });
}

// Canonical: PATCH /me with a partial PatchMeRequest body. The onboarding
// form passes { favorite_drink, milk, note } so we lift it into the contract's
// `preferences` envelope (note → dietary_notes).
export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { favorite_drink?: string; milk?: string; note?: string }) => {
      const { data, error } = await apiClient.PATCH("/me", {
        body: {
          preferences: {
            favorite_drink: body.favorite_drink,
            milk: body.milk,
            dietary_notes: body.note
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
    }
  });
}

// Re-export the typed client for code that needs raw access.
export { apiClient };
