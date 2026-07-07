"use server";

import { isStaffUnlocked } from "./staff-match-up";
import {
  redeemWalletReward,
  type WalletRedemption
} from "../api/wallet-redemptions";

export type WalletRedemptionState =
  | { status: "idle" }
  | { status: "locked" }
  | { status: "redeemed"; redemption: WalletRedemption }
  | { status: "error"; message: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeManualCode(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.searchParams.get("short_code") ?? url.searchParams.get("code") ?? trimmed;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export async function redeemWalletRewardAction(
  _previous: WalletRedemptionState,
  formData: FormData
): Promise<WalletRedemptionState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const token = field(formData, "token");
  const shortCode = normalizeManualCode(field(formData, "short_code"));
  const reason = field(formData, "reason");

  const result = await redeemWalletReward({
    token: token || undefined,
    short_code: shortCode || undefined,
    reason: reason || undefined
  });

  if (result.ok) return { status: "redeemed", redemption: result.redemption };
  switch (result.kind) {
    case "invalid":
      return { status: "error", message: "Escanea el QR o ingresa el código corto." };
    case "unconfigured":
      return { status: "error", message: "El canje no está configurado. Avisa a administración." };
    case "unauthorized":
      return { status: "error", message: "Sesión de barra no válida." };
    case "rejected":
      return { status: "error", message: result.message ?? "Código vencido, usado o sin puntos suficientes." };
    default:
      return { status: "error", message: "No pudimos registrar el canje. Inténtalo de nuevo." };
  }
}
