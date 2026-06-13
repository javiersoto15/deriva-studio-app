"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  lookupRewardAction,
  redeemRewardAction,
  type RewardCardState
} from "../../../../src/server/campaign-rewards";

function tz(iso?: string): string {
  if (!iso) return "";
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

const STATUS_LABEL: Record<string, string> = {
  issued: "Vigente",
  redeemed: "Canjeado",
  expired: "Expirado"
};

export function RewardValidator({
  initialCode = "",
  initialState
}: {
  initialCode?: string;
  initialState: RewardCardState;
}) {
  const [lookupState, lookupAction] = useActionState(
    lookupRewardAction,
    initialState
  );
  const [redeemState, redeemAction] = useActionState(
    redeemRewardAction,
    { status: "idle" } as RewardCardState
  );

  // The redeem result (when present) supersedes the lookup result.
  const state = redeemState.status !== "idle" ? redeemState : lookupState;

  return (
    <div className="redeem">
      {/* Lookup form — hidden once we already have a reward from the URL token. */}
      {state.status !== "found" && (
        <form className="redeem__lookup" action={lookupAction} noValidate>
          <label className="redeem__label" htmlFor="redeem-code">
            Código de la recompensa
          </label>
          <input
            id="redeem-code"
            name="code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            defaultValue={initialCode}
            placeholder="Escanea el QR o escribe el código"
            className="redeem__input"
            autoFocus
          />
          <LookupButton />
          <ResultMessage state={state} />
        </form>
      )}

      {state.status === "found" && (
        <RewardCard reward={state.reward} redeemAction={redeemAction} />
      )}
    </div>
  );
}

function RewardCard({
  reward,
  redeemAction
}: {
  reward: NonNullable<Extract<RewardCardState, { status: "found" }>["reward"]>;
  redeemAction: (formData: FormData) => void;
}) {
  const redeemable = reward.status === "issued";
  return (
    <div className="redeem__card">
      <div className="redeem__head">
        <span className="redeem__mast">Polla del Mundial · Canje</span>
        <span className="redeem__code">{reward.short_code}</span>
      </div>

      <h2 className="redeem__reward">{reward.reward_label}</h2>
      {reward.reward_description && (
        <p className="redeem__desc">{reward.reward_description}</p>
      )}

      <dl className="redeem__meta">
        <div>
          <dt>Estado</dt>
          <dd>
            <span className={`redeem__badge redeem__badge--${reward.status}`}>
              {STATUS_LABEL[reward.status] ?? reward.status}
            </span>
          </dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{reward.email}</dd>
        </div>
        <div>
          <dt>Emitido</dt>
          <dd>{tz(reward.valid_from)}</dd>
        </div>
        <div>
          <dt>Válido hasta</dt>
          <dd>{tz(reward.expires_at)}</dd>
        </div>
        {reward.redeemed_at && (
          <div>
            <dt>Canjeado</dt>
            <dd>{tz(reward.redeemed_at)}</dd>
          </div>
        )}
      </dl>

      {redeemable ? (
        <form action={redeemAction} className="redeem__redeem">
          <input type="hidden" name="code" value={reward.short_code} />
          <input
            name="notes"
            type="text"
            placeholder="Nota (opcional)"
            className="redeem__input redeem__input--notes"
            autoComplete="off"
          />
          <RedeemButton />
        </form>
      ) : reward.status === "redeemed" ? (
        <p className="redeem__stamp">
          Canjeado · {tz(reward.redeemed_at) || "registrado"}
        </p>
      ) : (
        <p className="redeem__closed">Esta recompensa expiró.</p>
      )}
    </div>
  );
}

function LookupButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="redeem__btn redeem__btn--ghost"
      disabled={pending}
    >
      {pending ? "Validando…" : "Validar"}
    </button>
  );
}

function RedeemButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="redeem__btn redeem__btn--primary"
      disabled={pending}
    >
      {pending ? "Canjeando…" : "Canjear café"}
    </button>
  );
}

function ResultMessage({ state }: { state: RewardCardState }) {
  if (state.status === "not_found")
    return (
      <p className="redeem__msg" role="alert">
        Código no encontrado.
      </p>
    );
  if (state.status === "unauthorized")
    return (
      <p className="redeem__msg" role="alert">
        Sesión de barra no válida.
      </p>
    );
  if (state.status === "unconfigured")
    return (
      <p className="redeem__msg" role="alert">
        El canje no está configurado. Avisa a administración.
      </p>
    );
  if (state.status === "error")
    return (
      <p className="redeem__msg" role="alert">
        {state.message}
      </p>
    );
  return null;
}
