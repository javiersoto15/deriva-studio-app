"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitMatchUpAction,
  type MatchUpFormState
} from "../../../../src/server/match-up";

const initialState: MatchUpFormState = { status: "idle" };

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

// Wrapper holds a round counter so "Igualar otro" can remount the inner form
// with a fresh useActionState (which has no built-in reset) for the next
// customer — the PIN cookie persists across rounds.
export function StaffMatchUpForm() {
  const [round, setRound] = useState(0);
  return <MatchUpRound key={round} onReset={() => setRound((r) => r + 1)} />;
}

function MatchUpRound({ onReset }: { onReset: () => void }) {
  const [state, formAction] = useActionState(submitMatchUpAction, initialState);
  const [priceDigits, setPriceDigits] = useState("");

  const rutId = useId();
  const placeId = useId();
  const coffeeId = useId();
  const priceId = useId();

  if (state.status === "success") {
    return <Cobrale state={state} onReset={onReset} />;
  }
  if (state.status === "duplicate") {
    return <Duplicate onReset={onReset} />;
  }
  if (state.status === "expired") {
    return <Expired />;
  }

  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const priceGrouped = priceDigits
    ? new Intl.NumberFormat("es-CL").format(Number(priceDigits))
    : "";

  return (
    <form className="resenas-form matchup-staffform" action={formAction} noValidate>
      <input type="hidden" name="competitor_price_clp" value={priceDigits} />

      <div className="matchup-staffform__head">
        <div className="landing-slug">
          <span className="landing-slug__rule" aria-hidden="true" />
          <span>§ Igualar un café</span>
        </div>
        <h1 className="resenas-head__title">
          Datos de <em>la boleta.</em>
        </h1>
      </div>

      {/* 01 · RUT del cliente */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          01
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={rutId}>
            RUT del cliente
          </label>
          <input
            id={rutId}
            name="rut"
            type="text"
            autoComplete="off"
            maxLength={13}
            placeholder="12.345.678-5"
            className="resenas-input resenas-input--mono"
            aria-invalid={Boolean(errors?.rut)}
            aria-describedby={`${rutId}-note`}
          />
          <p id={`${rutId}-note`} className="matchup-note">
            Tómalo del carnet. Se guarda cifrado, nunca en claro.
          </p>
          {errors?.rut && (
            <p className="resenas-error" role="alert">
              {errors.rut}
            </p>
          )}
        </div>
      </div>

      {/* 02 · Dónde lo compra */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          02
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={placeId}>
            ¿Dónde lo compra?
          </label>
          <input
            id={placeId}
            name="competitor_place"
            type="text"
            maxLength={120}
            autoComplete="off"
            placeholder="La cafetería de siempre…"
            className="resenas-input"
            aria-invalid={Boolean(errors?.competitor_place)}
          />
          {errors?.competitor_place && (
            <p className="resenas-error" role="alert">
              {errors.competitor_place}
            </p>
          )}
        </div>
      </div>

      {/* 03 · Qué café */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          03
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={coffeeId}>
            ¿Qué café?
          </label>
          <input
            id={coffeeId}
            name="coffee_name"
            type="text"
            maxLength={120}
            autoComplete="off"
            placeholder="Un americano, un cortado…"
            className="resenas-input"
            aria-invalid={Boolean(errors?.coffee_name)}
          />
          {errors?.coffee_name && (
            <p className="resenas-error" role="alert">
              {errors.coffee_name}
            </p>
          )}
        </div>
      </div>

      {/* 04 · Cuánto pagó */}
      <div className="resenas-row">
        <span className="resenas-row__num" aria-hidden="true">
          04
        </span>
        <div className="resenas-row__body">
          <label className="resenas-label" htmlFor={priceId}>
            ¿Cuánto pagó?
          </label>
          <div className="matchup-amount">
            <span className="matchup-amount__sign" aria-hidden="true">
              $
            </span>
            <input
              id={priceId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={priceGrouped}
              onChange={(e) =>
                setPriceDigits(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
              }
              placeholder="1.200"
              className="resenas-input resenas-input--mono matchup-amount__input"
              aria-invalid={Boolean(errors?.competitor_price_clp)}
              aria-describedby={`${priceId}-unit`}
            />
            <span id={`${priceId}-unit`} className="matchup-amount__unit">
              CLP
            </span>
          </div>
          {errors?.competitor_price_clp && (
            <p className="resenas-error" role="alert">
              {errors.competitor_price_clp}
            </p>
          )}
        </div>
      </div>

      {state.status === "error" && !errors && (
        <p className="resenas-formerror" role="alert">
          {state.message}
        </p>
      )}

      <div className="resenas-submitblock">
        <SubmitButton />
        <p className="matchup-terms">
          Válido hasta el 30 de junio · una vez por RUT · precio mínimo Deriva{" "}
          {clp.format(1600)}.
        </p>
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="resenas-submit" disabled={pending}>
      {pending ? "Igualando…" : "Igualar mi café"}
    </button>
  );
}

function Cobrale({
  state,
  onReset
}: {
  state: Extract<MatchUpFormState, { status: "success" }>;
  onReset: () => void;
}) {
  const matchedAtFloor = state.matchedPriceClp > state.competitorPriceClp;
  return (
    <div className="matchup-result" role="status" aria-live="polite">
      <div className="matchup-result__mark" aria-hidden="true" />
      <p className="matchup-result__title">Café igualado.</p>
      <div className="matchup-reveal matchup-reveal--charge">
        <span className="matchup-reveal__label">Cóbrale</span>
        <span className="matchup-reveal__price">
          {clp.format(state.matchedPriceClp)}
        </span>
        <span className="matchup-reveal__sub">
          Por su {state.coffeeName} — pagó {clp.format(state.competitorPriceClp)}{" "}
          en {state.competitorPlace}.
          {matchedAtFloor ? " Aplicamos el mínimo Deriva." : ""}
        </span>
      </div>
      <p className="resenas-success__body">
        Sirve el café a ese precio. Esta igualación queda registrada para este
        RUT — válido una vez por persona.
      </p>
      <button type="button" className="matchup-staff__again" onClick={onReset}>
        Igualar otro →
      </button>
    </div>
  );
}

function Duplicate({ onReset }: { onReset: () => void }) {
  return (
    <div className="matchup-result" role="status" aria-live="polite">
      <div className="matchup-result__mark matchup-result__mark--dim" aria-hidden="true" />
      <p className="matchup-result__title matchup-result__title--dim">
        Este RUT ya usó su igualación.
      </p>
      <p className="resenas-success__body">
        La campaña es una vez por persona, y este RUT ya la usó. No corresponde
        igualar de nuevo.
      </p>
      <button type="button" className="matchup-staff__again" onClick={onReset}>
        Atender a otro →
      </button>
    </div>
  );
}

function Expired() {
  return (
    <div className="matchup-result" role="status" aria-live="polite">
      <div className="matchup-result__mark matchup-result__mark--dim" aria-hidden="true" />
      <p className="matchup-result__title matchup-result__title--dim">
        La campaña terminó.
      </p>
      <p className="resenas-success__body">
        Deriva Match Up estuvo disponible hasta el 30 de junio. Ya no se pueden
        registrar nuevas igualaciones.
      </p>
    </div>
  );
}
