"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  redeemWalletRewardAction,
  type WalletRedemptionState
} from "../../../../../src/server/wallet-redemptions";

function tz(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function WalletRewardRedeemer({
  initialToken = "",
  initialShortCode = ""
}: {
  initialToken?: string;
  initialShortCode?: string;
}) {
  const [state, action] = useActionState(
    redeemWalletRewardAction,
    { status: "idle" } as WalletRedemptionState
  );

  return (
    <div className="redeem">
      <form className="redeem__lookup" action={action} noValidate>
        <input type="hidden" name="token" value={initialToken} />
        <label className="redeem__label" htmlFor="wallet-short-code">
          Código de recompensa de miembro
        </label>
        <input
          id="wallet-short-code"
          name="short_code"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          defaultValue={initialShortCode}
          placeholder="Escanea el QR o escribe RWD-ABCD"
          className="redeem__input"
          autoFocus={!initialToken}
        />
        <input
          name="reason"
          type="text"
          placeholder="Nota (opcional)"
          className="redeem__input redeem__input--notes"
          autoComplete="off"
        />
        <RedeemButton hasToken={Boolean(initialToken)} />
        <Result state={state} />
      </form>
    </div>
  );
}

function RedeemButton({ hasToken }: { hasToken: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="redeem__btn redeem__btn--primary"
      disabled={pending}
    >
      {pending ? "Canjeando..." : hasToken ? "Canjear QR" : "Canjear codigo"}
    </button>
  );
}

function Result({ state }: { state: WalletRedemptionState }) {
  if (state.status === "redeemed") {
    return (
      <div className="redeem__card" role="status">
        <div className="redeem__head">
          <span className="redeem__mast">Miembro · Canje</span>
          <span className="redeem__code">Canjeado</span>
        </div>
        <h2 className="redeem__reward">Recompensa registrada.</h2>
        <dl className="redeem__meta">
          <div>
            <dt>Miembro</dt>
            <dd>{state.redemption.member_id}</dd>
          </div>
          <div>
            <dt>Reward</dt>
            <dd>{state.redemption.reward_id}</dd>
          </div>
          <div>
            <dt>Puntos</dt>
            <dd>{state.redemption.points_cost_at_redemption}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{tz(state.redemption.created_at)}</dd>
          </div>
        </dl>
        <p className="redeem__stamp">Descuento aplicado en Deriva</p>
      </div>
    );
  }
  if (state.status === "locked") {
    return (
      <p className="redeem__msg" role="alert">
        Vuelve a ingresar el codigo de barra.
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p className="redeem__msg" role="alert">
        {state.message}
      </p>
    );
  }
  return null;
}
