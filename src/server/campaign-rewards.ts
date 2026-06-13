"use server";

import { isStaffUnlocked } from "./staff-match-up";
import {
  validateReward,
  redeemReward,
  type CampaignReward
} from "../api/campaign-rewards";

export type RewardCardState =
  | { status: "idle" }
  | { status: "locked" }
  | { status: "found"; reward: CampaignReward }
  | { status: "not_found" }
  | { status: "unauthorized" }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

const COPY = {
  generic: "No pudimos validar el código. Inténtalo de nuevo.",
  unconfigured: "El canje no está configurado. Avisa a administración.",
  notFound: "Código no encontrado.",
  unauthorized: "Sesión de barra no válida. Vuelve a ingresar el código de la barra."
} as const;

function code(form: FormData): string {
  const v = form.get("code");
  return typeof v === "string" ? v.trim() : "";
}

export async function lookupRewardAction(
  _prev: RewardCardState,
  formData: FormData
): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const c = code(formData);
  if (!c) return { status: "error", message: "Ingresa o escanea un código." };

  const result = await validateReward(c);
  if (result.ok) return { status: "found", reward: result.reward };
  switch (result.kind) {
    case "not_found":
      return { status: "not_found" };
    case "unauthorized":
      return { status: "unauthorized" };
    case "unconfigured":
      return { status: "unconfigured" };
    default:
      return { status: "error", message: COPY.generic };
  }
}

export async function redeemRewardAction(
  _prev: RewardCardState,
  formData: FormData
): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const c = code(formData);
  if (!c) return { status: "error", message: "Falta el código." };
  const notes = typeof formData.get("notes") === "string" ? (formData.get("notes") as string).trim() : "";

  const result = await redeemReward(c, notes || undefined);
  if (result.ok) return { status: "found", reward: result.reward };
  switch (result.kind) {
    case "already_redeemed":
    case "expired": {
      // Re-fetch so the card reflects the authoritative current state.
      const fresh = await validateReward(c);
      if (fresh.ok) return { status: "found", reward: fresh.reward };
      return { status: "error", message: COPY.generic };
    }
    case "not_found":
      return { status: "not_found" };
    case "unauthorized":
      return { status: "unauthorized" };
    case "unconfigured":
      return { status: "unconfigured" };
    default:
      return { status: "error", message: COPY.generic };
  }
}

// Server-side pre-validation used by the [code] page so the QR lands straight
// on the card without a manual "Validar" tap.
export async function prevalidate(codeValue: string): Promise<RewardCardState> {
  if (!(await isStaffUnlocked())) return { status: "locked" };
  const result = await validateReward(codeValue);
  if (result.ok) return { status: "found", reward: result.reward };
  if (result.kind === "not_found") return { status: "not_found" };
  if (result.kind === "unauthorized") return { status: "unauthorized" };
  if (result.kind === "unconfigured") return { status: "unconfigured" };
  return { status: "error", message: COPY.generic };
}
