"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  unlockStaffMatchUp,
  type StaffUnlockState
} from "../../../../src/server/staff-match-up";

const initialState: StaffUnlockState = { status: "idle" };

export function StaffUnlock() {
  const [state, formAction] = useActionState(unlockStaffMatchUp, initialState);
  const router = useRouter();

  // On a correct PIN the action sets the cookie and returns "ok"; refresh so
  // the server component re-reads it and renders the form.
  useEffect(() => {
    if (state.status === "ok") router.refresh();
  }, [state.status, router]);

  const error = state.status === "error" ? state.message : undefined;

  return (
    <form className="matchup-unlock" action={formAction} noValidate>
      <div className="matchup-unlock__crest" aria-hidden="true">
        <span className="matchup-unlock__diamond" />
        <span className="matchup-unlock__rule">
          <span className="matchup-unlock__tick" />
          <span>Barra · Staff</span>
          <span className="matchup-unlock__tick" />
        </span>
      </div>

      <div className="matchup-unlock__head">
        <h1 className="matchup-unlock__title">
          Deriva <em>Match Up</em>
        </h1>
        <p className="matchup-unlock__sub">
          Ingresa el código de la barra para abrir la herramienta.
        </p>
      </div>

      <div className="matchup-unlock__field">
        <label className="resenas-label" htmlFor="staff-pin">
          Código de la barra
        </label>
        <input
          id="staff-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={12}
          className="matchup-unlock__input"
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p className="resenas-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <UnlockButton />
      <span className="matchup-unlock__note">
        La sesión queda abierta por el turno (12 h).
      </span>
    </form>
  );
}

function UnlockButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="matchup-unlock__btn" disabled={pending}>
      {pending ? "Abriendo…" : "Abrir herramienta"}
    </button>
  );
}
