import "server-only";

import { staffBearerToken } from "../server/staff-token";

function resolveBaseUrl(): string {
  const explicit =
    process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;
  return process.env.DERIVA_BACKEND_PROXY_URL ?? "http://localhost:8080";
}

export type WalletRedemption = {
  id: string;
  member_id: string;
  reward_id: string;
  actor_id: string;
  points_cost_at_redemption: number;
  reason?: string;
  created_at: string;
};

export type WalletRedeemResult =
  | { ok: true; redemption: WalletRedemption }
  | { ok: false; kind: "invalid" }
  | { ok: false; kind: "unauthorized"; status: number }
  | { ok: false; kind: "rejected"; status: number; message?: string }
  | { ok: false; kind: "unconfigured" }
  | { ok: false; kind: "network"; message?: string }
  | { ok: false; kind: "server"; status: number; message?: string };

function authHeaders(): Record<string, string> | null {
  const token = staffBearerToken();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json"
  };
}

async function safeErrorMessage(res: Response): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error;
  } catch {
    return undefined;
  }
}

export async function redeemWalletReward(input: {
  token?: string;
  short_code?: string;
  reason?: string;
}): Promise<WalletRedeemResult> {
  const token = input.token?.trim();
  const shortCode = input.short_code?.trim();
  if (!token && !shortCode) return { ok: false, kind: "invalid" };

  const headers = authHeaders();
  if (!headers) return { ok: false, kind: "unconfigured" };

  let res: Response;
  try {
    res = await fetch(`${resolveBaseUrl()}/staff/redemptions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(token ? { token } : {}),
        ...(shortCode ? { short_code: shortCode } : {}),
        reason: input.reason?.trim() || "staff wallet reward redemption"
      }),
      cache: "no-store"
    });
  } catch (error) {
    return { ok: false, kind: "network", message: error instanceof Error ? error.message : "network error" };
  }

  if (res.ok) {
    try {
      return { ok: true, redemption: (await res.json()) as WalletRedemption };
    } catch {
      return { ok: false, kind: "server", status: res.status };
    }
  }
  if (res.status === 401 || res.status === 403) return { ok: false, kind: "unauthorized", status: res.status };
  if (res.status === 400 || res.status === 404 || res.status === 409) {
    return { ok: false, kind: "rejected", status: res.status, message: await safeErrorMessage(res) };
  }
  return { ok: false, kind: "server", status: res.status, message: await safeErrorMessage(res) };
}
