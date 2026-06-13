import "server-only";

import { staffBearerToken } from "../server/staff-token";

// Typed client for the protected staff campaign-reward endpoints.
//
// BACKEND CONTRACT (13_companion_backend/docs/openapi.yaml):
//   GET  /staff/campaign-rewards/{code}          → CampaignReward (200)
//   POST /staff/campaign-rewards/{code}/redeem    → CampaignReward (200)
//   401/403 → not authorized ; 404 → not found ; 409 → already redeemed ;
//   410 → expired. Auth: Bearer (Firebase staff/manager/owner). We attach a
//   server-held token (never the browser's). Never throws on transport.

function resolveBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

export type CampaignRewardStatus = "issued" | "redeemed" | "expired";

export type CampaignReward = {
  id: string;
  campaign_id: string;
  email: string;
  reward_label: string;
  reward_description?: string;
  short_code: string;
  qr_payload_url: string;
  status: CampaignRewardStatus;
  valid_from: string;
  expires_at: string;
  issued_at: string;
  redeemed_at?: string;
  redeemed_by_actor_id?: string;
  redemption_notes?: string;
};

export type RewardLookupResult =
  | { ok: true; reward: CampaignReward }
  | { ok: false; kind: "not_found"; status: number }
  | { ok: false; kind: "unauthorized"; status: number }
  | { ok: false; kind: "unconfigured" }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

export type RewardRedeemResult =
  | { ok: true; reward: CampaignReward }
  | { ok: false; kind: "already_redeemed"; status: number } // 409
  | { ok: false; kind: "expired"; status: number } // 410
  | { ok: false; kind: "not_found"; status: number }
  | { ok: false; kind: "unauthorized"; status: number }
  | { ok: false; kind: "unconfigured" }
  | { ok: false; kind: "server"; status: number; message?: string }
  | { ok: false; kind: "network"; message?: string };

const REQUEST_TIMEOUT_MS = 8000;

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}

function authHeaders(): Record<string, string> | null {
  const token = staffBearerToken();
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export async function validateReward(code: string): Promise<RewardLookupResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, kind: "unconfigured" };

  const url = `${resolveBaseUrl()}/staff/campaign-rewards/${encodeURIComponent(code)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const reward = (await res.json()) as CampaignReward;
      return { ok: true, reward };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  if (res.status === 401 || res.status === 403) return { ok: false, kind: "unauthorized", status: res.status };
  if (res.status === 404) return { ok: false, kind: "not_found", status: res.status };
  return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
}

export async function redeemReward(code: string, notes?: string): Promise<RewardRedeemResult> {
  const headers = authHeaders();
  if (!headers) return { ok: false, kind: "unconfigured" };

  const url = `${resolveBaseUrl()}/staff/campaign-rewards/${encodeURIComponent(code)}/redeem`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(notes ? { notes } : {}),
      signal: controller.signal,
      cache: "no-store"
    });
  } catch (error) {
    clearTimeout(timeout);
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }
  clearTimeout(timeout);

  if (res.ok) {
    try {
      const reward = (await res.json()) as CampaignReward;
      return { ok: true, reward };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  switch (res.status) {
    case 401:
    case 403:
      return { ok: false, kind: "unauthorized", status: res.status };
    case 404:
      return { ok: false, kind: "not_found", status: res.status };
    case 409:
      return { ok: false, kind: "already_redeemed", status: res.status };
    case 410:
      return { ok: false, kind: "expired", status: res.status };
    default:
      return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
  }
}
