"use client";

import { useActionState } from "react";
import { requestEventQuote, type QuoteState } from "../../../src/server/eventos-quote";

const KINDS = ["Oficina", "Celebración", "Encuentro de equipo", "Otro"] as const;
const initial: QuoteState = { status: "idle" };

export function QuoteForm() {
  const [state, action, pending] = useActionState(requestEventQuote, initial);

  if (state.status === "success") {
    return (
      <div className="ev-form ev-form--done" role="status">
        <span className="ev-corner ev-corner--ochre">Solicitud recibida</span>
        <p className="ev-form__done">
          Gracias. Te respondemos por correo con la <em>cotización.</em>
        </p>
      </div>
    );
  }

  return (
    <form className="ev-form" action={action} noValidate={false}>
      <fieldset className="ev-form__kinds">
        <legend className="ev-form__label">Tipo de evento</legend>
        <div className="ev-chips">
          {KINDS.map((kind, i) => (
            <label key={kind} className="ev-chip">
              <input type="radio" name="kind" value={kind} defaultChecked={i === 0} required />
              <span>{kind}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="ev-form__grid">
        <label className="ev-field">
          <span className="ev-form__label">Nombre</span>
          <input name="name" autoComplete="name" required maxLength={80} />
        </label>
        <label className="ev-field">
          <span className="ev-form__label">Correo</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label className="ev-field">
          <span className="ev-form__label">Teléfono · opcional</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={30} />
        </label>
        <label className="ev-field">
          <span className="ev-form__label">Fecha</span>
          <input name="date" type="date" />
        </label>
        <label className="ev-field">
          <span className="ev-form__label">Personas</span>
          <input name="people" type="number" inputMode="numeric" min={1} max={2000} required />
        </label>
        <label className="ev-field">
          <span className="ev-form__label">Cafés aprox. · si lo sabes</span>
          <input name="drinks" inputMode="numeric" maxLength={20} />
        </label>
        <label className="ev-field ev-field--wide">
          <span className="ev-form__label">Lugar o comuna</span>
          <input name="place" maxLength={120} />
        </label>
        <label className="ev-field ev-field--wide">
          <span className="ev-form__label">Cuéntanos más · opcional</span>
          <textarea name="message" rows={3} maxLength={1500} />
        </label>
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <label className="ev-hp" aria-hidden="true">
        Empresa
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      {state.status === "error" ? (
        <p className="ev-form__error" role="alert">
          {state.message}
        </p>
      ) : null}

      <button className="ev-submit" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Pedir cotización →"}
      </button>
    </form>
  );
}
